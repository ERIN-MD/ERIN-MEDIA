import axios from "axios";
import { lookup } from "node:dns/promises";

const MAX_BYTES = 25 * 1024 * 1024;
const REQUEST_TIMEOUT = 60_000;
const MAX_REDIRECTS = 4;

const pluginConfig = {
  name: "ريد",
  alias: [],
  category: "tools",
  description: "جلب ملف عام من رابط أو صفحة، والبحث عن صورة عامة",
  usage: ".ريد <رابط> أو .ريد بحث <عبارة>",
  example: ".ريد بحث قطة بيضاء",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 12,
  energi: 1,
  isEnabled: true,
};

function isPrivateAddress(address = "") {
  const value = String(address).toLowerCase();

  if (value.includes(":")) {
    return (
      value === "::1" ||
      value.startsWith("fc") ||
      value.startsWith("fd") ||
      value.startsWith("fe80:") ||
      value.startsWith("::ffff:127.") ||
      value.startsWith("::ffff:10.") ||
      value.startsWith("::ffff:192.168.") ||
      /^::ffff:172\.(1[6-9]|2\d|3[0-1])\./.test(value)
    );
  }

  const parts = value.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

async function assertPublicUrl(value) {
  let target;

  try {
    target = new URL(String(value || "").trim());
  } catch {
    throw new Error("الرابط غير صالح.");
  }

  if (!["http:", "https:"].includes(target.protocol)) {
    throw new Error("يسمح فقط بروابط HTTP أو HTTPS.");
  }

  const host = target.hostname.toLowerCase();
  if (!host || host === "localhost" || host.endsWith(".local")) {
    throw new Error("لا يسمح بالروابط الداخلية أو المحلية.");
  }

  const addresses = await lookup(host, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((entry) => isPrivateAddress(entry.address))) {
    throw new Error("الرابط يشير إلى عنوان داخلي غير مسموح.");
  }

  return target;
}

function safeFilename(value = "", fallback = "ملف") {
  const clean = decodeURIComponent(String(value || ""))
    .replace(/^.*[\\/]/, "")
    .replace(/[<>:"|?*\x00-\x1F]/g, "_")
    .trim();

  return clean.slice(0, 110) || fallback;
}

function filenameFromHeaders(headers, target) {
  const disposition = String(headers?.["content-disposition"] || "");
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const normal = disposition.match(/filename\s*=\s*"?([^";]+)"?/i)?.[1];
  const pathName = target.pathname.split("/").filter(Boolean).pop();

  return safeFilename(encoded || normal || pathName || "تحميل");
}

function isRedirect(status) {
  return [301, 302, 303, 307, 308].includes(status);
}

function browserBlockedMessage(text = "") {
  const value = String(text).toLowerCase();
  return (
    value.includes("captcha") ||
    value.includes("cloudflare") ||
    value.includes("verify you are human") ||
    value.includes("sign in to confirm you're not a bot") ||
    value.includes("unusual traffic") ||
    value.includes("access denied")
  );
}

function platformAccessMessage(input, error) {
  let host = "";
  try {
    host = new URL(input).hostname.toLowerCase();
  } catch {}

  if (/(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(host)) {
    return "YouTube طلب تسجيل الدخول أو تحقق «لست روبوتاً» قبل إتاحة الفيديو. ريد لا يتجاوز هذا الشرط؛ استخدم فحص <الرابط> لقراءة البيانات العامة المعلنة.";
  }
  if (/(^|\.)tiktok\.com$/.test(host)) {
    return "TikTok لم يعلن رابط فيديو عاماً قابلاً للإرسال من هذه الصفحة أو طلب تفاعلاً داخل المنصة. ريد لا يتجاوز قيود المنصة؛ استخدم فحص <الرابط> لقراءة البيانات العامة المتاحة.";
  }

  return error?.message || "تحقق من أن الرابط مباشر ومتاح للعامة.";
}

function isNetworkConnectionError(error) {
  const code = String(error?.code || "").toUpperCase();
  const message = String(error?.message || "").toUpperCase();
  return /ETIMEDOUT|ENETUNREACH|EHOSTUNREACH|ECONNREFUSED|ECONNRESET/.test(`${code} ${message}`);
}

function normalizeCandidate(candidate, baseUrl) {
  try {
    const url = new URL(String(candidate || "").trim(), baseUrl);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function directCandidatesFromPageUrl(pageUrl) {
  try {
    const url = new URL(pageUrl);
    const host = url.hostname.toLowerCase();
    const isGoogleImageResult = /(^|\.)google\.[a-z.]+$/.test(host) && url.pathname === "/imgres";
    if (isGoogleImageResult) {
      const imageUrl = url.searchParams.get("imgurl");
      return imageUrl ? [imageUrl] : [];
    }
  } catch {}

  return [];
}

async function withPublicBrowser(work) {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 },
      userAgent: "Tarboo Bot Read Browser/1.0",
    });

    await page.route("**/*", async (route) => {
      try {
        const url = new URL(route.request().url());
        const host = url.hostname.toLowerCase();
        if (host === "localhost" || host.endsWith(".local") || isPrivateAddress(host)) {
          await route.abort();
          return;
        }

        const addresses = await lookup(host, { all: true, verbatim: true });
        if (!addresses.length || addresses.some((entry) => isPrivateAddress(entry.address))) {
          await route.abort();
          return;
        }
      } catch {
        await route.abort();
        return;
      }
      await route.continue();
    });

    return await work(page);
  } finally {
    await browser.close();
  }
}

async function mediaCandidatesFromPage(page) {
  const discovered = await page.evaluate(() => {
    const primary = [];
    const media = [];
    const previews = [];
    const add = (list, value) => {
      if (typeof value === "string" && value.trim()) list.push(value.trim());
    };
    const isFileLink = (value) => /\.(apk|xapk|ipa|exe|dmg|msi|bin|png|jpe?g|webp|gif|mp4|webm|mov|mkv|mp3|m4a|wav|ogg|pdf|zip|rar|7z|tar|gz|epub|docx?|xlsx?|pptx?)(?:$|[?#])/i.test(value);
    const isDownloadControl = (element) => {
      const text = `${element.id || ""} ${element.className || ""} ${element.getAttribute("aria-label") || ""} ${element.getAttribute("title") || ""} ${element.textContent || ""}`.toLowerCase();
      return /download|save|direct|تنزيل|تحميل/.test(text);
    };

    document.querySelectorAll('meta[http-equiv="refresh"]').forEach((element) => {
      const target = String(element.content || "").match(/url\s*=\s*(.+)$/i)?.[1];
      add(primary, target?.replace(/^['"]|['"]$/g, ""));
    });
    document.querySelectorAll("a[download], a#downloadButton, [data-download-url], [data-file-url], [data-url], [data-href]").forEach((element) => {
      add(primary, element.getAttribute("data-download-url"));
      add(primary, element.getAttribute("data-file-url"));
      add(primary, element.getAttribute("data-url"));
      add(primary, element.getAttribute("data-href"));
      add(primary, element.href || element.getAttribute("href"));
    });
    document.querySelectorAll("a[href], button[data-url], button[data-href]").forEach((element) => {
      const href = element.href || element.getAttribute("href") || element.getAttribute("data-url") || element.getAttribute("data-href") || "";
      if (isFileLink(href) || isDownloadControl(element)) add(primary, href);
    });

    const source = document.documentElement.innerHTML;
    const scriptUrlPattern = /(?:download(?:_?url)?|direct(?:_?url)?|file(?:_?url)?)\s*["']?\s*[:=]\s*["'](https?:\\?\/\\?\/[^"'\\\s<>]+)/gi;
    for (const match of source.matchAll(scriptUrlPattern)) {
      add(primary, match[1].replace(/\\\//g, "/"));
    }

    document.querySelectorAll('meta[http-equiv="refresh"]').forEach((element) => {
      const target = String(element.content || "").match(/url\s*=\s*(.+)$/i)?.[1];
      add(primary, target?.replace(/^['"]|['"]$/g, ""));
    });
    document.querySelectorAll('meta[property="og:video"], meta[property="og:video:url"], meta[name="twitter:player:stream"]').forEach((element) => add(media, element.content));
    document.querySelectorAll("video, audio, source").forEach((element) => add(media, element.currentSrc || element.src));
    document.querySelectorAll("a[href]").forEach((element) => {
      const href = element.href || "";
      if (isFileLink(href)) {
        add(primary, href);
      }
    });
    document.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]').forEach((element) => add(previews, element.content));
    document.querySelectorAll("img").forEach((element) => {
      const source = element.currentSrc || element.src;
      const label = `${element.alt || ""} ${element.id || ""} ${element.className || ""} ${source || ""}`.toLowerCase();
      const width = Number(element.naturalWidth || element.width || 0);
      const height = Number(element.naturalHeight || element.height || 0);
      const isGoogleResultThumbnail = /encrypted-tbn\d+\.gstatic\.com\/images/i.test(source || "");
      if (!/logo|icon|favicon|avatar|sprite|branding/.test(label) && (isGoogleResultThumbnail || width > 128 || height > 128)) add(previews, source);
    });

    return {
      primary: [...new Set(primary)].slice(0, 40),
      media: [...new Set(media)].slice(0, 20),
      previews: [...new Set(previews)].slice(0, 20),
      hasDownloadSignals: primary.length > 0,
    };
  });

  const normalizeList = (values) => values.map((candidate) => normalizeCandidate(candidate, page.url())).filter(Boolean);
  const pageUrlCandidates = normalizeList(directCandidatesFromPageUrl(page.url()));
  return {
    primary: [...new Set([...pageUrlCandidates, ...normalizeList(discovered.primary)])],
    media: normalizeList(discovered.media),
    previews: normalizeList(discovered.previews),
    hasDownloadSignals: discovered.hasDownloadSignals,
  };
}

async function followGoogleShareResult(page) {
  let current;
  try {
    current = new URL(page.url());
  } catch {
    return;
  }

  const isGoogleSharePage = /(^|\.)google\.[a-z.]+$/.test(current.hostname.toLowerCase()) && current.pathname === "/share.google";
  if (!isGoogleSharePage) return;

  const relativeTarget = await page.evaluate(() => {
    const source = document.documentElement.innerHTML.replace(/&amp;/g, "&");
    return source.match(/(?:0;)?url=(\/imgres\?[^"'<>\s]+)/i)?.[1] || source.match(/href="(\/imgres\?[^"'<>\s]+)"/i)?.[1] || null;
  });
  if (!relativeTarget) return;

  const target = new URL(relativeTarget, current);
  if (target.origin !== current.origin || target.pathname !== "/imgres") return;
  await assertPublicUrl(target.toString());
  await page.goto(target.toString(), { waitUntil: "domcontentloaded", timeout: 35_000 });
  await page.waitForFunction(
    () => [...document.images].some((image) => image.naturalWidth > 128 || /encrypted-tbn\d+\.gstatic\.com\/images/i.test(image.currentSrc || image.src || "")),
    { timeout: 3_000 },
  ).catch(() => {});
}

async function captureVisibleGoogleImage(page) {
  const sources = await page.locator("img").evaluateAll((images) =>
    images
      .map((image) => ({
        source: image.currentSrc || image.src,
        width: image.naturalWidth || image.width || 0,
        height: image.naturalHeight || image.height || 0,
      }))
      .filter(({ source, width, height }) => /^https?:\/\//i.test(source || "") && !/favicon|logo|icon|branding/i.test(source || "") && (width > 128 || height > 128 || /encrypted-tbn\d+\.gstatic\.com\/images/i.test(source || "")))
      .sort((a, b) => Number(/encrypted-tbn\d+\.gstatic\.com\/images/i.test(b.source)) - Number(/encrypted-tbn\d+\.gstatic\.com\/images/i.test(a.source))),
  );

  for (const entry of sources.slice(0, 5)) {
    try {
      const target = await assertPublicUrl(entry.source);
      await page.goto(target.toString(), { waitUntil: "domcontentloaded", timeout: 35_000 });
      const image = page.locator("img").first();
      await image.waitFor({ state: "visible", timeout: 8_000 });
      const dimensions = await image.evaluate((element) => ({ width: element.naturalWidth, height: element.naturalHeight }));
      if (dimensions.width < 128 || dimensions.height < 128) continue;

      const buffer = await image.screenshot({ type: "png" });
      return {
        buffer,
        mimeType: "image/png",
        filename: "صورة-من-المتصفح.png",
        bytes: buffer.length,
        source: target.toString(),
      };
    } catch (error) {
      console.warn("[ريد] تعذر التقاط الصورة عبر المتصفح:", error?.message || error);
    }
  }

  return null;
}

async function resolveGoogleShareInput(inputUrl) {
  const target = await assertPublicUrl(inputUrl);
  if (target.hostname.toLowerCase() !== "share.google") return target.toString();

  const response = await axios.get(target.toString(), {
    responseType: "text",
    timeout: REQUEST_TIMEOUT,
    maxRedirects: MAX_REDIRECTS,
    maxContentLength: 1_500_000,
    validateStatus: (status) => status >= 200 && status < 400,
    headers: {
      "user-agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      accept: "text/html,application/xhtml+xml",
    },
  });

  const finalUrl = response.request?.res?.responseUrl || target.toString();
  const finalTarget = await assertPublicUrl(finalUrl);
  if (finalTarget.pathname === "/imgres") return finalTarget.toString();

  const source = String(response.data || "").replace(/&amp;/g, "&");
  const relative = source.match(/(?:0;)?url=(\/imgres\?[^"'<>\s]+)/i)?.[1] || source.match(/href="(\/imgres\?[^"'<>\s]+)"/i)?.[1];
  if (!relative) return finalTarget.toString();

  const imageResult = new URL(relative, finalTarget);
  if (imageResult.origin !== finalTarget.origin || imageResult.pathname !== "/imgres") return finalTarget.toString();
  return (await assertPublicUrl(imageResult.toString())).toString();
}

async function discoverFromPage(inputUrl) {
  const target = await assertPublicUrl(inputUrl);

  return withPublicBrowser(async (page) => {
    const response = await page.goto(target.toString(), {
      waitUntil: "domcontentloaded",
      timeout: 35_000,
    });
    await page.waitForFunction(
      () => [...document.images].some((image) => image.naturalWidth > 128 || /encrypted-tbn\d+\.gstatic\.com\/images/i.test(image.currentSrc || image.src || "")),
      { timeout: 3_000 },
    ).catch(() => {});
    await page.waitForTimeout(700);
    await followGoogleShareResult(page);

    await assertPublicUrl(page.url());
    const bodyText = (await page.locator("body").innerText().catch(() => "")).slice(0, 3000);
    if (browserBlockedMessage(bodyText)) {
      throw new Error("الموقع طلب تحققاً بشرياً أو حظر الأتمتة.");
    }

    const candidates = await mediaCandidatesFromPage(page);
    const pageHost = new URL(page.url()).hostname.toLowerCase();
    const isKnownFileHost = /(mediafire|terabox|1024tera|drive\.google|docs\.google|share\.google)/i.test(pageHost);
    const orderedCandidates = [...candidates.primary, ...candidates.media, ...(isKnownFileHost ? [] : candidates.previews)];
    let connectionError;
    for (const candidate of orderedCandidates) {
      try {
        const file = await downloadPublicFile(candidate);
        return {
          ...file,
          title: await page.title(),
          pageUrl: page.url(),
          status: response?.status() || null,
        };
      } catch (error) {
        if (isNetworkConnectionError(error)) connectionError = error;
        console.warn("[ريد] رابط محتوى غير قابل للإرسال:", error?.message || error);
      }
    }

    if (/google\.[a-z.]+$/i.test(pageHost) && connectionError) {
      const browserImage = await captureVisibleGoogleImage(page);
      if (browserImage) {
        return {
          ...browserImage,
          title: await page.title(),
          pageUrl: page.url(),
          status: response?.status() || null,
        };
      }
      throw new Error("شبكة HidenCloud لا تصل حالياً إلى Google عبر HTTPS (مهلة أو مسار شبكة). لا يمكن جلب هذا الرابط المختصر من الخادم؛ انسخ رابط الصورة الأصلي العام أو استخدم: ريد بحث <وصف الصورة>.");
    }

    if (isKnownFileHost || candidates.hasDownloadSignals) {
      throw new Error("وجدت صفحة تنزيل، لكن رابط الملف العام لم يظهر أو كان يتطلب تحققاً أو صلاحية. لن أرسل صورة المعاينة بدلاً من الملف.");
    }

    throw new Error("لم أجد ملفاً عاماً مباشراً قابلاً للإرسال داخل هذه الصفحة.");
  });
}

async function imageCandidatesFromSearch(page, engine) {
  if (engine === "bing") {
    return page.evaluate(() => {
      const values = [];
      const add = (value) => {
        if (typeof value === "string" && /^https?:\/\//i.test(value.trim())) values.push(value.trim());
      };

      document.querySelectorAll("a.iusc").forEach((element) => {
        try {
          const metadata = JSON.parse(element.getAttribute("m") || "{}");
          add(metadata.murl);
          add(metadata.turl);
        } catch {}
      });

      document.querySelectorAll("img").forEach((image) => add(image.currentSrc || image.src));
      return [...new Set(values)].slice(0, 40);
    });
  }

  return page.locator("img").evaluateAll((images) =>
    images
      .map((image) => image.currentSrc || image.src)
      .filter((source) => /^https?:\/\//i.test(source) && !/gstatic\.com\/images\/branding/i.test(source)),
  );
}

async function searchImagesFromEngine(term, engine) {
  const urls = {
    google: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(term)}`,
    bing: `https://www.bing.com/images/search?q=${encodeURIComponent(term)}`,
  };

  return withPublicBrowser(async (page) => {
    await page.goto(urls[engine], { waitUntil: "domcontentloaded", timeout: 35_000 });

    const bodyText = (await page.locator("body").innerText().catch(() => "")).slice(0, 3000);
    if (browserBlockedMessage(bodyText)) {
      throw new Error(`تعذر فتح بحث الصور عبر ${engine === "google" ? "Google" : "Bing"} بسبب تحقق الموقع.`);
    }

    const candidates = await imageCandidatesFromSearch(page, engine);
    for (const candidate of [...new Set(candidates)].slice(0, 25)) {
      try {
        const file = await downloadPublicFile(candidate);
        if (file.mimeType.startsWith("image/")) {
          return { ...file, title: `نتيجة بحث صور: ${term}`, pageUrl: page.url() };
        }
      } catch (error) {
        console.warn("[ريد] صورة بحث غير قابلة للتنزيل:", error?.message || error);
      }
    }

    throw new Error(`لم أجد صورة عامة قابلة للإرسال عبر ${engine === "google" ? "Google" : "Bing"}.`);
  });
}

async function searchGoogleImage(query) {
  const term = String(query || "").trim();
  if (!term) throw new Error("اكتب عبارة البحث بعد كلمة بحث.");

  let lastError;
  for (const engine of ["google", "bing"]) {
    try {
      return await searchImagesFromEngine(term, engine);
    } catch (error) {
      lastError = error;
      console.warn(`[ريد] تعذر بحث الصور عبر ${engine}:`, error?.message || error);
    }
  }

  throw lastError || new Error("لم أجد صورة عامة قابلة للإرسال لهذه العبارة.");
}

async function downloadPublicFile(inputUrl) {
  let target = await assertPublicUrl(inputUrl);

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = await axios.get(target.toString(), {
      responseType: "stream",
      timeout: REQUEST_TIMEOUT,
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
      headers: {
        "user-agent": "Tarboo Bot Read/1.0",
        accept: "image/*,video/*,audio/*,application/pdf,application/octet-stream,*/*;q=0.7",
      },
    });

    if (isRedirect(response.status)) {
      const next = response.headers.location;
      response.data?.destroy?.();
      if (!next) throw new Error("الرابط أعاد تحويلاً بلا وجهة.");
      target = await assertPublicUrl(new URL(next, target).toString());
      continue;
    }

    const declaredSize = Number(response.headers?.["content-length"] || 0);
    if (declaredSize > MAX_BYTES) {
      response.data?.destroy?.();
      throw new Error(`حجم الملف أكبر من الحد المسموح (${Math.floor(MAX_BYTES / 1024 / 1024)}MB).`);
    }

    const mimeType = String(response.headers?.["content-type"] || "application/octet-stream")
      .split(";")[0]
      .trim()
      .toLowerCase();

    if (mimeType === "text/html" || mimeType === "application/json") {
      response.data?.destroy?.();
      throw new Error("هذا رابط صفحة أو استجابة بيانات، وليس رابط ملف مباشر.");
    }

    const chunks = [];
    let total = 0;

    for await (const chunk of response.data) {
      total += chunk.length;
      if (total > MAX_BYTES) {
        response.data.destroy?.();
        throw new Error(`تجاوز الملف الحد المسموح (${Math.floor(MAX_BYTES / 1024 / 1024)}MB).`);
      }
      chunks.push(chunk);
    }

    if (!total) throw new Error("تم تنزيل ملف فارغ.");

    return {
      buffer: Buffer.concat(chunks),
      mimeType,
      filename: filenameFromHeaders(response.headers, target),
      bytes: total,
      source: target.toString(),
    };
  }

  throw new Error("تجاوز الرابط عدد التحويلات المسموح.");
}

async function sendDownloadedFile(sock, m, file) {
  const caption =
    `╭━━〔 📥 *ريد* 〕━━╮\n` +
    `│ الملف: *${file.filename}*\n` +
    `│ النوع: \`${file.mimeType}\`\n` +
    `│ الحجم: *${(file.bytes / 1024 / 1024).toFixed(2)} MB*\n` +
    `╰━━〔 Tarboo Bot 〕━━╯`;

  if (file.mimeType.startsWith("image/")) {
    return sock.sendMessage(m.chat, { image: file.buffer, mimetype: file.mimeType, caption }, { quoted: m });
  }

  if (file.mimeType.startsWith("video/")) {
    return sock.sendMessage(m.chat, { video: file.buffer, mimetype: file.mimeType, caption }, { quoted: m });
  }

  if (file.mimeType.startsWith("audio/")) {
    return sock.sendMessage(m.chat, { audio: file.buffer, mimetype: file.mimeType, ptt: false }, { quoted: m });
  }

  return sock.sendMessage(
    m.chat,
    {
      document: file.buffer,
      mimetype: file.mimeType,
      fileName: file.filename,
      caption,
    },
    { quoted: m },
  );
}

async function handler(m, { sock, text }) {
  const input = String(text || "").trim();

  if (!input) {
    await m.reply(
      `╭━━〔 📥 *ريد* 〕━━╮\n` +
        `│ أرسل رابطاً عاماً أو استخدم: *بحث <كلمة>* للصور.\n` +
        `│ مثال: \`${m.prefix}ريد https://example.com/file.pdf\`\n` +
        `│ مثال: \`${m.prefix}ريد بحث قطة بيضاء\`\n` +
        `│ الحد الأقصى: *25MB*\n` +
        `╰━━〔 Tarboo Bot 〕━━╯`,
    );
    return;
  }

  await m.react?.("🕕").catch(() => {});

  try {
    const searchMatch = input.match(/^(?:بحث|search)\s+(.+)$/i);
    let file;

    if (searchMatch) {
      file = await searchGoogleImage(searchMatch[1]);
    } else {
      try {
        file = await downloadPublicFile(input);
      } catch (directError) {
        const directMessage = String(directError?.message || "");
        if (!/رابط صفحة|استجابة بيانات|ليس رابط ملف مباشر/i.test(directMessage)) throw directError;
        file = await discoverFromPage(await resolveGoogleShareInput(input));
      }
    }

    await sendDownloadedFile(sock, m, file);
    await m.react?.("✅").catch(() => {});
  } catch (error) {
    console.error("[ريد]", error?.message || error);
    await m.react?.("❌").catch(() => {});
    const detail = platformAccessMessage(input, error);
    await m.reply(
      `⚠️ *تعذر جلب الرابط.*\n` +
        `> ${detail}\n` +
        `> ريد لا يتجاوز التسجيل أو CAPTCHA أو Cloudflare أو DRM.\n` +
        `> Tarboo Bot`,
    );
  }
}

export {
  pluginConfig as config,
  handler,
  assertPublicUrl,
  downloadPublicFile,
  isPrivateAddress,
  platformAccessMessage,
};