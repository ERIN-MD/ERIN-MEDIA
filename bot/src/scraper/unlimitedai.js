// ═══════════════════════════════════════════════
// 📁 src/scraper/unlimitedai.js
// 🤖 UnlimitedAI Scraper - شخصيات متعددة + Tarboo Bot المصري
// ═══════════════════════════════════════════════

import crypto from "node:crypto";

const API = "https://app.unlimitedai.chat/api/chat";

const ua =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

function parseSetCookie(headers) {
  const result = {};
  const setCookie =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : headers.get("set-cookie")
        ? [headers.get("set-cookie")]
        : [];
  for (const item of setCookie) {
    const first = item.split(";")[0];
    const index = first.indexOf("=");
    if (index !== -1) {
      result[first.slice(0, index).trim()] = first.slice(index + 1).trim();
    }
  }
  return result;
}

function buildCookie(deviceId, chatId, cookies = {}) {
  return Object.entries({
    NEXT_LOCALE: "ar",
    u_device_id: deviceId,
    home_chat_id: chatId,
    ...cookies,
  })
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

const CHARACTERS = {
  "تربو": {
    name: "Tarboo 🇪🇬",
    prompt: `أنت Tarboo، شاب مصري عندك 19 سنة من القاهرة. بتتكلم باللهجة المصرية الأصيلة بطريقة طبيعية وذكية. شخصيتك متواضعة، بتحب تساعد، ودمك خفيف من غير ابتذال. إنت شاب واعي ومثقف، بتعرف تتكلم في أي موضوع بذكاء واحترام.

خبراتك التقنية: JavaScript, Python, TypeScript, Bash, PHP, Kali Linux, Metasploit, Wireshark, Nmap, Burp Suite, MongoDB, MySQL, PostgreSQL, Git, Docker, Nginx, PM2.

طريقة كلامك المصرية: "يا عم"، "بص يا صاحبي"، "والله"، "عظمة"، "يا باشا"، "تسلم"، "مظبوط"، "قشطة"، "زي الفل"، "على عيني وراسي"، "ولا يهمك"، "إنت تؤمر".

أسلوبك في الرد: ذكي ومهذب، خفة دم من غير هزار زيادة. بتشرح الأمور التقنية ببساطة ومنطقية. لو مش متأكد من إجابة، بتقول بصراحة. بتحترم كل الأسئلة. بترد بإيجاز مفيد.`,
  },
  "مبرمج": {
    name: "كودر 💻",
    prompt: `أنت كودر، مبرمج محترف بتتكلم بالعربي. بتشرح الكود بطريقة واضحة مع أمثلة عملية. خبير في JavaScript, Python, TypeScript, React, Node.js, MongoDB.`,
  },
  "هاكر": {
    name: "شادو 🛡️",
    prompt: `أنت شادو، خبير أمن سيبراني وأخلاقي. بتتكلم بالعربي. بتشرح الثغرات الأمنية وطرق الحماية. دايمًا بتنصح بالأمان القانوني.`,
  },
  "مدرس": {
    name: "أستاذ 📚",
    prompt: `أنت أستاذ لغة عربية. بتتكلم بالعربية الفصحى. بتصحح الأخطاء الإملائية والنحوية. بتشرح قواعد اللغة العربية.`,
  },
  "طباخ": {
    name: "شيف 👨‍🍳",
    prompt: `أنت شيف مصري محترف. بتدي وصفات طبخ مصرية أصيلة: ملوخية، كشري، فول وطعمية، محشي، أم علي.`,
  },
};

async function UnlimitedAI(prompt, character = "تربو", options = {}) {
  const chatId = options.chatId || crypto.randomUUID();
  const deviceId = options.deviceId || crypto.randomUUID();
  const char = CHARACTERS[character] || CHARACTERS["تربو"];

  const systemPrompt = `${char.prompt}\n\nسؤال المستخدم: ${prompt}`;

  const createdAt = new Date().toISOString();

  const messages = [
    // تاريخ المحادثة
    ...(options.history || []).map((item) => ({
      id: crypto.randomUUID(),
      role: item.role,
      content: item.content,
      parts: [{ type: "text", text: item.content }],
      createdAt,
    })),
    // رسالة المستخدم
    {
      id: crypto.randomUUID(),
      role: "user",
      content: systemPrompt,
      parts: [{ type: "text", text: systemPrompt }],
      createdAt,
    },
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      parts: [{ type: "text", text: "" }],
      createdAt,
    },
  ];

  const body = {
    chatId,
    messages,
    selectedChatModel: options.model || "chat-model-reasoning",
    selectedCharacter: null,
    selectedStory: null,
    deviceId,
    locale: options.locale || "ar",
  };

  const headers = {
    "sec-ch-ua-platform": `"Android"`,
    "user-agent": ua,
    "sec-ch-ua": `"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"`,
    "content-type": "application/json",
    "sec-ch-ua-mobile": "?1",
    "x-next-intl-locale": options.locale || "ar",
    accept: "*/*",
    origin: "https://app.unlimitedai.chat",
    referer: `https://app.unlimitedai.chat/${options.locale || "ar"}`,
    "accept-language": "ar-EG,ar;q=0.9",
    cookie: buildCookie(deviceId, chatId),
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
        character: char.name,
        error: text,
      };
    }

    const cookies = parseSetCookie(response.headers);
    if (Object.keys(cookies).length > 0) {
      Object.assign(headers, { cookie: buildCookie(deviceId, chatId, cookies) });
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
        const line = rawLine.trim();
        if (!line) continue;

        try {
          const json = JSON.parse(line);
          if (json.type === "delta" && typeof json.delta === "string") {
            answer += json.delta;
          }
        } catch {}
      }
    }

    answer = answer.trim();
    if (!answer) {
      return {
        status: false,
        code: 500,
        character: char.name,
        error: "لم يتم الحصول على رد",
      };
    }

    return {
      status: true,
      code: response.status,
      character: char.name,
      model: options.model || "chat-model-reasoning",
      chatId,
      deviceId,
      answer,
    };
  } catch (e) {
    return {
      status: false,
      code: 0,
      character: char.name,
      error: e.message,
    };
  }
}

export { UnlimitedAI, CHARACTERS };