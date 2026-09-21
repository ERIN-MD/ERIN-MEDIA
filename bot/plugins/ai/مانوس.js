// بلوقن محادثة Manus المباشر عبر الوكيل الفوري (agent-default-main_task)

import { diagnoseManusTaskAccess, sendMessageToAgent } from "../../src/lib/manus-api.js";
import config from "../../config.js";

const pluginConfig = {
  name: "مانوس",
  alias: ["manus", "مساعد"],
  category: "ai",
  description: "محادثة مع وكيل Manus الذكي عبر API v2 وWebhook آمن",
  usage: ".مانوس <سؤالك>",
  example: ".مانوس من أنت؟",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const text = m.text?.trim();

  const ownerNumber = String(config?.owner?.number || "").replace(/\D/g, "");
  const senderNumber = String(m.sender || "").split("@")[0].replace(/\D/g, "");
  const isOwner = Boolean(m.isOwner || (ownerNumber && senderNumber === ownerNumber));

  if (text === "تشخيص") {
    if (!isOwner) {
      await m.react("⛔").catch(() => {});
      return;
    }
    await m.react("⏳").catch(() => {});
    const report = await diagnoseManusTaskAccess();
    await m.react(report.created && report.bridgeConnected ? "✅" : "⚠️").catch(() => {});
    const lines = [
      "🧪 *تشخيص جسر Manus API*",
      `> إنشاء المهمة: ${report.created ? "نجح ✅" : "فشل ❌"}`,
      `> جسر Webhook: ${report.bridgeConnected ? "متصل ✅" : "غير متصل ❌"}`,
      report.taskId ? `> المهمة: ${report.taskId}` : null,
      report.status ? `> الحالة: ${report.status === "pending" ? "بانتظار نتيجة Webhook" : report.status}` : null,
      report.code ? `> الرمز: ${report.code}` : null,
      report.requestId ? `> request_id: ${report.requestId}` : null,
      `> النتيجة: ${report.message}`,
      "",
      "> Tarboo Bot",
    ].filter(Boolean);
    return m.reply(lines.join("\n"));
  }

  if (!text || text.toLowerCase() === "مسح" || text === "حذف") {
    return m.reply(
      `🤖 *محادثة Manus الذكية*\n\n` +
      `اكتب سؤالك بعد الأمر؛ سيصل الرد تلقائياً عند اكتمال مهمة Manus:\n` +
      `> ${m.prefix}مانوس ما هي آخر أخبار الذكاء الاصطناعي؟\n` +
      `> ${m.prefix}مانوس تشخيص — للمالك فقط\n\n` +
      `> Tarboo Bot`
    );
  }

  await m.react("⏳").catch(() => {});

  try {
    const replyText = await sendMessageToAgent(text);
    await m.react("✅").catch(() => {});
    await m.reply(`${replyText}\n\n> Tarboo Bot`);
  } catch (error) {
    await m.react("❌").catch(() => {});
    const errMsg = error?.message || "حدث خطأ غير معروف.";
    await m.reply(`❌ تعذر الحصول على رد Manus:\n${errMsg}\n\n> Tarboo Bot`);
  }
}

export { pluginConfig as config, handler };