// ═══════════════════════════════════════════════
// 📁 src/scraper/qwen.js
// 🤖 Qwen3 Scraper - نموذج علي بابا المتقدم
// ═══════════════════════════════════════════════

import crypto from "node:crypto";

const API = "https://api.overchat.ai/v1/chat/completions";

const ua =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

const MODELS = {
  "qwen3": {
    id: "alibaba/qwen3-next-80b-a3b-instruct",
    name: "Qwen3 80B",
    persona: "qwen-3-landing",
    description: "نموذج علي بابا المتقدم - 80 مليار معامل",
  },
};

function parseCompletionBody(raw) {
  try {
    const data = JSON.parse(raw);
    return { answer: data?.choices?.[0]?.message?.content || data?.choices?.[0]?.delta?.content || "", model: data?.model || null };
  } catch {}
  let answer = "";
  let model = null;
  for (const line of String(raw || "").split(/\r?\n/)) {
    const data = line.trim().replace(/^data:\s*/, "");
    if (!data || data === "[DONE]") continue;
    try {
      const json = JSON.parse(data);
      if (typeof json.model === "string") model = json.model;
      const content = json.choices?.[0]?.delta?.content || json.choices?.[0]?.message?.content;
      if (typeof content === "string") answer += content;
    } catch {}
  }
  return { answer, model };
}

async function Qwen3(prompt, options = {}) {
  const chatId = options.chatId || crypto.randomUUID();
  const deviceId = options.deviceId || crypto.randomUUID();
  const modelKey = options.model || "qwen3";
  const modelConfig = MODELS[modelKey] || MODELS["qwen3"];
  const model = modelConfig.id;

  // نظام الشخصية بالعربية
  const systemPrompt = options.systemPrompt || 
    `تحدث بنفس لغة المستخدم. أجب بطريقة طبيعية ومفيدة ومباشرة. كن ودوداً ومحترماً.`;

  const messages = [
    // تاريخ المحادثة السابقة
    ...(options.history || []).map((item) => ({
      id: crypto.randomUUID(),
      role: item.role,
      content: item.content,
    })),
    // رسالة النظام
    {
      id: crypto.randomUUID(),
      role: "system",
      content: systemPrompt,
    },
    // رسالة المستخدم
    {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
    },
  ];

  const body = {
    chatId,
    model,
    messages,
    personaId: modelConfig.persona,
    frequency_penalty: options.frequencyPenalty || 0,
    max_tokens: options.maxTokens || 4000,
    presence_penalty: options.presencePenalty || 0,
    stream: options.stream !== false,
    temperature: options.temperature || 0.5,
    top_p: options.topP || 0.95,
  };

  const headers = {
    "sec-ch-ua-platform": `"Android"`,
    "x-device-uuid": deviceId,
    "sec-ch-ua": `"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"`,
    "sec-ch-ua-mobile": "?1",
    "x-device-language": options.language || "ar-EG",
    "x-device-platform": "web",
    "x-device-version": "1.0.44",
    "user-agent": ua,
    accept: "*/*",
    "content-type": "application/json",
    origin: "https://overchat.ai",
    referer: "https://overchat.ai/",
    "accept-language": "ar-EG,ar;q=0.9",
    priority: "u=1, i",
  };

  try {
    const response = await fetch(API, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: options.signal || undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        status: false,
        code: response.status,
        model,
        modelName: modelConfig.name,
        error: text,
      };
    }

    // لو مش streaming
    if (options.stream === false) {
      const parsed = parseCompletionBody(await response.text());
      const answer = parsed.answer;
      return {
        status: Boolean(answer),
        code: response.status,
        model: parsed.model || model,
        modelName: modelConfig.name,
        question: prompt,
        chatId,
        deviceId,
        answer,
        error: answer ? undefined : "لم يُعد Qwen نصاً صالحاً",
      };
    }

    // وضع streaming
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";
    let answer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith("data:")) continue;

        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;

        try {
          const json = JSON.parse(data);
          const content = json.choices?.[0]?.delta?.content;
          if (typeof content === "string") answer += content;
        } catch {}
      }
    }

    return {
      status: true,
      code: response.status,
      model,
      modelName: modelConfig.name,
      question: prompt,
      chatId,
      deviceId,
      answer,
    };
  } catch (e) {
    return {
      status: false,
      code: 0,
      model,
      modelName: modelConfig.name,
      error: e.message,
    };
  }
}

export { Qwen3, MODELS };
