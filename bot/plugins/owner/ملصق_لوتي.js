// ملصق لوتي - أمر لتحويل الملصق إلى لوتي (Lottie)

import { generateWAMessageFromContent, proto } from "maro";

const pluginConfig = {
  name: ["ملصق_لوتي"],
  alias: ["sprem"],
  category: "owner",
  description: "تحويل الملصق إلى لوتي (Lottie)",
  usage: ".ملصق_لوتي (رد على ملصق)",
  example: ".ملصق_لوتي",
  isOwner: true,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  if (!m.quoted) {
    return m.reply(
      "⭐ *ملصق لوتي*\n\n" +
        "> رد على الملصق الذي تريد تحويله إلى لوتي!\n\n" +
        `> طريقة الاستخدام: \`${m.prefix}ملصق_لوتي\``,
    );
  }

  const q = m.quoted;

  try {
    const msg = q.message?.stickerMessage;
    if (!msg) return m.reply("❌ فشل قراءة بيانات الملصق");

    await m.reply("⏳ جاري تحويل الملصق إلى لوتي...");

    // تحميل الملصق
    const stickerBuffer = await q.download();
    if (!stickerBuffer) return m.reply("❌ فشل تحميل الملصق");

    // إنشاء رسالة الملصق مع خيارات Lottie باستخدام proto
    const stickerMessage = {
      url: msg.url,
      fileSha256: msg.fileSha256,
      fileEncSha256: msg.fileEncSha256,
      mediaKey: msg.mediaKey,
      mimetype: "image/webp",
      height: msg.height || 512,
      width: msg.width || 512,
      directPath: msg.directPath,
      fileLength: msg.fileLength,
      mediaKeyTimestamp: msg.mediaKeyTimestamp || Date.now(),
      isAnimated: true,
      stickerSentTs: Date.now(),
      isAvatar: false,
      isAiSticker: true,
      premium: 1,
      isLottie: true,
      accessibilityLabel: msg.accessibilityLabel || "",
      contextInfo: {
        stanzaId: m.key?.id,
        participant: m.key?.participant || m.sender,
        remoteJid: m.chat,
      },
    };

    // بناء الرسالة
    const waMsg = generateWAMessageFromContent(
      m.chat,
      { stickerMessage },
      {
        userJid: sock.user?.id,
        quoted: m,
      },
    );

    // إرسال الرسالة
    await sock.relayMessage(m.chat, waMsg.message, {
      messageId: waMsg.key.id,
    });

    await m.react("✅");
    
  } catch (err) {
    console.error("[ملصق_لوتي]", err.message);
    return m.reply(`❌ فشل: ${err.message}`);
  }
}

export { pluginConfig as config, handler };