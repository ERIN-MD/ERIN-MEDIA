import _sharp from 'sharp'
import axios from "axios";
import * as cheerio from "cheerio";
import te from "../../src/lib/maro-error.js";

function getSharp() {
  return _sharp;
}

// ═══════════════════════════════════════════════
// 🛠️ جلب الخطوط
// ═══════════════════════════════════════════════
async function nerdfonts() {
  try {
    const { data } = await axios.get("https://www.nerdfonts.com/font-downloads");
    const $ = cheerio.load(data);
    const result = [];
    $("div.item").each((_, rynn) => {
      const name = $(rynn).find("span.nerd-font-invisible-text").text().trim();
      const textContent = $(rynn).find("div").first().text();
      const version = textContent.match(/Version:\s*([^\n\r]+)/)?.[1]?.trim() || null;
      const info = textContent.match(/Info:\s*([^\n\r]+)/)?.[1]?.trim() || null;
      const preview_image = "https://www.nerdfonts.com" + $(rynn).find("a.font-preview").attr("style")?.match(/background-image\s*:\s*url\s*\(\s*['"]?([^'"]+)['"]?\s*\)/i)?.[1] || null;
      const download_url = $(rynn).find("a.nf-fa-download").attr("href");
      if (name && download_url) {
        result.push({ name, version, info, preview_image, download_url });
      }
    });
    return result;
  } catch (error) {
    throw new Error(error.message);
  }
}

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "تحميل_خط",
  alias: ["fontget"],
  category: "search",
  description: "تحميل خط Nerd Font",
  usage: ".تحميل_خط <اسم الخط>",
  example: ".تحميل_خط FiraCode",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 5, energi: 0, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🔤 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const query = m.text?.trim()?.toLowerCase();
  if (!query) return m.reply(`❌ اكتب اسم الخط المطلوب`);

  try {
    const res = await nerdfonts();
    const data = res.find((d) => d?.name.toLowerCase() === query.toLowerCase());

    if (!data) {
      return m.reply(`❌ الخط "${query}" غير موجود`);
    }

    await sock.sendMessage(m.chat, {
      document: { url: data.download_url },
      fileName: data.name,
      mimetype: "application/zip",
      jpegThumbnail: await (await getSharp())(
        await axios.get(data.preview_image, { responseType: "arraybuffer" }).then((res) => Buffer.from(res.data))
      ).resize(50, 50).toBuffer(),
      caption: `✅ *تم التحميل*\n\nلتحميل خط آخر اكتب \`${m.prefix}خطوط\``,
    });

  } catch (err) {
    return m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };