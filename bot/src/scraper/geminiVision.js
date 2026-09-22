// ═══════════════════════════════════════════════
// 📁 src/scraper/gemini-chat.js
// 🤖 Gemini Chat Wrapper - معالجة محادثات وصور
// ═══════════════════════════════════════════════

import gemini from "./gemini.js";

function buildMessage({ message, history = [], imageBuffer = null, language = "ar" }) {
  const parts = [];

  // إضافة سجل المحادثة
  if (Array.isArray(history) && history.length > 0) {
    const historyText = history
      .slice(-10)
      .map((item) => {
        const role = item?.role === "assistant" ? "المساعد" : "المستخدم";
        const content = String(item?.content || "").trim();
        return content ? `${role}: ${content}` : "";
      })
      .filter(Boolean)
      .join("\n");

    if (historyText) {
      parts.push(`سجل المحادثة:\n${historyText}`);
    }
  }

  // إضافة وصف للصورة
  if (imageBuffer) {
    parts.push(
      "قام المستخدم بإرسال صورة. إذا كان النموذج لا يستطيع رؤية الصور مباشرة، أجب بناءً على سياق النص المتاح.",
    );
  }

  // إضافة الرسالة الرئيسية
  parts.push(String(message || "").trim());

  return parts.filter(Boolean).join("\n\n").trim();
}

async function chat({
  message,
  instruction = "",
  imageBuffer = null,
  history = [],
  language = "ar",
  sessionId = null,
} = {}) {
  try {
    const result = await gemini({
      message: buildMessage({ message, history, imageBuffer, language }),
      instruction,
      sessionId,
      language,
    });

    return {
      status: true,
      text: result.text,
      raw: result.raw || result.text,
      model: result.model || "gemini",
      sessionId: result.sessionId || null,
    };
  } catch (e) {
    return {
      status: false,
      error: e.message,
      model: "gemini",
    };
  }
}

export { chat };