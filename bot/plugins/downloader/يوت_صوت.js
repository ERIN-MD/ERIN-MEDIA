import axios from "axios";
import ytdl, { fallbackToMp3Buffer } from "../../src/scraper/ytdl.js";
const pluginConfig = {
  name: "يوت_صوت",
  alias: ["ytmp3"],
  category: "downloader",
  description: "تحميل صوت يوتيوب",
  usage: ".يوت_صوت <رابط>",
  example: ".يوت_صوت https://youtube.com/watch?v=xxx",
  cooldown: 20,
  energi: 2,
  isEnabled: true,
};

async function getAudioDownload(url) {
  try {
    const { data } = await axios.get(
      `https://api.nexray.eu.cc/downloader/v1/ytmp3?url=${encodeURIComponent(url)}`,
    );
    const download = data?.result?.url;
    const title = data?.result?.title;
    if (download) {
      return { download, title };
    }
  } catch {}

  const fallback = await ytdl(url, "mp3");
  if (fallback?.status && fallback?.dl) {
    return { download: fallback.dl, title: fallback.title, isFallback: true };
  }

  throw new Error(fallback?.mess || "فشل الحصول على رابط تحميل الصوت");
}

async function handler(m, { sock }) {
  const url = m.text?.trim();
  if (!url)
    return m.reply(`مثال: ${m.prefix}يوت_صوت https://youtube.com/watch?v=xxx`);
  if (!url.includes("youtube.com") && !url.includes("youtu.be"))
    return m.reply("❌ الرابط يجب أن يكون يوتيوب");

  m.react("🕕");

  try {
    const result = await getAudioDownload(url);

    if (result.isFallback) {
      const mp3Buffer = await fallbackToMp3Buffer(result.download);
      await sock.sendMessage(
        m.chat,
        {
          audio: mp3Buffer,
          mimetype: "audio/mpeg",
          ptt: false,
          fileName: `${result.title || "audio"}.mp3`,
        },
        { quoted: m },
      );
    } else {
      await sock.sendMedia(m.chat, result.download, null, m, {
        type: "audio",
        mimetype: "audio/mpeg",
        ptt: false,
        fileName: result.title || "audio.mp3",
      });
    }
    m.react("✅");
  } catch (err) {
    console.error("[YTMP3]", err);
    m.react("❌");
    m.reply("فشل تحميل الصوت.");
  }
}

export { pluginConfig as config, handler };