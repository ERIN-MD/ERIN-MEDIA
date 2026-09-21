import { ClaudeHaiku } from "../../src/scraper/claudehaiku.js";
import { saluranCtx } from "../../src/lib/maro-context.js";
import te from "../../src/lib/maro-error.js";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "كلود",
  alias: ["cloud"],
  category: "ai",
  description: "محادثة مع Claude Haiku 4.5",
  usage: ".كلود <سؤال>",
  example: ".كلود اشرح نظرية النسبية",
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
      `🤍 *Claude Haiku 4.5*\n\n` +
      `اسأل أي شيء — سريع وخفيف، مناسب للأسئلة اليومية.\n\n` +
      `📌 *مثال:* \`${m.prefix}كلود اشرح نظرية النسبية\`\n\n` +
      `_ردود سريعة وذكية_`
    );
  }

  await m.react("⏳");

  try {
    const result = await ClaudeHaiku(text);

    if (!result.status) {
      await m.react("❌");
      return m.reply(`❌ فشل Claude Haiku\n\n> ${result.error || "فشل الحصول على رد"}`);
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