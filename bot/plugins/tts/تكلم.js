import te from "../../src/lib/maro-error.js";
import maroApi from "../../src/lib/maro-apimanager.js";
import axios from "axios";

const pluginConfig = {
  name: "تكلم",
  alias: ["say", "tts"],
  category: "tts",
  description: "تحويل النص إلى صوت MP3 باستخدام Google TTS",
  usage: ".تكلم <نص>",
  example: ".تكلم مرحباً بالجميع",
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const text = m.text?.trim();

  if (!text) {
    return m.reply(`🎤 *تحويل النص إلى صوت MP3*\n\nالاستخدام:\n${m.prefix}تكلم مرحباً بالعالم`);
  }

  m.react("🎤");

  try {
    const response = await maroApi.nexray.geminiTts(text);
    
    if (!response || !response.result) {
      throw new Error("فشل إنشاء الملف الصوتي");
    }

    // تحميل الملف الصوتي
    const audioResponse = await axios.get(response.result, {
      responseType: 'arraybuffer',
      timeout: 30000
    });
    
    const audioBuffer = Buffer.from(audioResponse.data);

    // إرسال كملف MP3 صوتي عادي
    await sock.sendMessage(
      m.chat,
      {
        audio: audioBuffer,
        mimetype: "audio/mpeg",
        fileName: `tts_${Date.now()}.mp3`
      },
      { quoted: m },
    );
    m.react("✅");
  } catch (err) {
    console.error("خطأ TTS:", err);
    m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };
