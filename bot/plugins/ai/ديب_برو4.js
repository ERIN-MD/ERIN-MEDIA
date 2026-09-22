import { askNvidia } from "../../src/lib/maro-nvidia-ai.js";

const pluginConfig = {
  name: "ديب_برو4", alias: ["deepseek", "deep", "ds4", "ديب"], category: "ai",
  description: "DeepSeek V4 Pro - ذكاء اصطناعي متقدم", usage: ".ديب_برو4 <سؤال>",
  example: ".ديب_برو4 من هو رئيس مصر؟", isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 10, energi: 2, isEnabled: true,
};

async function handler(m, { text }) {
  if (!text) return m.reply(`🤖 *DeepSeek V4 Pro*\n\n${m.prefix}ديب_برو4 <سؤال>\n\nمثال:\n${m.prefix}ديب_برو4 من هو رئيس مصر؟`);
  await m.react("🤖");
  try {
    const result = await askNvidia({ model: "deepseek-ai/deepseek-v4-pro", messages: [{ role: "user", content: text }], maxTokens: 8192 });
    return m.reply(result.answer);
  } catch (error) {
    await m.react("❌");
    return m.reply(error.message.includes("غير مهيأ") ? "❌ مزود DeepSeek Pro غير مهيأ على السيرفر." : "❌ فشل الاتصال. حاول لاحقاً.");
  }
}

export { pluginConfig as config, handler };
