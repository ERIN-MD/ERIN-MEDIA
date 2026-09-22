import axios from "axios";
import te from "../../src/lib/maro-error.js";
import { generateWAMessageFromContent } from "maro";
import sharp from "sharp";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "سبوتيفاي",
  alias: ["spotify"],
  category: "search",
  description: "بحث عن أغاني في Spotify",
  usage: ".سبوتيفاي <بحث>",
  example: ".سبوتيفاي bruno mars",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 5, energi: 1, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🎵 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const text = m.text?.trim();

  if (!text) {
    return m.reply(`🎵 *Spotify*\n\n📌 مثال: \`${m.prefix}سبوتيفاي bruno mars\``);
  }

  await m.react("⏳");

  try {
    const res = await axios.get(`https://api.cuki.biz.id/api/search/spotify?apikey=cuki-x&query=${encodeURIComponent(text)}&limit=5`);
    const data = res.data;

    if (!data.status || !data.data || !data.data.results || data.data.results.length === 0) {
      await m.react("❌");
      return m.reply(`⚠️ لم يتم العثور على نتائج لـ: *${text}*`);
    }

    const results = data.data.results;
    const firstResult = results[0];

    let contentText = `✨ *نتائج Spotify*\n\n`;
    contentText += `البحث: *${text}*\n\n`;

    results.forEach((t, i) => {
      contentText += `*${i + 1}. ${t.title}*\n`;
      contentText += `   🎤 ${t.artist}\n`;
      contentText += `   ⏱️ ${t.duration}\n`;
      contentText += `   🔗 ${t.url}\n\n`;
    });

    contentText += `📥 استخدم \`.spdl <رابط>\` لتحميل الأغنية`;

    let thumbnailBuffer = null;
    try {
      const imageResponse = await axios.get(firstResult.thumb, { responseType: "arraybuffer" });
      thumbnailBuffer = await sharp(imageResponse.data).resize(300, 170).jpeg().toBuffer();
    } catch (e) {}

    if (thumbnailBuffer) {
      const content = {
        buttonsMessage: {
          buttons: [{
            buttonId: `.spdl ${firstResult.url}`,
            buttonText: { displayText: '🎵 تحميل الأغنية الأولى' },
            type: 1,
          }],
          locationMessage: {
            jpegThumbnail: thumbnailBuffer,
            name: firstResult.title,
            address: `🎤 ${firstResult.artist} | ⏱️ ${firstResult.duration}`
          },
          contentText: contentText,
          footerText: '🎵 Spotify',
          headerType: 6,
        },
      };

      const msg = generateWAMessageFromContent(m.chat, content, { quoted: m });
      await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    } else {
      await m.reply(contentText);
    }

    await m.react("✅");

  } catch (err) {
    console.error("[Spotify]", err.message);
    await m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };