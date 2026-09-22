import { GPT5 } from "../../src/scraper/gpt5.js";
import { saluranCtx } from "../../src/lib/maro-context.js";
import te from "../../src/lib/maro-error.js";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "جيبيتي5",
  alias: ["gpt5"],
  category: "ai",
  description: "محادثة مع GPT-4.1 Nano",
  usage: ".جيبيتي5 <سؤال>",
  example: ".جيبيتي5 ما هو الحوسبة الكمية؟",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 2,
  isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🤖 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const text = m.args.join(" ");
  if (!text) {
    return m.reply(
      `🤖 *جيبيتي5*\n\n` +
      `اسأل أي شيء، يجيبك بنموذج GPT-4.1 Nano.\n\n` +
      `📌 *مثال:* \`${m.prefix}جيبيتي5 ما هو الحوسبة الكمية؟\`\n\n` +
      `_قد تتأخر الإجابة قليلاً_`
    );
  }

  await m.react("⏳");

  try {
    const result = await GPT5(text);

    if (!result.status) {
      await m.react("❌");
      return m.reply(`❌ فشل جيبيتي5\n\n> ${result.error || "فشل الحصول على رد"}`);
    }

    await m.react("✅");

    const reply = `${result.answer}`;

    await m.reply(reply.length > 4096 ? reply.slice(0, 4096) + "..." : reply, {
      contextInfo: saluranCtx(),
    });
  } catch (e) {
    console.error(e);
    await m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };