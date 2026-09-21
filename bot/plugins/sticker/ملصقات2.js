import _sharp from 'sharp'
import axios from "axios";
import config from "../../config.js";

function getSharp() {
  return _sharp;
}
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "ملصقات2",
  alias: ["sp2", "stickersearch2", "حزمة2"],
  category: "sticker",
  description: "بحث عن حزم ملصقات حقيقية وإرسالها كمجموعة",
  usage: ".ملصقات2 <بحث>",
  example: ".ملصقات2 قطط",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: true,
  cooldown: 20,
  energi: 2,
  isEnabled: true,
};

class StickerAPI {
  async search(query, page = 1) {
    try {
      if (!query) throw new Error("بحث فارغ");
      const res = await axios
        .post("https://getstickerpack.com/api/v1/stickerdb/search", { query, page })
        .then((r) => r.data);
      const data = res.data.map((item) => ({
        name: item.title,
        slug: item.slug,
      }));
      return { status: true, data, total: res.meta.total };
    } catch (e) {
      return { status: false, msg: e.message };
    }
  }

  async detail(slug) {
    try {
      const id = slug.includes('/') ? slug.split('/').pop() : slug;
      const res = await axios
        .get(`https://getstickerpack.com/api/v1/stickerdb/stickers/${id}`)
        .then((r) => r.data.data);
      const stickers = res.images.map((item) => ({
        image: `https://s3.getstickerpack.com/${item.url}`,
      }));
      return { status: true, title: res.title, stickers };
    } catch (e) {
      return { status: false, msg: e.message };
    }
  }
}

const MAX_STICKERS = 15;
const DOWNLOAD_DELAY = 600;

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

async function handler(m, { sock }) {
  const query = m.args?.join(" ")?.trim();

  if (!query) {
    return m.reply(
      `🎨 *حزمة ملصقات*\n\n` +
      `📝 \`.ملصقات2 قطط\` | \`.ملصقات2 أنمي\``
    );
  }

  await m.react("⏳");

  try {
    const api = new StickerAPI();
    const search = await api.search(query);

    if (!search.status || !search.data?.length) {
      await m.react("❌");
      return m.reply(`❌ لا توجد حزم لـ: *${query}*`);
    }

    const randPick = search.data[Math.floor(Math.random() * search.data.length)];
    const detail = await api.detail(randPick.slug);

    if (!detail.status || !detail.stickers?.length) {
      await m.react("❌");
      return m.reply(`❌ فشل تحميل الحزمة`);
    }

    const limited = detail.stickers.slice(0, MAX_STICKERS);
    const stickerBuffers = [];

    for (const s of limited) {
      try {
        const buf = await downloadBuffer(s.image);
        const webp = await toWebpSticker(buf);
        stickerBuffers.push(webp);
        await new Promise((r) => setTimeout(r, DOWNLOAD_DELAY));
      } catch {}
    }

    if (!stickerBuffers.length) {
      await m.react("❌");
      return m.reply(`❌ فشل تحميل الملصقات`);
    }

    // ✨ إرسال كحزمة واحدة
    await sock.sendStickerPack(m.chat, stickerBuffers, m, {
      name: randPick.name,
      packname: randPick.name,
      publisher: config.bot?.developer || "Bot",
      author: config.bot?.developer || "Bot",
    });

    await m.react("✅");

  } catch (error) {
    console.error("[ملصقات2] خطأ:", error.message);
    await m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };