import { askNvidia } from "../../src/lib/maro-nvidia-ai.js";

const pluginConfig = {
  name: "نيموترون", alias: ["nemotron", "nemo", "نيمو"], category: "ai",
  description: "Nemotron 3 Super 120B - ذكاء اصطناعي سريع", usage: ".نيموترون <سؤال>",
  example: ".نيموترون من هو رئيس مصر؟", isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 5, energi: 1, isEnabled: true,
};

async function handler(m, { text }) {
  if (!text) return m.reply(`🤖 *Nemotron 3 Super*\n\n${m.prefix}نيموترون <سؤال>\n\nمثال:\n${m.prefix}نيموترون من هو رئيس مصر؟`);
  await m.react("🤖");
  try {
    const result = await askNvidia({ model: "nvidia/nemotron-3-super-120b-a12b", messages: [{ role: "user", content: text }], maxTokens: 8192 });
    const parts = result.answer.split("\n\n");
    return m.reply(parts.at(-1) || result.answer);
  } catch (error) {
    await m.react("❌");
    return m.reply(error.message.includes("غير مهيأ") ? "❌ مزود Nemotron غير مهيأ على السيرفر." : "❌ فشل الاتصال. حاول لاحقاً.");
  }
}

export { pluginConfig as config, handler };
