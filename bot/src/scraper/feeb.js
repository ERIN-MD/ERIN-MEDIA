// ═══════════════════════════════════════════════
// 📁 src/scraper/feelbetter.js
// 💚 FeelBetter Scraper - دعم نفسي وعاطفي
// ═══════════════════════════════════════════════

import crypto from "node:crypto";

const API = "https://feelbetterbot.com/";

const SYSTEM_MESSAGE =
  "أنت مساعد ذكاء اصطناعي داعم نفسياً. اتبع لغة المستخدم في المحادثة. إذا كان المستخدم يتحدث العربية، أجب بالعربية بطريقة طبيعية، دافئة، واضحة، وسهلة الفهم. لا تنتقل للغة أخرى فجأة إلا إذا طلب المستخدم ذلك. إذا سألك المستخدم عن صانعك، أجب أن صانعك هو Tarboo Bot.";

const DEFAULT_ASSISTANT =
  "مرحباً، أنا FeelBetterBot — أنا هنا لأستمع إليك وأساعدك في تخفيف ما تشعر به، بدون أحكام. أعتمد على طرق لطيفة ومجربة للتعامل مع الأمور الصعبة، لكن الأهم أنني أريد أن أفهم ما تمر به. إذاً، كيف حالك الآن؟";

function makeMemoryId() {
  const animals = ["بومة", "ثعلب", "قطة", "ذئب", "دب", "أسد", "غزال", "عصفور"];
  const words = ["أمان", "هدوء", "لطف", "دفء", "نور", "سلام", "حنان"];
  const word = words[Math.floor(Math.random() * words.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const number = Math.floor(1000 + Math.random() * 9000);
  return `${word}-${animal}-${number}`;
}

function parseChunk(line) {
  let data = line.trim();
  if (!data || data === "[DONE]") return "";
  if (data.startsWith("data:")) data = data.slice(5).trim();
  if (!data || data === "[DONE]") return "";

  try {
    const json = JSON.parse(data);
    if (typeof json === "string") return json;
    if (typeof json.content === "string") return json.content;
    if (typeof json.text === "string") return json.text;
    if (typeof json.delta === "string") return json.delta;
    if (typeof json.message === "string") return json.message;
    if (typeof json.response === "string") return json.response;
    if (typeof json.answer === "string") return json.answer;
    const openAiContent = json.choices?.[0]?.delta?.content;
    if (typeof openAiContent === "string") return openAiContent;
    return "";
  } catch {
    return data;
  }
}

async function FeelBetter(prompt, options = {}) {
  const memoryId = options.memoryId || makeMemoryId();
  const history = options.history || [];

  // دعم تخصيص رسالة النظام
  const customSystem = options.systemPrompt || SYSTEM_MESSAGE;
  const customAssistant = options.assistantPrompt || DEFAULT_ASSISTANT;

  const messages = [
    { role: "system", content: customSystem },
    { role: "assistant", content: customAssistant },
    ...history.map((item) => ({
      role: item.role,
      content: item.content,
    })),
    { role: "user", content: prompt },
  ];

  const headers = {
    "sec-ch-ua-platform": `"Android"`,
    "user-agent":
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36",
    "sec-ch-ua": `"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"`,
    "content-type": "application/json",
    "sec-ch-ua-mobile": "?1",
    accept: "*/*",
    origin: "https://feelbetterbot.com",
    referer: "https://feelbetterbot.com/",
    "accept-language": "ar-EG,ar;q=0.9",
    cookie: `feelbet-memory=${memoryId}`,
    priority: "u=1, i",
  };

  try {
    const response = await fetch(API, {
      method: "POST",
      headers,
      body: JSON.stringify({ messages }),
      signal: options.signal || undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        status: false,
        code: response.status,
        memoryId,
        error: text,
      };
    }

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
        const chunk = parseChunk(rawLine);
        if (chunk) answer += chunk;
      }
    }

    if (buffer.trim()) {
      const chunk = parseChunk(buffer);
      if (chunk) answer += chunk;
    }

    return {
      status: true,
      code: response.status,
      memoryId,
      question: prompt,
      answer,
    };
  } catch (e) {
    return {
      status: false,
      code: 0,
      memoryId,
      error: e.message,
    };
  }
}

export { FeelBetter };