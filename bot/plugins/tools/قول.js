import axios from "axios";
import { getAudioUrl } from "google-tts-api";

const pluginConfig = {
  name: "قول",
  alias: [],
  category: "tools",
  description: "تحويل النص إلى رسالة صوتية",
  usage: ".قول <النص>",
  example: ".قول أهلاً، هذه رسالة صوتية من ماروبوت",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

const MAX_TEXT_LENGTH = 200;
const MIN_AUDIO_BYTES = 1024;

async function requestDracinUrl(text) {
  const endpoint = "https://api.nexray.eu.cc/ai/dracin-tts";
  const response = await axios.get(endpoint, {
    timeout: 120000,
    params: {
      text,
      speed: "1.0",
      volume: "0.5",
      music: "false",
    },
    headers: {
      "user-agent": "Mozilla/5.0",
      accept: "application/json",
    },
  });

  if (!response.data?.status || !response.data?.result) {
    throw new Error("لم تُرجع خدمة الصوت رابطاً صالحاً.");
  }

  return response.data.result;
}

async function downloadAudio(url) {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 60000,
    headers: { "user-agent": "Mozilla/5.0" },
  });

  const audio = Buffer.from(response.data || []);
  const mimeType = String(response.headers?.["content-type"] || "").split(";")[0];

  if (!mimeType.startsWith("audio/") || audio.length < MIN_AUDIO_BYTES) {
    throw new Error("رابط الصوت الناتج غير صالح أو فارغ.");
  }

  return { audio, mimeType };
}

function getFallbackUrl(text) {
  const language = /[\u0600-\u06FF]/.test(text) ? "ar" : "en";
  return getAudioUrl(text, { lang: language, slow: false });
}

async function generateSpeech(text) {
  try {
    const dracinUrl = await requestDracinUrl(text);
    return await downloadAudio(dracinUrl);
  } catch (dracinError) {
    console.warn("[قول] تعذر استخدام Dracin، جارٍ استخدام المحرك البديل:", dracinError?.message);
    return downloadAudio(getFallbackUrl(text));
  }
}

async function handler(m, { sock, text }) {
  const content = String(text || "").trim();

  if (!content) {
    await m.reply(
      `╭━━〔 🎙️ *قول* 〕━━╮\n` +
        `│ اكتب النص الذي تريد تحويله إلى صوت.\n` +
        `│ مثال: \`${m.prefix}قول أهلاً بك\`\n` +
        `╰━━〔 Tarboo Bot 〕━━╯`,
    );
    return;
  }

  if (content.length > MAX_TEXT_LENGTH) {
    await m.reply(
      `⚠️ النص طويل جداً. الحد الأقصى هو *${MAX_TEXT_LENGTH}* حرفاً لكل رسالة صوتية.`,
    );
    return;
  }

  await m.react?.("🕕").catch(() => {});

  try {
    const { audio, mimeType } = await generateSpeech(content);

    await sock.sendMedia(m.chat, audio, null, m, {
      type: "audio",
      mimetype: mimeType || "audio/mpeg",
      ptt: false,
    });

    await m.react?.("✅").catch(() => {});
  } catch (error) {
    console.error("[قول]", error?.message || error);
    await m.react?.("❌").catch(() => {});
    await m.reply(
      `⚠️ *تعذر تحويل النص إلى صوت حالياً.*\n` +
        `> تحقق من اتصال البوت ثم أعد المحاولة لاحقاً.\n` +
        `> Tarboo Bot`,
    );
  }
}

export { pluginConfig as config, handler };