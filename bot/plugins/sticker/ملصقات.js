import _sharp from 'sharp'
import axios from "axios";
import config from "../../config.js";
import te from "../../src/lib/maro-error.js";
import { f } from "../../src/lib/maro-http.js";
import { addExifToWebp } from "../../src/lib/maro-exif.js";

function getSharp() {
  return _sharp;
}

const MAX_STICKERS = 20;
const DOWNLOAD_DELAY = 700;

async function downloadBuffer(url) {
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 15000,
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  return Buffer.from(res.data);
}

async function toWebpSticker(buffer) {
  return (await getSharp())(buffer)
    .resize(512, 512, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality: 80 })
    .toBuffer();
}

const pluginConfig = {
  name: "ملصقات",
  alias: ["pinpack", "ppack", "pinsticker", "pinsearchpack", "حزمة_ملصقات"],
  category: "sticker",
  description: "بحث عن صور من بينترست وتحويلها إلى حزمة ملصقات",
  usage: ".ملصقات <بحث>",
  example: ".ملصقات قطط",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: true,
  cooldown: 20,
  energi: 3,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const query = m.args?.join(" ")?.trim();

  if (!query) {
    return m.reply(
      `🎨 *حزمة ملصقات*\n\n` +
      `📝 *الاستخدام:* \`.ملصقات <بحث>\`\n\n` +
      `📌 *أمثلة:*\n` +
      `• \`.ملصقات قطط\`\n` +
      `• \`.ملصقات أنمي\`\n` +
      `• \`.ملصقات طبيعة\``
    );
  }

  await m.react("⏳");

  try {
    const data = await f(`https://api.siputzx.my.id/api/s/pinterest?query=${query}`);
    const results = data?.data?.slice(0, MAX_STICKERS);

    if (!results || results.length === 0) {
      await m.react("❌");
      return m.reply(`❌ لم يتم العثور على نتائج لـ: *${query}*`);
    }

    const stickerBuffers = [];

    for (const item of results) {
      const imageUrl = item.image_url;
      if (!imageUrl) continue;

      try {
        const buf = await downloadBuffer(imageUrl);
        const webp = await toWebpSticker(buf);
        stickerBuffers.push(webp);
        await new Promise((r) => setTimeout(r, DOWNLOAD_DELAY));
      } catch {
        continue;
      }
    }

    if (!stickerBuffers.length) {
      await m.react("❌");
      return m.reply(`❌ فشل تحميل الصور`);
    }

    const packname = `Pinterest: ${query}`;
    const author = config.bot?.developer || config.sticker?.author || "Bot";

    try {
      await sock.sendStickerPack(m.chat, stickerBuffers, m, {
        name: packname,
        packname,
        publisher: author,
        author,
        description: `حزمة ملصقات من بينترست: ${query}`,
        emojis: ["❤️"],
      });
      await m.react("✅");
    } catch (packErr) {
      let sent = 0;
      for (const buf of stickerBuffers) {
        try {
          let exifBuf = buf;
          try {
            exifBuf = await addExifToWebp(buf, { packname, author, emojis: ["❤️"] });
          } catch {}
          await sock.sendMessage(
            m.chat,
            { sticker: exifBuf, contextInfo: { isForwarded: true, forwardingScore: 1 } },
            { quoted: m },
          );
          sent++;
          await new Promise((r) => setTimeout(r, 500));
        } catch {
          continue;
        }
      }
      if (sent > 0) {
        await m.react("✅");
      } else {
        await m.react("❌");
      }
    }
  } catch (error) {
    console.error("[ملصقات] خطأ:", error.message);
    await m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };