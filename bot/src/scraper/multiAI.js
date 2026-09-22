// ═══════════════════════════════════════════════
// 📁 src/scraper/multiAI.js
// 🤖 Multi-Model AI Wrapper - Gemini + Claude
// ═══════════════════════════════════════════════

import gemini from "./gemini.js";

async function geminiChat({ message, instruction = "", imageBuffer = null, history = [], language = "ar" }) {
  const result = await gemini({ message, instruction, sessionId: null, language });
  return { status: true, text: result.text, raw: result, model: "gemini" };
}

async function claudeChat(message) {
  try {
    const ClaudeModule = await import("./claudehaiku.js");
    const result = await ClaudeModule.ClaudeHaiku(message);
    return { status: true, text: result?.answer, raw: result, model: "claude" };
  } catch (e) {
    return { status: false, text: "Claude غير متاح حالياً", error: e.message, model: "claude" };
  }
}

async function chat({ message, instruction = "", imageBuffer = null, history = [], model = "auto" } = {}) {
  if (model === "claude") {
    return await claudeChat(message);
  }
  if (model === "gemini") {
    return await geminiChat({ message, instruction, imageBuffer, history });
  }
  // auto: استخدم Claude للبرمجة، Gemini للمحادثة
  if (/(حلل|analyse|analyze|برمجي|code|خطأ|import|syntax)/i.test(message)) {
    return await claudeChat(message);
  }
  return await geminiChat({ message, instruction, imageBuffer, history });
}

export { chat, geminiChat, claudeChat };
export default chat;
