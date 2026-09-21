import axios from "axios";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { generateWAMessage, generateWAMessageFromContent, jidNormalizedUser } from "maro";
import config from "../../config.js";
import te from "../../src/lib/maro-error.js";

const execAsync = promisify(exec);

// ═══════════════════════════════════════════════
// 🛠️ تحويل M3U8 إلى MP4
// ═══════════════════════════════════════════════
async function convertM3u8ToMp4(m3u8Url, outputPath) {
  const cmd = `ffmpeg -y -i "${m3u8Url}" -c copy -bsf:a aac_adtstoasc "${outputPath}"`;
  await execAsync(cmd, { timeout: 120000 });
  return fs.existsSync(outputPath);
}

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "بنترفيد",
  alias: ["pinvid"],
  category: "search",
  description: "بحث عن فيديوهات Pinterest (ألبوم)",
  usage: ".بنترفيد <بحث>",
  example: ".بنترفيد anime",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 30, energi: 2, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🎬 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const query = m.text?.trim();

  if (!query) {
    return m.reply(`📌 *بنترفيد*\n\n📌 مثال: \`${m.prefix}بنترفيد anime\``);
  }

  m.react("⏳");

  try {
    const res = await axios.get(
      `https://firefly.maiku.my.id/api/pinterestvideo?apikey=MaroNextGen&q=${encodeURIComponent(query)}`,
      { timeout: 60000 }
    );

    if (!res.data?.status || !res.data?.data?.length) {
      m.react("❌");
      return m.reply(`❌ لم يتم العثور على فيديوهات لـ: ${query}`);
    }

    const videos = res.data.data.slice(0, 5);
    const tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const mediaList = [];

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      if (!video.video_url) continue;

      try {
        let videoBuffer;
        if (video.video_url.includes(".m3u8")) {
          const outputPath = path.join(tempDir, `pinvid_${Date.now()}_${i}.mp4`);
          try {
            await convertM3u8ToMp4(video.video_url, outputPath);
            if (fs.existsSync(outputPath)) {
              videoBuffer = fs.readFileSync(outputPath);
              fs.unlinkSync(outputPath);
            }
          } catch { continue; }
        } else {
          const videoRes = await axios.get(video.video_url, { responseType: "arraybuffer", timeout: 60000 });
          videoBuffer = Buffer.from(videoRes.data);
        }

        if (videoBuffer && videoBuffer.length > 1000) {
          mediaList.push({ video: videoBuffer });
        }
      } catch { }
    }

    if (mediaList.length === 0) {
      m.react("❌");
      return m.reply(`❌ فشل تحميل الفيديوهات`);
    }

    m.react("📤");

    try {
      const opener = generateWAMessageFromContent(m.chat, {
        messageContextInfo: { messageSecret: crypto.randomBytes(32) },
        albumMessage: { expectedImageCount: 0, expectedVideoCount: mediaList.length },
      }, { userJid: jidNormalizedUser(sock.user.id), quoted: m, upload: sock.waUploadToServer });

      await sock.relayMessage(opener.key.remoteJid, opener.message, { messageId: opener.key.id });

      for (const content of mediaList) {
        const msg = await generateWAMessage(opener.key.remoteJid, content, { upload: sock.waUploadToServer });
        msg.message.messageContextInfo = {
          messageSecret: crypto.randomBytes(32),
          messageAssociation: { associationType: 1, parentMessageKey: opener.key },
        };
        await sock.relayMessage(msg.key.remoteJid, msg.message, { messageId: msg.key.id });
      }
    } catch {
      for (const content of mediaList) {
        await sock.sendMessage(m.chat, { video: content.video }, { quoted: m });
      }
    }

    m.react("✅");
  } catch (error) {
    console.error("[PinVid] خطأ:", error.message);
    m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };