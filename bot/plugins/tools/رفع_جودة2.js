import te from "../../src/lib/maro-error.js";
import winkEnhance from "../../src/scraper/wink.js";

const pluginConfig = {
  name: "رفع_جودة2",
  alias: ["enhance2", "enhance2x"],
  category: "tools",
  description: "رفع جودة الفيديو إلى دقة عالية جداً (2x) باستخدام Wink AI",
  usage: ".رفع_جودة2 (رد على فيديو)",
  example: ".رفع_جودة2",
  isOwner: false,
  isPremium: true,
  isGroup: false,
  isPrivate: false,
  cooldown: 180,
  energi: 5,
  isEnabled: true,
};

async function handler(m, { sock }) {
  let isVideoMessage = m.isVideo || (m.quoted && m.quoted.type === "videoMessage");
  let isDocumentMessage = (m.type === "documentMessage" && m.message?.documentMessage?.mimetype?.startsWith("video")) || (m.quoted && m.quoted.type === "documentMessage" && m.quoted.message?.documentMessage?.mimetype?.startsWith("video"));

  if (!isVideoMessage && !isDocumentMessage) {
    return m.reply(
      `✨ *رفع جودة الفيديو 2x*\n\n` +
        `> تحويل الفيديو إلى دقة عالية جداً (ضعف الجودة) باستخدام ذكاء Wink الاصطناعي!\n\n` +
        `*طريقة الاستخدام:*\n` +
        `> أرسل أو رد على فيديو مع الأمر \`${m.prefix}رفع_جودة2\`\n\n` +
        `⚠️ _ميزة مدفوعة، وقت المعالجة المتوقع 2-8 دقائق حسب مدة الفيديو_`,
    );
  }

  await m.react("🕕");

  try {
    const videoBuffer = (await m?.quoted?.download?.()) || (await m.download?.());

    if (!videoBuffer || videoBuffer.length === 0) {
      await m.react("❌");
      return m.reply(`❌ *فشل*\n\nفشل تحميل الفيديو، حاول إرساله مرة أخرى!`);
    }

    if (videoBuffer.length > 50 * 1024 * 1024) {
      await m.react("❌");
      return m.reply(`❌ *الملف كبير جداً*\n\nالحد الأقصى لحجم الفيديو هو *50 ميجابايت*!`);
    }

    await m.reply(
      `🎬 *بدأت عملية رفع الجودة 2x*\n\n` +
        `> يتم معالجة الفيديو بواسطة ذكاء Wink الاصطناعي لرفع الجودة إلى ضعف الدقة ✨\n` +
        `> الوقت المتوقع *2-8 دقائق*، يرجى الانتظار!`,
    );

    const result = await winkEnhance(videoBuffer, {
      filename: `enhance2x-${Date.now()}.mp4`,
    });

    await sock.sendMedia(m.chat, result.resultUrl, `✨ *تم رفع جودة الفيديو 2x!*\n\n> أصبح الفيديو بدقة عالية جداً الآن! 😍`, m, {
      type: "video",
      mimetype: "video/mp4",
      fileName: `HD-2X-ENHANCED-${Date.now()}.mp4`,
    });

    await m.react("✅");
  } catch (err) {
    console.log(err);
    await m.react("❌");
    await m.reply(`❌ فشلت عملية رفع الجودة 2x! حاول مرة أخرى لاحقاً 😭`);
  }
}

export { pluginConfig as config, handler };