import crypto from "crypto";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "نسخ_فيديو",
  alias: ["videotranscribe"],
  category: "tools",
  description: "نسخ فيديو من رابط إلى نص (يوتيوب، MP4، الخ)",
  usage: ".نسخ_فيديو <رابط> [لغة]",
  example: ".نسخ_فيديو https://youtu.be/dQw4w9WgXcQ\n.نسخ_فيديو https://youtu.be/dQw4w9WgXcQ ar",
  cooldown: 30,
  energi: 2,
  isEnabled: true,
};

const ENDPOINT = "https://api.proactor.ai:7788/v1/tourists/files/transcription";
const DEFAULT_LANG = "en";

const HEADERS = {
  accept: "application/json, text/plain, */*",
  "content-type": "application/json",
  origin: "https://videotranscriber.ai",
  referer: "https://videotranscriber.ai/",
  "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36",
};

function makeTrackId() {
  return `${crypto.randomUUID()}_${Date.now()}`;
}

function msToTime(ms = 0) {
  const total = Math.floor(Number(ms) / 1000);
  const minute = Math.floor(total / 60);
  const second = total % 60;
  return `${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
}

function joinTranscript(items = []) {
  return items
    .map((item) => item?.text || "")
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanResult(input, json) {
  const data = Array.isArray(json?.data) ? json.data : [];
  if (json?.code !== 200 || data.length === 0) {
    return {
      status: false,
      code: json?.code || 500,
      message: json?.msg || json?.message || "لم يتم العثور على النص",
    };
  }
  const title = data.find((item) => item?.videoTitle)?.videoTitle || "بدون عنوان";
  const segments = data.map((item, index) => ({
    index: index + 1,
    startMs: item?.duration ?? null,
    start: msToTime(item?.duration || 0),
    text: item?.text || "",
  }));
  return {
    status: true,
    title,
    total: segments.length,
    transcript: joinTranscript(data),
    segments,
  };
}

async function transcriber(url, language = DEFAULT_LANG) {
  if (!url || !/^https?:\/\//i.test(String(url))) {
    throw new Error("الرابط فارغ أو غير صالح");
  }
  const body = {
    track_id: makeTrackId(),
    fileUrl: url,
    language: language,
  };
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("الاستجابة ليست JSON: " + text.slice(0, 200));
  }
  const result = cleanResult(url, json);
  if (!result.status) throw new Error(result.message);
  return result;
}

async function handler(m, { args }) {
  const url = args[0];
  const lang = args[1] || DEFAULT_LANG;

  if (!url) {
    return m.reply(
      `*📝 نسخ الفيديو*\n\n\`\`\`${m.prefix}نسخ_فيديو <رابط_الفيديو> [اللغة]\`\`\`\n\nمثال:\n\`${m.prefix}نسخ_فيديو https://youtu.be/... ar\``
    );
  }

  m.react("🕕");

  try {
    const result = await transcriber(url, lang);
    
    let info = `📝 *نسخ الفيديو*\n\n`;
    info += `*🎬 العنوان:* ${result.title}\n`;
    info += `*🗣️ اللغة:* ${lang.toUpperCase()}\n`;
    info += `*🔢 المقاطع:* ${result.total}\n\n`;
    info += `*📜 النص:*\n${result.transcript.substring(0, 2500)}`;
    
    if (result.transcript.length > 2500) {
      info += `... (النص طويل جداً)`;
    }

    m.react("✅");
    await m.reply(info);
  } catch (err) {
    console.error("[نسخ الفيديو]", err.message);
    m.react("☢");
    m.reply(`❌ *فشل:* ${err.message || "فشل معالجة الفيديو"}`);
  }
}

export { pluginConfig as config, handler };