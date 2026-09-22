import fs from "fs";
import path from "path";
import ttdown from "../../src/scraper/tiktok.js";
import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { saluranCtx } from "../../src/lib/maro-context.js";
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const pluginConfig = {
  name: ["تيك_صوت"],
  alias: ["ttmp3"],
  category: "downloader",
  description: "تحميل صوت تيك توك",
  usage: ".تيك_صوت <رابط>",
  example: ".تيك_صوت https://vt.tiktok.com/xxx",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

function getTempDir() {
  const tmpDir = path.join(process.cwd(), "tmp");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  return tmpDir;
}

async function extractAudioFromVideo(videoUrl) {
  const tmpDir = getTempDir();
  const stamp = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const inputFile = path.join(tmpDir, `ttmp3_${stamp}.mp4`);
  const outputFile = path.join(tmpDir, `ttmp3_${stamp}.mp3`);

  const res = await axios.get(videoUrl, {
    responseType: "arraybuffer",
    timeout: 60000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
      Referer: "https://www.tiktok.com/",
    },
  });

  fs.writeFileSync(inputFile, Buffer.from(res.data));

  await new Promise((resolve, reject) => {
    ffmpeg(inputFile)
      .noVideo()
      .audioCodec("libmp3lame")
      .format("mp3")
      .on("end", resolve)
      .on("error", reject)
      .save(outputFile);
  });

  if (!fs.existsSync(outputFile) || fs.statSync(outputFile).size <= 0) {
    throw new Error("فشل استخراج صوت تيك توك");
  }

  return {
    buffer: fs.readFileSync(outputFile),
    files: [inputFile, outputFile],
  };
}

async function handler(m, { sock }) {
  const url = m.text?.trim();
  let cleanupFiles = [];

  const cleanupTempFiles = () => {
    for (const file of cleanupFiles) {
      if (!file) continue;
      try {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      } catch {}
    }
    cleanupFiles = [];
  };

  if (!url) {
    return m.reply(
      `╭┈┈⬡「 🎵 *تحميل تيك توك* 」
┃ ㊗ الاستخدام: \`${m.prefix}تيك_صوت <رابط>\`
╰┈┈⬡

> مثال: ${m.prefix}تيك_صوت https://vt.tiktok.com/xxx`,
    );
  }

  if (!url.match(/tiktok\.com|vt\.tiktok/i)) {
    return m.reply("❌ رابط غير صالح. استخدم رابط تيك توك.");
  }

  m.react("🕕");

  try {
    const result = await ttdown(url);
    const audioDownload = result.downloads.find((d) => d.type === "mp3");
    let audioSource = audioDownload?.url || null;

    if (!audioSource) {
      const videoDownload =
        result.downloads.find((d) => d.type === "nowatermark_hd") ||
        result.downloads.find((d) => d.type === "nowatermark");

      if (!videoDownload?.url) {
        throw new Error("صوت تيك توك غير موجود.");
      }

      const extractedAudio = await extractAudioFromVideo(videoDownload.url);
      cleanupFiles = extractedAudio.files;
      audioSource = extractedAudio.buffer;
    }

    await sock.sendMedia(m.chat, audioSource, null, m, {
      type: "audio",
      mimetype: "audio/mpeg",
      fileName: `TikTok_Audio_${Date.now()}.mp3`,
    });

    m.react("✅");

    // cleanup
    cleanupTempFiles();
  } catch (err) {
    cleanupTempFiles();
    console.error("[TikTokDL] خطأ:", err);
    m.react("❌");
    m.reply(`❌ *فشل التحميل*\n\n> ${err.message}`);
  }
}

export { pluginConfig as config, handler };