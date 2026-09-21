import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import os from "os";
import path from "path";
import { DailymotionDL } from "../../src/scraper/dailymotion.js";

const exec = promisify(execFile);

const pluginConfig = {
  name: "ديليموشن",
  alias: ["dailymotion"],
  category: "downloader",
  description: "تحميل فيديو من ديلي موشن",
  usage: ".ديليموشن <رابط>",
  example: ".ديليموشن https://www.dailymotion.com/video/xxx",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 15,
  energi: 2,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const text = m.text?.trim();
  if (!text) {
    m.react("❌");
    return m.reply(
      `🎬 *محمل ديلي موشن*\n\n` +
        `تحميل فيديو من ديلي موشن، تحويل تلقائي إلى MP4.\n\n` +
        `*الاستخدام:*\n` +
        `> *${m.prefix}ديليموشن <رابط>*\n\n` +
        `*مثال:*\n` +
        `> *${m.prefix}ديليموشن https://www.dailymotion.com/video/xxx*\n\n` +
        `_قد تستغرق عملية التحويل بعض الوقت_`,
    );
  }

  m.react("🕕");

  try {
    const result = await DailymotionDL(text);

    if (!result.status) {
      m.react("☢");
      return m.reply(`❌ *فشل ديلي موشن*\n\n> ${result.error}`);
    }

    let caption =
      `🎬 *ديلي موشن*\n\n` +
      `> 📌 ${result.title}\n` +
      `> ⏱️ المدة: ${result.duration}\n` +
      `> 📺 الجودة: ${result.quality}`;

    if (result.thumbnail) {
      await sock.sendMedia(m.chat, result.thumbnail, caption, m, {
        type: "image",
      });
    }

    if (result.video) {
      const tmpFile = path.join(os.tmpdir(), `dm_${Date.now()}.mp4`);

      await exec(
        "ffmpeg",
        [
          "-y",
          "-i",
          result.video,
          "-c",
          "copy",
          "-bsf:a",
          "aac_adtstoasc",
          tmpFile,
        ],
        { timeout: 120000 },
      );

      const buffer = fs.readFileSync(tmpFile);
      fs.unlinkSync(tmpFile);

      await sock.sendMessage(
        m.chat,
        {
          document: buffer,
          mimetype: "video/mp4",
          fileName:
            (result.title || "video").replace(/[<>:"/\\|?*]/g, "") + ".mp4",
          caption,
        },
        { quoted: m },
      );
    }

    m.react("✅");
  } catch (e) {
    console.error(e);
    m.react("☢");
    m.reply("❌ فشل جلب بيانات ديلي موشن، حاول مجدداً لاحقاً");
  }
}

export { pluginConfig as config, handler };