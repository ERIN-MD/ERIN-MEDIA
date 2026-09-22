// ═══════════════════════════════════════════════
// 📁 src/scraper/dailymotion.js
// 🎬 Dailymotion Scraper - تحميل فيديوهات
// ═══════════════════════════════════════════════

import axios from "axios";

const getRndIP = () =>
  Array.from({ length: 4 }, () => Math.floor(Math.random() * 255)).join(".");

async function DailymotionDL(url, options = {}) {
  const fakeIP = options.ip || getRndIP();

  try {
    const response = await axios({
      method: "post",
      url: "https://vidomon.com/wp-json/aio-dl/video-data/",
      data: `url=${encodeURIComponent(url)}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/148.0.0.0 Mobile Safari/537.36",
        Referer: `https://vidomon.com/dailymotion-video-downloader/#url=${url}`,
        "X-Forwarded-For": fakeIP,
        "X-Real-IP": fakeIP,
      },
      timeout: options.timeout || 30000,
    });

    const data = response.data;

    if (!data.medias || data.medias.length === 0) {
      return {
        status: false,
        error: "لا توجد وسائط متاحة",
        url,
      };
    }

    // ترتيب حسب الجودة
    const sortedMedia = [...data.medias]
      .filter((m) => m.videoAvailable)
      .sort((a, b) => parseInt(b.quality) - parseInt(a.quality));

    // أفضل جودة
    const best = sortedMedia.find((m) => m.extension === "mp4") || sortedMedia[0];

    // تجميع كل الجودات
    const qualities = sortedMedia.map((m) => ({
      quality: m.quality,
      format: m.extension,
      url: m.url,
      size: m.filesize || null,
    }));

    return {
      status: true,
      title: data.title || "بدون عنوان",
      thumbnail: data.thumbnail || null,
      duration: data.duration || null,
      source: data.source || "dailymotion",
      video: best ? best.url : data.medias[0].url,
      quality: best ? best.quality + "p" : data.medias[0].quality + "p",
      qualities,
      url,
    };
  } catch (e) {
    return {
      status: false,
      error: e.message,
      url,
    };
  }
}

export { DailymotionDL };