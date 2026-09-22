import { DeepSeekThinking } from "../../src/scraper/deepseek.js";
import { saluranCtx } from "../../src/lib/maro-context.js";
import te from "../../src/lib/maro-error.js";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "ديب_سيك",
  alias: ["ds"],
  category: "ai",
  description: "محادثة مع DeepSeek V4 (تفكير عميق)",
  usage: ".ديب_سيك <سؤال>",
  example: ".ديب_سيك اشرح الثقب الأسود",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 2,
  isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🧠 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const text = m.args.join(" ");
  if (!text) {
    return m.reply(
      `🧠 *DeepSeek V4*\n\n` +
      `يفكر أولاً ثم يجيب — مناسب للأسئلة العميقة.\n\n` +
      `📌 *مثال:* \`${m.prefix}ديب_سيك اشرح الثقب الأسود\`\n\n` +
      `_قد يستغرق وقتاً أطول قليلاً_`
    );
  }

  await m.react("⏳");

  try {
    const result = await DeepSeekThinking(text);

    if (!result.success) {
      await m.react("❌");
      return m.reply(`❌ فشل DeepSeek\n\n> فشل الحصول على رد`);
    }

    await m.react("✅");

    let reply = ``;

    if (result.reasoning) {
      const reasoningPreview =
        result.reasoning.length > 800
          ? result.reasoning.slice(0, 800) + "..."
          : result.reasoning;
      reply += `💭 *عملية التفكير:*\n${reasoningPreview.replace(/\n/g, "\n> ")}\n\n`;
    }

    if (result.answer) {
      reply += `${result.answer}`;
    }

    if (reply.length > 4096) {
      reply = reply.slice(0, 4096) + "\n\n... (تم الاختصار)";
    }

    await m.reply(reply);
  } catch (e) {
    console.error(e);
    await m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };