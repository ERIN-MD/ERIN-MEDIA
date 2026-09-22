import { Txt2Img2 } from "../../src/scraper/txt2img2.js";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "تخيل",
  alias: ["flux"],
  category: "ai",
  description: "إنشاء صورة من نص باستخدام Flux",
  usage: ".تخيل <وصف>",
  example: ".تخيل سيارة لامبورغيني",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 30,
  energi: 3,
  isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🎨 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const text = m.args.join(" ");
  if (!text) {
    m.react("❌");
    return m.reply(
      `🎨 *تخيل*\n\n` +
      `إنشاء صورة من وصف نصي.\n\n` +
      `📌 *مثال:* \`${m.prefix}تخيل سيارة لامبورغيني\`\n\n` +
      `_قد تستغرق 30-60 ثانية_`
    );
  }

  m.react("⏳");

  try {
    const result = await Txt2Img2(text);

    if (!result.status) {
      m.react("❌");
      return m.reply(`❌ فشل التوليد\n\n> ${result.error}`);
    }

    await sock.sendMedia(m.chat, result.url, `🎨 *Flux*\n\n> الوصف: *${result.prompt}*`, m, { type: "image" });

    m.react("✅");
  } catch (e) {
    console.error(e);
    m.react("❌");
    m.reply("❌ فشل توليد الصورة، حاول مرة أخرى");
  }
}

export { pluginConfig as config, handler };