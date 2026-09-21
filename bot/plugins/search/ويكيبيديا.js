import axios from "axios";
import * as cheerio from "cheerio";
import te from "../../src/lib/maro-error.js";

const LANG = "ar";
const LIMIT = 5;
const BASE = `https://${LANG}.wikipedia.org`;
const API = `${BASE}/w/api.php`;
const UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

// ═══════════════════════════════════════════════
// 🛠️ دوال مساعدة
// ═══════════════════════════════════════════════
function decodeHtml(text) {
  return String(text || "")
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function cleanText(text) {
  return decodeHtml(text).replace(/<\/?[^>]+>/g, "").replace(/\[\d+\]/g, "").replace(/\s+/g, " ").trim();
}

function fixUrl(url) {
  if (!url) return null;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${BASE}${url}`;
  return url;
}

async function searchWikipedia(query) {
  const { data } = await axios.get(API, {
    params: { action: "query", list: "search", srsearch: query, srlimit: LIMIT, format: "json", origin: "*" },
    headers: { "user-agent": UA }
  });
  return data?.query?.search || [];
}

async function getFullArticle(title) {
  const pageUrl = `${BASE}/wiki/${encodeURIComponent(title.replaceAll(" ", "_"))}`;
  const { data } = await axios.get(pageUrl, { headers: { "user-agent": UA } });
  const $ = cheerio.load(data);

  $("script, style, sup.reference, .mw-editsection, .navbox, .toc").remove();

  const pageTitle = cleanText($("#firstHeading").text()) || title;
  const introParagraphs = [];

  $(".mw-parser-output > p").each((_, el) => {
    const text = cleanText($(el).text());
    if (text.length > 40) introParagraphs.push(text);
  });

  const images = [];
  $(".mw-parser-output img").each((_, img) => {
    const src = fixUrl($(img).attr("src"));
    if (src && !src.includes("static/images")) images.push({ Url: src });
  });

  return {
    Title: pageTitle,
    Url: pageUrl,
    Extract: introParagraphs.slice(0, 3).join("\n\n") || null,
    Images: images
  };
}

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "ويكيبيديا",
  alias: ["wiki"],
  category: "search",
  description: "بحث في ويكيبيديا العربية",
  usage: ".ويكيبيديا <بحث>",
  example: ".ويكيبيديا القاهرة",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 5, energi: 1, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 📚 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const query = m.args.join(" ") || m.text?.trim();

  if (!query) {
    return m.reply(`📚 *ويكيبيديا*\n\n📌 مثال: \`${m.prefix}ويكيبيديا القاهرة\``);
  }

  await m.react("⏳");

  try {
    const results = await searchWikipedia(query);

    if (!results.length) {
      await m.react("❌");
      return m.reply(`⚠️ لم يتم العثور على مقال عن: *${query}*`);
    }

    const detail = await getFullArticle(results[0].title);

    let text = `📚 *ويكيبيديا*\n\n`;
    text += `*العنوان:* ${detail.Title}\n\n`;
    text += `*الملخص:*\n${detail.Extract || "لا يوجد ملخص."}\n\n`;
    text += `🔗 ${detail.Url}`;

    if (detail.Images.length > 0) {
      await sock.sendMessage(m.chat, {
        image: { url: detail.Images[0].Url },
        caption: text
      }, { quoted: m });
    } else {
      await m.reply(text);
    }

    await m.react("✅");

  } catch (error) {
    console.error("[Wikipedia]", error.message);
    await m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };