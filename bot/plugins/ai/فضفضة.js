import { FeelBetter } from "../../src/scraper/feeb.js";
import { saluranCtx } from "../../src/lib/maro-context.js";
import te from "../../src/lib/maro-error.js";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "فضفضة",
  alias: ["feelbetter"],
  category: "ai",
  description: "مستمع ذكي دون أحكام",
  usage: ".فضفضة <كلامك>",
  example: ".فضفضة أنا حزين اليوم",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 2,
  isEnabled: true,
};

// ═══════════════════════════════════════════════
// 💚 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const text = m.args.join(" ");
  if (!text) {
    return m.reply(
      `💚 *FeelBetterBot*\n\n` +
      `مستمع ذكي جاهز لسماعك — دون أحكام، بدفء وتعاطف.\n\n` +
      `📌 *مثال:* \`${m.prefix}فضفضة أنا حزين اليوم\`\n\n` +
      `_هذا البوت ليس بديلاً عن المختص، لكنه مكان آمن للفضفضة_`
    );
  }

  await m.react("⏳");

  try {
    const result = await FeelBetter(text);

    if (!result.status) {
      await m.react("❌");
      return m.reply(`❌ فشل FeelBetter\n\n> ${result.error || "فشل الحصول على رد"}`);
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