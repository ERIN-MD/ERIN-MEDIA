import axios from "axios";
import config from "../../config.js";
import te from "../../src/lib/maro-error.js";

const NEOXR_APIKEY = config.APIkey?.neoxr || "Milik-Bot-MaroMD";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "بيكسيف",
  alias: ["pixiv"],
  category: "search",
  description: "بحث عن أعمال فنية في Pixiv",
  usage: ".بيكسيف <بحث>",
  example: ".بيكسيف rem",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 5, energi: 2, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🎨 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  try {
    const query = m.args?.join(" ")?.trim();

    if (!query) {
      return m.reply(`❌ اكتب كلمة البحث!\n\n📌 مثال: \`${m.prefix}بيكسيف rem\``);
    }

    await m.react("🔍");

    const url = `https://api.neoxr.eu/api/pixiv-search?q=${encodeURIComponent(query)}&apikey=${NEOXR_APIKEY}`;
    const response = await axios.get(url, { timeout: 30000 });
    const data = response.data;

    if (!data.status || !data.data || data.data.length === 0) {
      await m.react("❌");
      return m.reply(`❌ لم يتم العثور على نتائج لـ: ${query}`);
    }

    const results = data.data.slice(0, 10);

    let caption = `🎨 *Pixiv*\n`;
    caption += `📝 البحث: ${query}\n`;
    caption += `📊 النتائج: ${results.length} عمل\n\n`;

    results.forEach((art, i) => {
      const aiLabel = art.aiType === 2 ? " 🤖" : "";
      const isNsfw = art.xRestrict > 0 ? " 🔞" : "";
      caption += `*${i + 1}.* ${art.title}${aiLabel}${isNsfw}\n`;
      caption += `   👤 ${art.userName}\n`;
      caption += `   🔗 ${art.url}\n\n`;
    });

    await m.react("🎨");
    await m.reply(caption);

  } catch (error) {
    await m.react("❌");
    if (error.response?.status === 403) return m.reply(`❌ مفتاح API غير صالح`);
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };