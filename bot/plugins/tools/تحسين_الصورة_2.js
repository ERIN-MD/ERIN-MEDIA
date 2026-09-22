// تحسين_الصورة_2 - أمر لتحسين جودة الصورة إلى HD باستخدام الذكاء الاصطناعي (V3)

import _sharp from 'sharp'
import { upload, get } from "../../src/scraper/hd.js";
import axios from "axios";
import config from "../../config.js";

function getSharp() {
  return _sharp;
}
import FormData from "form-data";
import path from "path";
import fs from "fs";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "تحسين_الصورة_2",
  alias: ["hd2"],
  category: "tools",
  description: "تحسين جودة الصورة إلى HD باستخدام الذكاء الاصطناعي (V3)",
  usage: ".تحسين_الصورة_2 (رد على صورة)",
  example: ".تحسين_الصورة_2",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 30,
  energi: 2,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const isImage = m.isImage || (m.quoted && m.quoted.type === "imageMessage");
  if (!isImage) {
    return m.reply(
      `✨ *تحسين الصورة إلى HD V2*\n\n> أرسل/رد على صورة لتحسينها\n\n\`${m.prefix}تحسين_الصورة_2\`\n\n> 🕕 تستغرق العملية حوالي دقيقة واحدة`,
    );
  }
  m.react("🕕");
  try {
    let buffer;
    if (m.quoted && m.quoted.isMedia) {
      buffer = await m.quoted.download();
    } else if (m.isMedia) {
      buffer = await m.download();
    }
    if (!buffer) {
      m.react("❌");
      return m.reply(`❌ فشل تحميل الصورة`);
    }
    await m.reply(
      `🕕 *جاري معالجة الصورة...*\n\n> الوقت المتوقع: دقيقة واحدة\n> يرجى الانتظار...`,
    );
    const temp = path.join(process.cwd(), "temp", "hd.jpg");
    fs.writeFileSync(temp, buffer);
    const codes = await upload(temp);
    fs.unlinkSync(temp);
    const uplot = codes.code;
    await new Promise((resolve) => setTimeout(resolve, 10000));
    let result = await get(uplot);
    while (result.status === "waiting") {
      await new Promise((resolve) => setTimeout(resolve, 6000));
      result = await get(uplot);
    }
    if (!result) {
      m.react("❌");
      return m.reply(`❌ فشل تحسين الصورة. حاول مرة أخرى لاحقاً.`);
    }
    m.react("✅");
    await sock.sendMessage(
      m.chat,
      {
        document: { url: result.downloadUrls[0] },
        mimetype: "image/png",
        jpegThumbnail: await (
          await getSharp()
        )(
          await axios
            .get(result.downloadUrls[0], { responseType: "arraybuffer" })
            .then((res) => Buffer.from(res.data)),
        )
          .resize(50, 50)
          .jpeg({ quality: 30 })
          .toBuffer(),
        fileLength: 99999999999999,
        fileName: `تم_التحسين_بواسطة_${config.bot.name}`,
      },
      { quoted: m },
    );
  } catch (error) {
    m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };