import { askNvidia } from "../../src/lib/maro-nvidia-ai.js";

const pluginConfig = {
  name: "نيمو_نانو", alias: ["nano", "نانو", "نيمونانو"], category: "ai",
  description: "Nemotron Nano 30B - ذكاء اصطناعي فائق السرعة", usage: ".نيمو_نانو <سؤال>",
  example: ".نيمو_نانو من هو رئيس مصر؟", isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 3, energi: 1, isEnabled: true,
};

async function handler(m, { text }) {
  if (!text) return m.reply(`🤖 *Nemotron Nano*\n\n${m.prefix}نيمو_نانو <سؤال>\n\nمثال:\n${m.prefix}نيمو_نانو من هو رئيس مصر؟`);
  await m.react("🤖");
  try {
    const result = await askNvidia({ model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning", messages: [{ role: "user", content: text }], maxTokens: 8192 });
    return m.reply(result.answer);
  } catch (error) {
    await m.react("❌");
    return m.reply(error.message.includes("غير مهيأ") ? "❌ مزود Nemotron Nano غير مهيأ على السيرفر." : "❌ فشل الاتصال. حاول لاحقاً.");
  }
}

export { pluginConfig as config, handler };
