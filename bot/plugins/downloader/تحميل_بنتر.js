import fs from "fs";
import { pinterestdl } from "../../src/lib/maro-pinterest.js";
import path from "path";
import { queueFFmpeg } from "./../../src/lib/maro-ffmpeg.js";
import { f } from "../../src/lib/maro-http.js";
import te from "../../src/lib/maro-error.js";
const pluginConfig = {
  name: "تحميل_بنتر",
  alias: ["pinterest"],
  category: "downloader",
  description: "تحميل صورة/فيديو من بنترست",
  usage: ".تحميل_بنتر <رابط>",
  example: ".تحميل_بنتر https://pin.it/xxx",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};
async function handler(m, { sock }) {
  const url = m.text?.trim();
  if (!url) {
    return m.reply(
      `📌 *محمل بنترست*\n\n` +
        `> تحميل صورة/فيديو من بنترست\n\n` +
        `*مثال:*\n` +
        `> \`${m.prefix}تحميل_بنتر https://pin.it/xxx\`\n` +
        `> \`${m.prefix}تحميل_بنتر https://pinterest.com/pin/xxx\``,
    );
  }
  if (!url.includes("pinterest") && !url.includes("pin.it")) {
    return m.reply("❌ رابط غير صالح. استخدم رابط بنترست.");
  }
  m.react("🕕");
  try {
    const result = await pinterestdl(url);
    if (!result || !result.media || result.media.length === 0) {
      throw new Error("لا توجد وسائط");
    }
    for (const media of result.media) {
      if (media.type === "video") {
        await sock.sendMedia(m.chat, media.url, null, m, {
          type: "video",
          contextInfo: {
            forwardingScore: 99,
            isForwarded: true,
          },
        });
      } else if (media.type === "image") {
        if (media.url.includes("gif")) {
          const tempPath = path.join(process.cwd(), "temp");
          if (!fs.existsSync(tempPath))
            fs.mkdirSync(tempPath, { recursive: true });
          const id = Date.now();
          const gifPath = path.join(tempPath, `pin-${id}.gif`);
          const mp4Path = path.join(tempPath, `pin-${id}.mp4`);
          try {
            const raw = await f(media.url, "buffer");
            if (!raw) throw new Error("فشل تحميل GIF");
            fs.writeFileSync(gifPath, raw);
            await queueFFmpeg(
              `ffmpeg -y -ignore_loop 0 -i "${gifPath}" -t 30 -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -pix_fmt yuv420p -movflags faststart -preset ultrafast -an "${mp4Path}"`,
            );
            if (!fs.existsSync(mp4Path)) throw new Error("فشل تحويل GIF");
            await sock.sendMedia(m.chat, fs.readFileSync(mp4Path), null, m, {
              type: "video",
              gifPlayback: true,
              contextInfo: {
                forwardingScore: 99,
                isForwarded: true,
              },
            });
          } catch (gifErr) {
            console.error("[PinDL] خطأ تحويل GIF:", gifErr.message);
            await sock.sendMedia(m.chat, media.url, null, m, {
              type: "image",
              contextInfo: { forwardingScore: 99, isForwarded: true },
            });
          } finally {
            if (fs.existsSync(gifPath)) fs.unlinkSync(gifPath);
            if (fs.existsSync(mp4Path)) fs.unlinkSync(mp4Path);
          }
        } else {
          await sock.sendMedia(m.chat, media.url, null, m, {
            type: "image",
            contextInfo: {
              forwardingScore: 99,
              isForwarded: true,
            },
          });
        }
      }
    }
    m.react("✅");
  } catch (error) {
    console.error("[PinDL] خطأ:", error);
    m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}
export { pluginConfig as config, handler };