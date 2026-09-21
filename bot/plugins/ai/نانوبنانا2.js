import { fluxImage } from "../../src/scraper/seaart.js";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "نانوبنانا2",
  alias: ["nano2"],
  category: "ai",
  description: "إنشاء صور بالذكاء الاصطناعي",
  usage: ".نانوبنانا2 <وصف>",
  example: ".نانوبنانا2 قطة لطيفة",
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
  const prompt = m.text;
  if (!prompt) {
    return m.reply(`🎨 *نانوبنانا2*\n\n> اكتب وصفاً للصورة\n\n📌 *مثال:* \`${m.prefix}نانوبنانا2 قطة لطيفة\``);
  }

  m.react("⏳");

  try {
    const result = await fluxImage(prompt, "1:1");
    const imageUrl = result.url;

    m.react("✅");
    await sock.sendMedia(m.chat, imageUrl, null, m, { type: "image" });
  } catch (error) {
    console.log(error);
    m.react("❌");
    const msg = error?.response?.data?.message || error?.response?.data?.error || error.message || "حدث خطأ";
    m.reply(`❌ ${msg}\n\nحاول مرة أخرى لاحقاً.`);
  }
}

export { pluginConfig as config, handler };