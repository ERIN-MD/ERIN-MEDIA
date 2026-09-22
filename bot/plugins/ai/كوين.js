import { Qwen3 } from "../../src/scraper/qwen3.js";
import { saluranCtx } from "../../src/lib/maro-context.js";
import te from "../../src/lib/maro-error.js";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "كوين",
  alias: ["qwen"],
  category: "ai",
  description: "محادثة مع Qwen3 80B",
  usage: ".كوين <سؤال>",
  example: ".كوين ما هو تعلم الآلة؟",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 2,
  isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🔵 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const text = m.args.join(" ");
  if (!text) {
    return m.reply(
      `🔵 *Qwen3 80B*\n\n` +
      `نموذج ضخم من Alibaba يتقن كل اللغات.\n\n` +
      `📌 *مثال:* \`${m.prefix}كوين ما هو تعلم الآلة؟\`\n\n` +
      `_قد يتأخر قليلاً لكن إجاباته رائعة_`
    );
  }

  await m.react("⏳");

  try {
    const result = await Qwen3(text);

    if (!result.status) {
      await m.react("❌");
      return m.reply(`❌ فشل Qwen3\n\n> ${result.error || "فشل الحصول على رد"}`);
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