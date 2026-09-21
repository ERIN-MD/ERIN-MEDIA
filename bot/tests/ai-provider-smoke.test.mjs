import { chat as geminiChat } from "../src/scraper/geminiVision.js";
import { ClaudeHaiku } from "../src/scraper/claudehaiku.js";
import { GPT5 } from "../src/scraper/gpt5.js";
import { Qwen3 } from "../src/scraper/qwen3.js";
import { DeepSeekThinking } from "../src/scraper/deepseek.js";

const PROMPT = "أجب بكلمة واحدة فقط: Tarboo Bot. لا تستخدم أدوات ولا تنفذ أي إجراء.";
const TIMEOUT_MS = 45000;

function withTimeout(promise, name) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)),
  ]).then((result) => ({ name, ok: Boolean(result?.status ?? result?.success ?? result?.answer ?? result?.text), text: String(result?.text || result?.answer || "").slice(0, 160), model: result?.model || "unknown" }))
    .catch((error) => ({ name, ok: false, text: error.message, model: "unavailable" }));
}

const results = [];
results.push(await withTimeout(geminiChat({ message: PROMPT, instruction: "أجب بنص فقط." }), "Gemini"));
results.push(await withTimeout(ClaudeHaiku(PROMPT, { stream: false, maxTokens: 80, systemPrompt: "أجب بنص فقط." }), "Claude Haiku"));
results.push(await withTimeout(GPT5(PROMPT, { maxTokens: 80 }), "GPT"));
results.push(await withTimeout(Qwen3(PROMPT, { stream: false, maxTokens: 80 }), "Qwen"));
results.push(await withTimeout(DeepSeekThinking(PROMPT), "DeepSeek"));

for (const item of results) {
  console.log(`${item.name}: ${item.ok ? "OK" : "UNAVAILABLE"} | ${item.model} | ${item.text.replace(/\s+/g, " ")}`);
}

console.log(`ai provider smoke test: ${results.filter((item) => item.ok).length}/${results.length} available`);
