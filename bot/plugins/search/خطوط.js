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
  name: "خطوط",
  alias: ["font"],
  category: "search",
  description: "تحميل خطوط Nerd Fonts",
  usage: ".خطوط",
  example: ".خطوط",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 5, energi: 0, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🔤 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  try {
    const res = await nerdfonts();
    const rows = res.map((f, i) => ({
      title: f.info || f.name,
      description: `الإصدار: ${f.version}`,
      id: `${m.prefix}nerdfont-ambil ${f.name}`,
    }));

    await sock.sendMessage(m.chat, {
      text: "اختر الخط الذي تريد تحميله",
      footer: "اضغط على الزر أدناه",
      interactiveButtons: [{
        name: "single_select",
        buttonParamsJson: JSON.stringify({
          title: "اختر خط",
          sections: [{ title: "الخطوط المتاحة", rows }],
        }),
      }],
    }, { quoted: m });

  } catch (err) {
    return m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };