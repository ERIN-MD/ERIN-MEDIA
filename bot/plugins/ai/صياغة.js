import axios from "axios";
import te from "../../src/lib/maro-error.js";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "صياغة",
  alias: ["quillbot"],
  category: "ai",
  description: "إعادة صياغة النصوص",
  usage: ".صياغة <نص>",
  example: ".صياغة أنا أتناول الطعام في المنزل",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 1,
  isEnabled: true,
};

// ═══════════════════════════════════════════════
// 📝 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const text = m.args.join(" ") || m.text?.trim();

  if (!text) {
    return m.reply(`❌ اكتب النص المراد صياغته.\n\n📌 *مثال:* \`${m.prefix}صياغة أنا أتناول الطعام في المنزل\``);
  }

  await m.react("⏳");

  try {
    const apiUrl = `https://api.nexray.eu.cc/ai/quillbot?text=${encodeURIComponent(text)}`;
    const res = await axios.get(apiUrl, {
      timeout: 15000,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });

    const data = res.data;
    if (!data.status || !data.result) {
      await m.react("❌");
      return m.reply("⚠️ فشلت إعادة الصياغة.");
    }

    await m.reply(data.result);
    await m.react("✅");

  } catch (error) {
    console.error("[Quillbot]", error.message);
    await m.react("❌");
    m.reply("😔 حدث خطأ أثناء معالجة النص.");
  }
}

export { pluginConfig as config, handler };