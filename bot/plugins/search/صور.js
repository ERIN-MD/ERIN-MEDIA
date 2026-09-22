import axios from "axios";
import te from "../../src/lib/maro-error.js";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "صور",
  alias: ["bing"],
  category: "search",
  description: "بحث عن صور",
  usage: ".صور <بحث>",
  example: ".صور قطة",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 5, energi: 2, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🖼️ دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  try {
    const query = m.text;

    if (!query) {
      return m.reply(`❌ اكتب كلمة البحث!\n\n📌 مثال: \`${m.prefix}صور قطة\``);
    }

    await m.react("🔍");

    // Bing Image Search API مجاني
    const url = `https://api.nexray.eu.cc/search/bingimage?q=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url, { timeout: 30000 });

    if (!data?.status || !data?.result?.length) {
      await m.react("❌");
      return m.reply(`❌ لم يتم العثور على نتائج لـ: ${query}`);
    }

    const images = data.result.slice(0, 8);
    const album = await Promise.all(
      images.map(async (img) => {
        try {
          const res = await axios.get(img, { responseType: "arraybuffer", timeout: 10000 });
          return { image: Buffer.from(res.data) };
        } catch {
          return null;
        }
      })
    );

    const validAlbum = album.filter(Boolean);
    if (!validAlbum.length) {
      await m.react("❌");
      return m.reply("❌ فشل تحميل الصور");
    }

    await sock.sendMessage(m.chat, { albumMessage: validAlbum }, { quoted: m });
    m.react("✅");
  } catch (error) {
    console.log(error);
    await m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };