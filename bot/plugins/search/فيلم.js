import { getAssetBuffer } from "../../src/lib/maro-asset-manager.js";
import axios from "axios";
import config from "../../config.js";
import te from "../../src/lib/maro-error.js";

const NEOXR_APIKEY = config.APIkey?.neoxr || "Milik-Bot-MaroMD";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "فيلم",
  alias: ["film"],
  category: "search",
  description: "بحث عن أفلام ومشاهدتها",
  usage: ".فيلم <اسم الفيلم>",
  example: ".فيلم civil war",
  cooldown: 10, energi: 1, isEnabled: true,
};

const filmSessions = new Map();

// ═══════════════════════════════════════════════
// 🎬 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const query = m.text?.trim();

  if (!query) {
    return m.reply(
      `🎬 *بحث أفلام*\n\n` +
      `> ابحث وشاهد الأفلام\n\n` +
      `💡 مثال:\n` +
      `> \`${m.prefix}فيلم civil war\``
    );
  }

  m.react("🎬");

  try {
    const apiUrl = `https://api.neoxr.eu/api/film?q=${encodeURIComponent(query)}&apikey=${NEOXR_APIKEY}`;
    const { data } = await axios.get(apiUrl, { timeout: 30000 });

    if (!data?.status || !data?.data?.length) {
      m.react("❌");
      return m.reply(`❌ لم يتم العثور على: "${query}"`);
    }

    const films = data.data.slice(0, 10);

    filmSessions.set(m.sender, { films, timestamp: Date.now() });
    setTimeout(() => filmSessions.delete(m.sender), 300000);

    let text = `🎬 *نتائج البحث*\n\n`;
    text += `> تم العثور على *${films.length}* فيلم\n\n`;

    films.forEach((f, i) => {
      text += `*${i + 1}. ${f.title}*\n`;
      text += `> ⭐ ${f.rating} | 📺 ${f.quality} | 📅 ${f.release}\n\n`;
    });

    text += `> _اختر فيلماً من القائمة_`;

    const listItems = films.map((f, i) => ({
      title: f.title,
      description: `⭐ ${f.rating} | ${f.quality} | ${f.release}`,
      id: `${m.prefix}filmget ${f.url}`,
    }));

    await sock.sendButton(
      m.chat,
      getAssetBuffer("maro"),
      text,
      m,
      {
        buttons: [{
          name: "single_select",
          buttonParamsJson: JSON.stringify({
            title: "🎬 اختر فيلماً",
            sections: [{ title: "نتائج البحث", rows: listItems }],
          }),
        }],
        footer: "🎬 بحث أفلام",
      },
    );

    m.react("✅");
  } catch (error) {
    m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };