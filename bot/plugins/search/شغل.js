import yts from "yt-search";
import axios from "axios";
import ytdl, { fallbackToMp3Buffer } from "../../src/scraper/ytdl.js";
import config from "../../config.js";

// ═══════════════════════════════════════════════
// 🛠️ دوال مساعدة
// ═══════════════════════════════════════════════
function formatViews(n) {
  if (!n) return "0";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toString();
}

async function getPlayAudioDownload(url) {
  try {
    const apiUrl = `https://api.cuki.biz.id/api/downloader/ytmp3?apikey=${config.APIkey.cuki}&url=${encodeURIComponent(url)}&quality=128`;
    const res = await axios.get(apiUrl, { timeout: 30000 });
    const data = res.data;
    if (data.success && data.data?.audio?.download?.downloadUrl) {
      return { download: data.data.audio.download.downloadUrl, title: data.data.metadata?.title || "Audio" };
    }
  } catch (err) {}

  const fallback = await ytdl(url, "mp3");
  if (fallback?.status && fallback?.dl) {
    return { download: fallback.dl, title: fallback.title, isFallback: true };
  }

  throw new Error(fallback?.mess || "فشل الحصول على الصوت");
}

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "شغل",
  alias: ["play"],
  category: "search",
  description: "تشغيل موسيقى من يوتيوب",
  usage: ".شغل <بحث>",
  example: ".شغل komang",
  cooldown: 15, energi: 1, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🎵 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const query = m.text?.trim();
  if (!query) return m.reply(`🎵 *شغل*\n\n📌 مثال: \`${m.prefix}شغل komang\``);

  m.react("⏳");

  try {
    const search = await yts(query);
    if (!search.videos.length) throw "لم يتم العثور على فيديو";

    const video = search.videos[0];

    let info = `🎵 *جاري التشغيل*\n\n`;
    info += `📌 *العنوان:* ${video.title}\n\n`;
    info += `👤 القناة: *${video.author.name}*\n`;
    info += `⏱️ المدة: *${video.duration.timestamp}*\n`;
    info += `👀 المشاهدات: *${formatViews(video.views)}*\n`;
    info += `📅 الرفع: *${video.ago}*\n`;
    info += `🔗 ${video.url}\n\n`;
    info += `_⏳ جاري إرسال الصوت..._`;

    await sock.sendPreview(m.chat, {
      caption: `${info}`,
      url: video.url,
      title: video.title,
      description: "YouTube Video",
      image: video.thumbnail,
      previewType: 1,
    }, { quoted: m });

    const audio = await getPlayAudioDownload(video.url);

    if (audio.isFallback) {
      const mp3Buffer = await fallbackToMp3Buffer(audio.download);
      await sock.sendMessage(m.chat, {
        audio: mp3Buffer,
        mimetype: "audio/mpeg",
        ptt: false,
        fileName: `${audio.title || video.title || "audio"}.mp3`,
      }, { quoted: m });
    } else {
      await sock.sendMedia(m.chat, audio.download, video.title, m, { type: "audio" });
    }

    m.react("✅");
  } catch (err) {
    console.error("[Play]", err);
    m.react("❌");
    m.reply(`❌ حدث خطأ، حاول لاحقاً`);
  }
}

export { pluginConfig as config, handler };