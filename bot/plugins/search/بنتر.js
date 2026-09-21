import { generateWAMessage, generateWAMessageFromContent, jidNormalizedUser } from "maro";
import axios from "axios";
import crypto from "crypto";
import te from "../../src/lib/maro-error.js";
import { f } from "../../src/lib/maro-http.js";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "بنتر",
  alias: ["pins"],
  category: "search",
  description: "بحث عن صور في Pinterest (ألبوم)",
  usage: ".بنتر <بحث>",
  example: ".بنتر Zhao Lusi",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 10, energi: 1, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🔍 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const query = m.text?.trim();
  if (!query) {
    return m.reply(`🔍 *بنتر*\n\n📌 مثال: \`${m.prefix}بنتر Zhao Lusi\``);
  }
  m.react("⏳");

  try {
    const data = await f(`https://api.siputzx.my.id/api/s/pinterest?query=${encodeURIComponent(query)}`);
    const results = data?.data?.slice(0, 10);
    if (!results || results.length === 0) {
      m.react("❌");
      return m.reply(`❌ لم يتم العثور على نتائج لـ: ${query}`);
    }

    const mediaList = [];
    for (const item of results) {
      const imageUrl = item.image_url;
      if (!imageUrl) continue;
      try {
        const imgRes = await axios.get(imageUrl, { responseType: "arraybuffer", timeout: 15000 });
        const imgBuffer = Buffer.from(imgRes.data);
        if (imgBuffer.length > 1000) mediaList.push({ image: imgBuffer });
      } catch (e) { continue; }
    }

    if (mediaList.length === 0) {
      m.react("❌");
      return m.reply("❌ فشل تحميل الصور");
    }

    try {
      const opener = generateWAMessageFromContent(m.chat, {
        messageContextInfo: { messageSecret: crypto.randomBytes(32) },
        albumMessage: { expectedImageCount: mediaList.length, expectedVideoCount: 0 },
      }, { userJid: jidNormalizedUser(sock.user.id), quoted: m, upload: sock.waUploadToServer });

      await sock.relayMessage(opener.key.remoteJid, opener.message, { messageId: opener.key.id });

      for (const content of mediaList) {
        const msg = await generateWAMessage(opener.key.remoteJid, content, { upload: sock.waUploadToServer });
        msg.message.messageContextInfo = {
          messageSecret: crypto.randomBytes(32),
          messageAssociation: { associationType: 1, parentMessageKey: opener.key },
        };
        await sock.relayMessage(msg.key.remoteJid, msg.message, { messageId: msg.key.id });
      }
    } catch {
      for (const content of mediaList) {
        await sock.sendMessage(m.chat, { image: content.image }, { quoted: m });
      }
    }

    m.react("✅");
  } catch (err) {
    console.error("[Pins] خطأ:", err.message);
    m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };