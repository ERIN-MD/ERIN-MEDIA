import axios from "axios";

const API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

function getNvidiaKeys(value = process.env.NVIDIA_API_KEYS || process.env.NVIDIA_API_KEY || "") {
  return String(value).split(/[\s,;]+/).map((item) => item.trim()).filter(Boolean);
}

async function askNvidia({ model, messages, maxTokens = 2048, keys = getNvidiaKeys() } = {}) {
  if (!model || !Array.isArray(messages) || !messages.length) throw new Error("طلب NVIDIA غير صالح");
  if (!keys.length) throw new Error("مزود NVIDIA غير مهيأ. أضف NVIDIA_API_KEY أو NVIDIA_API_KEYS إلى بيئة السيرفر.");

  let lastError;
  for (const key of keys) {
    try {
      const response = await axios.post(API_URL, {
        model,
        messages,
        max_tokens: maxTokens,
      }, {
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        timeout: 30000,
      });
      const answer = response.data?.choices?.[0]?.message?.content;
      if (answer) return { ok: true, answer, model };
      lastError = new Error("لم يُعد مزود NVIDIA نصاً صالحاً");
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(lastError?.message || "تعذر الاتصال بمزود NVIDIA");
}

export { getNvidiaKeys, askNvidia };
