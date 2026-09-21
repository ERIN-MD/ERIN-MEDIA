import { live3d } from "../../src/scraper/seaart.js";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "نانوبنانا",
  alias: ["nano"],
  category: "ai",
  description: "تعديل الصور بالذكاء الاصطناعي",
  usage: ".نانوبنانا <وصف> (رد على صورة)",
  example: ".نانوبنانا حولها لرسم أنمي",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 30,
  energi: 1,
  isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🎨 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const prompt = m.args.join(" ");
  if (!prompt) {
    return m.reply(`🎨 *نانوبنانا*\n\n> اكتب وصفاً مع الرد على صورة\n\n📌 *مثال:* \`${m.prefix}نانوبنانا حولها لرسم أنمي\``);
  }

  const isImage = m.isImage || (m.quoted && m.quoted.isImage);
  if (!isImage) {
    return m.reply(`🎨 *نانوبنانا*\n\n> رد على صورة أو أرسل صورة مع الوصف`);
  }

  m.react("⏳");

  try {
    let mediaBuffer;
    if (m.isImage && m.download) {
      mediaBuffer = await m.download();
    } else if (m.quoted && m.quoted.isImage && m.quoted.download) {
      mediaBuffer = await m.quoted.download();
    }

    if (!mediaBuffer || !Buffer.isBuffer(mediaBuffer)) {
      m.react("❌");
      return m.reply(`❌ فشل تحميل الصورة`);
    }

    const resultBuffer = await live3d(mediaBuffer, prompt).then((res) => res.image);

    m.react("✅");
    await sock.sendMedia(m.chat, resultBuffer, null, m, { type: "image" });
  } catch (error) {
    console.log(error);
    m.react("❌");
    m.reply(`❌ حدث خطأ. حاول مرة أخرى لاحقاً.`);
  }
}

export { pluginConfig as config, handler };