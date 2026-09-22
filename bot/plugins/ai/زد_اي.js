import { askNvidia } from "../../src/lib/maro-nvidia-ai.js";

const pluginConfig = {
  name: "زد_اي", alias: ["zai", "glm", "glm5", "زد"], category: "ai",
  description: "محادثة GLM-5 من Z.ai - تدقيق وتحليل", usage: ".زد_اي <سؤال/كود>",
  example: ".زد_اي راجع هذا الكود", isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 8, energi: 2, isEnabled: true,
};

async function handler(m, { text }) {
  if (!text) return m.reply(`🤖 *Z.ai GLM-5*\n\n${m.prefix}زد_اي <سؤال أو كود>\n\nمثال:\n${m.prefix}زد_اي حلل هذا الكود`);
  await m.react("🧠");
  const messages = [
    { role: "system", content: "أنت مساعد لتحليل الكود والأمن السيبراني الدفاعي. أجب بالعربية ولا تقدم تعليمات ضارة." },
    { role: "user", content: text },
  ];
  try {
    const result = await askNvidia({ model: "z-ai/glm5", messages, maxTokens: 2000 });
    return m.reply(result.answer);
  } catch {
    try {
      const result = await askNvidia({ model: "deepseek-ai/deepseek-v4-pro", messages, maxTokens: 2000 });
      return m.reply(result.answer);
    } catch (error) {
      await m.react("❌");
      return m.reply(error.message.includes("غير مهيأ") ? "❌ مزود Z.ai غير مهيأ على السيرفر." : "❌ فشل الاتصال. حاول لاحقاً.");
    }
  }
}

export { pluginConfig as config, handler };
