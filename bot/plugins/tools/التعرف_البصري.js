import Tesseract from "tesseract.js";
import te from "../../src/lib/maro-error.js";
import { sendToolsPreview } from "../../src/lib/maro-context.js";

const pluginConfig = {
  name: "التعرف_البصري",
  alias: ["ocr"],
  category: "tools",
  description: "استخراج النص من الصورة",
  usage: ".التعرف_البصري (رد على صورة)",
  example: ".التعرف_البصري",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const isImage = m.isImage || (m.quoted && m.quoted.type === "imageMessage");
  
  if (!isImage) {
    return m.reply(
      `⚠️ *طريقة الاستخدام*\n\n` +
      `> قم بالرد على صورة مع \`${m.prefix}التعرف_البصري\`\n\n` +
      `> الصيغ المدعومة: JPG, PNG, GIF, WEBP`
    );
  }

  await m.react("🕕");
  await m.reply(`🕕 *جاري المعالجة...*\n\n> استخراج النص من الصورة...`);

  try {
    let buffer;
    
    if (m.quoted && m.quoted.isMedia) {
      buffer = await m.quoted.download();
    } else if (m.isMedia) {
      buffer = await m.download();
    }

    if (!buffer || buffer.length === 0) {
      await m.react("❌");
      return m.reply(`❌ *فشل*\n\n> تعذر تحميل الصورة`);
    }

    // استخدام Tesseract مباشرة
    const { data: { text } } = await Tesseract.recognize(buffer, "ara+eng", {
      logger: m => console.log(m)
    });

    const extractedText = text ? text.trim() : "";

    if (!extractedText || extractedText.length === 0) {
      await m.react("❌");
      return m.reply(
        `❌ *لا يوجد نص*\n\n> لم يتم اكتشاف أي نص في الصورة.\n> تأكد من أن النص واضح وبحجم مناسب.`
      );
    }

    await m.react("✅");
    
    const responseText =
      `📖 *نتيجة التعرف البصري*\n\n` +
      `╭┈┈⬡「 📝 *النص* 」\n` +
      `${extractedText.split("\n").map(l => `┃ ${l}`).join("\n")}\n` +
      `╰┈┈┈┈┈┈┈┈⬡\n\n` +
      `> الإجمالي: ${extractedText.length} حرف`;

    await sendToolsPreview(
      sock,
      m.chat,
      responseText,
      "📖 *التعرف_البصري*",
      `${extractedText.length} حروف`,
      { quoted: m }
    );

  } catch (e) {
    await m.react("☢");
    console.error("تفاصيل الخطأ:", e);
    m.reply(`❌ *حدث خطأ*\n\n> ${e.message || "خطأ غير معروف"}`);
  }
}

export { pluginConfig as config, handler };