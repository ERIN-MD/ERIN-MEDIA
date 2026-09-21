import scdl from "../../src/scraper/soundclouddl.js";
import searchSoundCloud from "../../src/scraper/soundcloud.js";
import te from "../../src/lib/maro-error.js";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "ساوند_تحميل",
  alias: ["playsc"],
  category: "search",
  description: "تحميل أغنية من SoundCloud",
  usage: ".ساوند_تحميل <اسم الأغنية>",
  example: ".ساوند_تحميل Only We Know",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 15, energi: 2, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🎶 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const query = m.args.join(" ");

  if (!query) {
    return m.reply(`🎶 *تحميل SoundCloud*\n\n📌 مثال: \`${m.prefix}ساوند_تحميل Only We Know\``);
  }

  await m.react("⏳");

  try {
    const search = await searchSoundCloud(query);
    const searchResults = search.success ? search.results : [];
    if (!searchResults.length) {
      return m.reply(`❌ لم يتم العثور على الأغنية`);
    }

    const track = searchResults[0];
    const downloadInfo = await scdl(track.url);
    
    let contentTxt = `🎵 *العنوان:* ${downloadInfo.title}\n`;
    contentTxt += `👤 *الرافع:* ${downloadInfo.uploader}\n`;
    contentTxt += `⏱️ *المدة:* ${downloadInfo.duration}\n`;
    contentTxt += `👁️ *المشاهدات:* ${downloadInfo.views}\n`;
    contentTxt += `❤️ *الإعجابات:* ${downloadInfo.likes}\n`;
    contentTxt += `📦 *الحجم:* ${downloadInfo.size}`;

    if (downloadInfo.thumbnail || track.artwork) {
      await sock.sendMedia(m.chat, downloadInfo.thumbnail || track.artwork, contentTxt, m, { type: "image" });
    }
    
    await sock.sendMedia(m.chat, downloadInfo.download_url, downloadInfo.title, m, { type: "audio" });

    await m.react("✅");
  } catch (e) {
    m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };
