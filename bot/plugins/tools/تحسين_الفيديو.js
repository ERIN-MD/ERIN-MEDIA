// تحسين_الفيديو - أمر لتحسين جودة الفيديو إلى HD باستخدام FFMPEG

import fs from "fs";
import os from "os";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const pluginConfig = {
  name: "تحسين_الفيديو",
  alias: ["hdvid"],
  category: "tools",
  description: "تحسين جودة الفيديو إلى HD باستخدام FFMPEG",
  usage: ".تحسين_الفيديو (رد على فيديو)",
  example: ".تحسين_الفيديو",
  isOwner: false,
  isPremium: true,
  isGroup: false,
  isPrivate: false,
  cooldown: 120,
  energi: 3,
  isEnabled: true,
};

async function handler(m, { sock }) {
  let isVideoMessage = m.isVideo || (m.quoted && m.quoted.type === "videoMessage");
  let isDocumentMessage = (m.type === "documentMessage" && m.message?.documentMessage?.mimetype?.startsWith("video")) || (m.quoted && m.quoted.type === "documentMessage" && m.quoted.message?.documentMessage?.mimetype?.startsWith("video"));

  if (!isVideoMessage && !isDocumentMessage) {
    let txt = `📹 *تحسين جودة الفيديو* 📹\n\n`;
    txt += `هل لديك فيديو غير واضح؟ يمكنني مساعدتك في تحسينه إلى HD!\n\n`;
    txt += `*طريقة الاستخدام:*\n`;
    txt += `👉 أرسل فيديو مع تعليق \`${m.prefix}تحسين_الفيديو\`\n`;
    txt += `👉 أو رد على فيديو بـ \`${m.prefix}تحسين_الفيديو\`\n\n`;
    txt += `⚠️ _ميزة مميزة، قد تستغرق العملية بعض الوقت حسب حجم الفيديو!_`;
    return m.reply(txt);
  }

  await m.react("🕕");

  try {
    const videoBuffer = (await m?.quoted?.download?.()) || (await m.download?.());

    if (!videoBuffer || videoBuffer.length === 0) {
      await m.react("❌");
      return m.reply(`❌ *فشل*\n\nفشل تحميل الفيديو! حاول إرساله مرة أخرى.`);
    }

    if (videoBuffer.length > 50 * 1024 * 1024) {
      await m.react("❌");
      return m.reply(`❌ *الملف كبير جداً*\n\nالحد الأقصى لحجم الفيديو هو 50 ميجابايت!`);
    }

    await m.reply(`🎞️ *بدء تحسين الفيديو* 🎞️\n\nجاري معالجة الفيديو لتحسين جودته إلى HD! ✨\nالوقت المتوقع يعتمد على حجم الفيديو، يرجى الانتظار!`);

    const tempDir = os.tmpdir();
    const inputPath = path.join(tempDir, `input-hd-${Date.now()}.mp4`);
    const outputPath = path.join(tempDir, `output-hd-${Date.now()}.mp4`);

    fs.writeFileSync(inputPath, videoBuffer);

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilters([
          'scale=iw*2:ih*2:flags=lanczos',
          'unsharp=5:5:1.0:5:5:0.0'
        ])
        .outputOptions([
          '-c:v libx264',
          '-preset fast',
          '-crf 23',
          '-c:a aac',  // تغيير من copy إلى aac لتجنب مشاكل المخزن المؤقت
          '-b:a 128k',
          '-max_muxing_queue_size 1024',  // زيادة حجم قائمة الانتظار
          '-analyzeduration 2147483647',   // تحليل كامل للفيديو
          '-probesize 2147483647'          // فحص كامل للملف
        ])
        .save(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err));
    });

    const resultBuffer = fs.readFileSync(outputPath);

    await sock.sendMedia(m.chat, resultBuffer, `✨ *اكتمل التحسين* ✨\n\nهذه نتيجة تحسين الفيديو، أصبح أكثر وضوحاً وجودة HD! 😍`, m, {
      type: "video",
      mimetype: "video/mp4",
      fileName: `HDVID-${Date.now()}.mp4`,
    });

    await m.react("✅");

    try {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
    } catch (e) {}
  } catch (err) {
    await m.react("❌");
    await m.reply(`❌ فشل تحسين الفيديو! 😭\n\nالتفاصيل: ${err.message}`);
  }
}

export { pluginConfig as config, handler };