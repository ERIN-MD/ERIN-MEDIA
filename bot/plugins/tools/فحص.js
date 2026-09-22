import { lookup } from "node:dns/promises";
import { assertPublicUrl, isPrivateAddress } from "./ريد.js";

const pluginConfig = {
  name: "فحص",
  alias: [],
  category: "tools",
  description: "فحص رابط واستخراج معلوماته العامة المعلنة",
  usage: ".فحص <رابط>",
  example: ".فحص https://example.com",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 8,
  energi: 1,
  isEnabled: true,
};

const REQUEST_TIMEOUT = 35_000;

function trimText(value, max = 500) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function protectedPageMessage(text = "") {
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

function readableHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return "غير معروف";
  }
}

async function inspectPublicLink(inputUrl) {
  const target = await assertPublicUrl(inputUrl);
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 },
      userAgent: "Tarboo Bot Public Link Inspector/1.0",
    });

    await page.route("**/*", async (route) => {
      try {
        const url = new URL(route.request().url());
        if (!['http:', 'https:'].includes(url.protocol)) return route.abort();
        const host = url.hostname.toLowerCase();
        if (host === "localhost" || host.endsWith(".local") || isPrivateAddress(host)) return route.abort();

        const addresses = await lookup(host, { all: true, verbatim: true });
        if (!addresses.length || addresses.some((entry) => isPrivateAddress(entry.address))) return route.abort();
        return route.continue();
      } catch {
        return route.abort();
      }
    });

    const response = await page.goto(target.toString(), { waitUntil: "domcontentloaded", timeout: REQUEST_TIMEOUT });
    await page.waitForTimeout(700);
    await assertPublicUrl(page.url());

    const details = await page.evaluate(() => {
      const getMeta = (selector) => document.querySelector(selector)?.getAttribute("content")?.trim() || null;
      const unique = (values, limit = 5) => [...new Set(values.filter((value) => /^https?:\/\//i.test(value || "")))].slice(0, limit);
      const absolute = (value) => {
        try {
          return new URL(value, location.href).toString();
        } catch {
          return null;
        }
      };
      const body = (document.body?.innerText || "").replace(/\s+/g, " ").trim();

      return {
        title: document.title || null,
        lang: document.documentElement.lang || null,
        description: getMeta('meta[name="description"]') || getMeta('meta[property="og:description"]') || null,
        canonical: document.querySelector('link[rel="canonical"]')?.href || null,
        openGraph: {
          title: getMeta('meta[property="og:title"]'),
          type: getMeta('meta[property="og:type"]'),
          image: getMeta('meta[property="og:image"]'),
          video: getMeta('meta[property="og:video"]') || getMeta('meta[property="og:video:url"]'),
          siteName: getMeta('meta[property="og:site_name"]'),
        },
        twitter: {
          card: getMeta('meta[name="twitter:card"]'),
          image: getMeta('meta[name="twitter:image"]'),
        },
        media: unique([
          ...[...document.querySelectorAll("video, audio, source")].map((element) => absolute(element.currentSrc || element.src)),
          ...[...document.querySelectorAll('a[href]')].map((element) => {
            const href = absolute(element.getAttribute("href"));
            return /\.(mp4|webm|mov|mp3|m4a|wav|ogg|pdf|zip|rar|apk)(?:$|[?#])/i.test(href || "") ? href : null;
          }),
        ]),
        images: unique([
          getMeta('meta[property="og:image"]'),
          getMeta('meta[name="twitter:image"]'),
          ...[...document.images].map((image) => absolute(image.currentSrc || image.src)),
        ]),
        textPreview: body.slice(0, 900) || null,
        protected: /captcha|cloudflare|verify you are human|sign in to confirm you're not a bot|unusual traffic|access denied/i.test(body),
      };
    });

    return {
      input: target.toString(),
      finalUrl: page.url(),
      status: response?.status() || null,
      protected: details.protected || protectedPageMessage(details.textPreview),
      ...details,
    };
  } finally {
    await browser.close();
  }
}

function linkLine(label, value) {
  return value ? `│ ${label}: ${trimText(value, 360)}\n` : "";
}

function formatReport(report) {
  const access = report.protected ? "يتطلب تحققاً أو تسجيل دخول" : "صفحة عامة قابلة للقراءة";
  const media = report.media.length ? report.media.map((url, index) => `${index + 1}. ${trimText(url, 220)}`).join("\n") : "لا توجد روابط وسائط مباشرة معلنة";
  const images = report.images.length ? report.images.map((url, index) => `${index + 1}. ${trimText(url, 220)}`).join("\n") : "لا توجد صور عامة معلنة";

  return (
    `╭━━〔 🔎 *فحص رابط* 〕━━╮\n` +
    `│ الموقع: *${readableHost(report.finalUrl)}*\n` +
    `│ الحالة: *${report.status || "غير معروفة"}*\n` +
    `│ الإتاحة: *${access}*\n` +
    linkLine("العنوان", report.title || report.openGraph.title) +
    linkLine("الوصف", report.description) +
    linkLine("النوع", report.openGraph.type) +
    linkLine("اللغة", report.lang) +
    linkLine("الرابط النهائي", report.finalUrl) +
    linkLine("الرابط الأساسي", report.canonical) +
    `├──〔 الوسائط العامة 〕\n${media.split("\n").map((line) => `│ ${line}\n`).join("")}` +
    `├──〔 الصور العامة 〕\n${images.split("\n").map((line) => `│ ${line}\n`).join("")}` +
    (report.textPreview ? `├──〔 معاينة النص 〕\n│ ${trimText(report.textPreview, 650)}\n` : "") +
    `╰━━〔 Tarboo Bot 〕━━╯`
  );
}

async function handler(m, { text }) {
  const input = String(text || "").trim();
  if (!input) {
    await m.reply(
      `╭━━〔 🔎 *فحص* 〕━━╮\n` +
        `│ أرسل رابطاً عاماً لمعرفة بياناته المعلنة.\n` +
        `│ مثال: \`${m.prefix}فحص https://example.com\`\n` +
        `│ لا يتجاوز تسجيل الدخول أو CAPTCHA.\n` +
        `╰━━〔 Tarboo Bot 〕━━╯`,
    );
    return;
  }

  await m.react?.("🕕").catch(() => {});
  try {
    const report = await inspectPublicLink(input);
    await m.reply(formatReport(report));
    await m.react?.(report.protected ? "⚠️" : "✅").catch(() => {});
  } catch (error) {
    console.error("[فحص]", error?.message || error);
    await m.react?.("❌").catch(() => {});
    await m.reply(
      `⚠️ *تعذر فحص الرابط.*\n` +
        `> ${error?.message || "تحقق من أن الرابط عام وصحيح."}\n` +
        `> فحص لا يتجاوز التسجيل أو CAPTCHA أو Cloudflare.\n` +
        `> Tarboo Bot`,
    );
  }
}

export { pluginConfig as config, handler, inspectPublicLink };