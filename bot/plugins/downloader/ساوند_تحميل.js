import scdl from "../../src/scraper/soundclouddl.js";
import te from "../../src/lib/maro-error.js";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "ساوند_تحميل",
  alias: ["playsc"],
  category: "downloader",
  description: "تحميل أغنية من رابط SoundCloud",
  usage: ".ساوند_تحميل <رابط>",
  example: ".ساوند_تحميل https://soundcloud.com/xxx",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 15, energi: 2, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🎶 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const url = m.text?.trim();

  if (!url || !url.includes("soundcloud.com")) {
    return m.reply(`🎶 *تحميل SoundCloud*\n\n📌 مثال: \`${m.prefix}ساوند_تحميل https://soundcloud.com/xxx\``);
  }

  await m.react("⏳");

  try {
    const downloadInfo = await scdl(url);

    let contentTxt = `🎵 *العنوان:* ${downloadInfo.title}\n`;
    contentTxt += `👤 *الرافع:* ${downloadInfo.uploader}\n`;
    contentTxt += `⏱️ *المدة:* ${downloadInfo.duration}\n`;
    contentTxt += `👁️ *المشاهدات:* ${downloadInfo.views}\n`;
    contentTxt += `❤️ *الإعجابات:* ${downloadInfo.likes}\n`;
    contentTxt += `📦 *الحجم:* ${downloadInfo.size}`;

    if (downloadInfo.thumbnail) {
      await sock.sendMedia(m.chat, downloadInfo.thumbnail, contentTxt, m, { type: "image" });
    }

    await sock.sendMedia(m.chat, downloadInfo.download_url, downloadInfo.title, m, { type: "audio" });
    await m.react("✅");
  } catch (e) {
    m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };