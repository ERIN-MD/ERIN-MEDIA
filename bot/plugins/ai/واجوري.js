// ═══════════════════════════════════════════════
// 📁 plugins/ai/واجوري.js
// 👓 Waguri AI - فتاة خجولة
// ═══════════════════════════════════════════════

import { UnlimitedAI } from "../../src/scraper/unlimitedai.js";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "واجوري",
  alias: ["waguri", "waguriai", "waguri-ai"],
  category: "ai",
  description: "محادثة مع واجوري - فتاة خجولة من أنمي",
  usage: ".واجوري <سؤال>",
  example: ".واجوري مرحبا",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 2,
  isEnabled: true,
};

async function handler(m, { sock, text }) {
  if (!text) {
    return m.reply(
      `👓 *واجوري*\n\n` +
        `> فتاة خجولة من أنمي "الفتاة التي أحبها نسيت نظارتها"\n\n` +
        `📝 *.واجوري <سؤال>*\n` +
        `💡 *.واجوري مرحبا*\n` +
        `💡 *.واجوري ما اسمك؟*`
    );
  }

  m.react("⏳");

  try {
    const result = await UnlimitedAI(text, "waguri-ai");

    if (!result.status) {
      m.react("❌");
      return m.reply(`❌ فشل: ${result.error || "لا يوجد رد"}`);
    }

    m.react("✅");
    await m.reply(result.answer.slice(0, 4096));
  } catch (e) {
    console.error(e);
    m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };