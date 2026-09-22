import axios from "axios";

const pluginConfig = {
  name: "دويين",
  alias: ["douyin"],
  category: "downloader",
  description: "تحميل فيديو/صوت من دويين (تيك توك الصين)",
  usage: ".دويين <رابط>",
  example: ".دويين https://v.douyin.com/xxx",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

async function douyinFetch(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await axios.get(`https://api.azbry.com/api/downloader/douyin?url=${encodeURIComponent(url)}`, { timeout: 30000 });
      if (res.data?.status && res.data?.result) {
        return res.data;
      }
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error("فشل جلب البيانات من الخادم");
}

async function handler(m, { sock }) {
  const text = m.text?.trim();
  if (!text) {
    m.react("❌");
    return m.reply(
      `🎵 *محمل دويين*\n\n` +
        `تحميل فيديو أو صوت من دويين (تيك توك الصين).\n\n` +
        `*الاستخدام:*\n` +
        `> *${m.prefix}دويين <رابط>*\n\n` +
        `*مثال:*\n` +
        `> *${m.prefix}دويين https://v.douyin.com/xxx*`,
    );
  }

  m.react("🕕");

  try {
    const data = await douyinFetch(text);
    const result = data.result;

    let caption = `🎵 *${result.platform || "دويين"}*\n\n${result.title || ""}`;

    if (result.video) {
      await sock.sendMedia(m.chat, result.video, caption, m, {
        type: "video",
      });
    }

    if (result.audio) {
      await sock.sendMedia(m.chat, result.audio, null, m, {
        type: "audio",
      });
    }

    m.react("✅");
  } catch (e) {
    console.error(e);
    m.react("☢");
    m.reply("❌ فشل جلب بيانات دويين، حاول مجدداً لاحقاً");
  }
}

export { pluginConfig as config, handler };