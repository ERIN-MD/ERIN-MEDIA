import axios from 'axios'
import config from '../../config.js'
import * as timeHelper from '../../src/lib/maro-time.js'
import path from 'path'
import fs from 'fs'
import { f } from '../../src/lib/maro-http.js'
import te from '../../src/lib/maro-error.js'
const NEOXR_APIKEY = config.APIkey?.neoxr || "Milik-Bot-MaroMD";

const pluginConfig = {
  name: "بكسل_درين",
  alias: ["pixeldrain"],
  category: "downloader",
  description: "تحميل ملف من بكسل درين",
  usage: ".بكسل_درين <رابط>",
  example: ".بكسل_درين https://pixeldrain.com/u/xxxxx",
  cooldown: 15,
  energi: 2,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const args = m.args || [];
  const url = args[0]?.trim();

  if (!url || !url.includes("pixeldrain.com")) {
    return m.reply(
      `📥 *محمل بكسل درين*\n\n` +
        `> تحميل ملف من بكسل درين\n\n` +
        `*صيغة:*\n` +
        `> \`${m.prefix}بكسل_درين <رابط>\`\n\n` +
        `*مثال:*\n` +
        `> \`${m.prefix}بكسل_درين https://pixeldrain.com/u/xxxxx\``,
    );
  }

  m.react("🕕");

  try {
    const apiUrl = `https://api.neoxr.eu/api/pixeldrain?url=${encodeURIComponent(url)}&apikey=${NEOXR_APIKEY}`;
    const data = await f(apiUrl)

    if (!data?.status || !data?.data) {
      m.react("❌");
      return m.reply(
        "❌ *فشل*\n\n> الملف غير موجود أو الرابط غير صالح",
      );
    }

    const file = data.data;

    const sizeMatch = file.size?.match(/([\d.]+)\s*(MB|GB|KB)/i);
    let sizeInMB = 0;
    if (sizeMatch) {
      const value = parseFloat(sizeMatch[1]);
      const unit = sizeMatch[2].toUpperCase();
      if (unit === "GB") sizeInMB = value * 1024;
      else if (unit === "MB") sizeInMB = value;
      else if (unit === "KB") sizeInMB = value / 1024;
    }

    if (sizeInMB > 0 && sizeInMB <= 100) {

      await sock.sendMedia(m.chat, file.url, null, m, {
        type: 'document',
        fileName: file.filename,
        mimetype: 'application/octet-stream',
        contextInfo: {
          forwardingScore: 99,
          isForwarded: true
        }
      })
    } else if (sizeInMB > 100) {
      await m.reply(
        `⚠️ *الملف كبير جداً*\n\n> حجم الملف ${file.size} كبير جداً للإرسال\n> استخدم رابط التحميل أعلاه`,
      );
    }

    m.react("✅");
  } catch (error) {
    m.react('☢');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler }