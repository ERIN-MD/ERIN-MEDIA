import { lookup } from "node:dns/promises";
import { assertPublicUrl, isPrivateAddress } from "./ريد.js";

const pluginConfig = {
  name: "سكرين",
  alias: [],
  category: "tools",
  description: "التقاط لقطة شاشة لصفحة ويب عامة",
  usage: ".سكرين <رابط>",
  example: ".سكرين https://example.com",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 8,
  energi: 1,
  isEnabled: true,
};

const REQUEST_TIMEOUT = 35_000;
const MAX_SCREENSHOT_BYTES = 14 * 1024 * 1024;

function blockedPageMessage(text = "") {
  const value = String(text).toLowerCase();
  return value.includes("captcha") || value.includes("cloudflare") || value.includes("verify you are human") || value.includes("unusual traffic") || value.includes("access denied");
}

async function capturePublicPage(inputUrl) {
  const target = await assertPublicUrl(inputUrl);
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 },
      userAgent: "Tarboo Bot Public Screenshot/1.0",
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
    await page.waitForTimeout(800);
    await assertPublicUrl(page.url());

    const bodyText = (await page.locator("body").innerText().catch(() => "")).slice(0, 3000);
    if (blockedPageMessage(bodyText)) throw new Error("الموقع طلب تحققاً بشرياً أو حظر الأتمتة؛ لن أتجاوزه.");

    let screenshot = await page.screenshot({ type: "jpeg", quality: 85, fullPage: true });
    let fullPage = true;
    if (screenshot.length > MAX_SCREENSHOT_BYTES) {
      screenshot = await page.screenshot({ type: "jpeg", quality: 78, fullPage: false });
      fullPage = false;
    }

    return {
      buffer: screenshot,
      title: (await page.title()).trim() || "بدون عنوان",
      url: page.url(),
      status: response?.status() || null,
      fullPage,
    };
  } finally {
    await browser.close();
  }
}

async function handler(m, { sock, text }) {
  const input = String(text || "").trim();
  if (!input) {
    await m.reply(
      `╭━━〔 📸 *سكرين* 〕━━╮\n` +
        `│ أرسل رابط صفحة عامة لالتقاطها.\n` +
        `│ مثال: \`${m.prefix}سكرين https://example.com\`\n` +
        `│ لا يتجاوز التحقق أو التسجيل أو CAPTCHA.\n` +
        `╰━━〔 Tarboo Bot 〕━━╯`,
    );
    return;
  }

  await m.react?.("🕕").catch(() => {});
  try {
    const shot = await capturePublicPage(input);
    const scope = shot.fullPage ? "الصفحة كاملة" : "الجزء الظاهر (اختُصر لأن اللقطة كبيرة)";
    await sock.sendMessage(
      m.chat,
      {
        image: shot.buffer,
        mimetype: "image/jpeg",
        caption:
          `╭━━〔 📸 *لقطة شاشة* 〕━━╮\n` +
          `│ العنوان: *${shot.title.slice(0, 140)}*\n` +
          `│ الحالة: *${shot.status || "غير معروفة"}*\n` +
          `│ النطاق: *${scope}*\n` +
          `│ الرابط: ${shot.url}\n` +
          `╰━━〔 Tarboo Bot 〕━━╯`,
      },
      { quoted: m },
    );
    await m.react?.("✅").catch(() => {});
  } catch (error) {
    console.error("[سكرين]", error?.message || error);
    await m.react?.("❌").catch(() => {});
    await m.reply(
      `⚠️ *تعذر التقاط الصفحة.*\n` +
        `> ${error?.message || "تحقق من أن الرابط عام وصحيح."}\n` +
        `> سكرين لا يتجاوز التسجيل أو CAPTCHA أو Cloudflare.\n` +
        `> Tarboo Bot`,
    );
  }
}

export { pluginConfig as config, handler, capturePublicPage };