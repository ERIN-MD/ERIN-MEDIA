import axios from "axios";
import te from "../../src/lib/maro-error.js";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "شعار",
  alias: ["sologo"],
  category: "ai",
  description: "إنشاء شعارات بالذكاء الاصطناعي",
  usage: ".شعار <وصف>",
  example: ".شعار قطة لطيفة باللون الأزرق",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 2,
  isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🎨 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const prompt = m.text?.trim() || m.args.join(" ");

  if (!prompt) {
    return m.reply(`❌ اكتب وصف الشعار.\n\n📌 *مثال:* \`${m.prefix}شعار روبوت رائع باللون الأحمر\``);
  }

  await m.react("⏳");

  try {
    const apiUrl = `https://api.nexray.eu.cc/ai/sologo?prompt=${encodeURIComponent(prompt)}`;
    const res = await axios.get(apiUrl, {
      timeout: 120000,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });

    const data = res.data;
    if (!data.status || !data.result || data.result.length === 0) {
      await m.react("❌");
      return m.reply("⚠️ فشل إنشاء الشعار. جرب وصفاً آخر.");
    }

    const logo = data.result[0];

    const caption = `🎨 *شعار*\n\n` +
      `*الوصف:* ${prompt}\n` +
      `*العنوان:* ${logo.title}\n` +
      `*التفاصيل:* ${logo.desc}\n` +
      `*النوع:* ${logo.logo_type || "اصلي"}`;

    await sock.sendMessage(m.chat, { image: { url: logo.thumbnail }, caption }, { quoted: m });
    await m.react("✅");

  } catch (error) {
    console.error("[SoLogo AI]", error.message);
    await m.react("❌");
    m.reply("😔 حدث خطأ أثناء معالجة الطلب.");
  }
}

export { pluginConfig as config, handler };