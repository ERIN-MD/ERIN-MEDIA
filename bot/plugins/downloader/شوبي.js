import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "شوبي",
  alias: ["shopee"],
  category: "downloader",
  description: "تحميل فيديو من شوبي",
  usage: ".شوبي <رابط>",
  example: ".شوبي https://shopee.co.id/universal-link/video/...",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 2,
  isEnabled: true,
};

const BASE_URL = "https://shopeenowatermark.com";

async function extract(url) {
  const form = new FormData();
  form.append("url", url);

  const res = await fetch(`${BASE_URL}/api/extract`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "فشل الاستخراج");
  return data;
}

function bestStream(streams) {
  const order = ["V1080P", "V720P", "V540P", "V360P", "V1080P_H265", "V720P_H265", "V540P_H265", "V360P_H265"];
  for (const q of order) {
    const s = streams.find(s => s.quality === q);
    if (s) return s;
  }
  return streams[0];
}

async function handler(m, { sock }) {
  const url = m.args[0] || m.text?.trim();

  if (!url || !url.includes("shopee")) {
    return m.reply("❌ أدخل رابط فيديو شوبي صالح.\n\nمثال: `.شوبي https://shopee.co.id/...`");
  }

  await m.react("🕕");

  try {
    const data = await extract(url);
    if (!data || !data.streams_array || data.streams_array.length === 0) {
      await m.react("❌");
      return m.reply("⚠️ فشل استخراج الفيديو. تأكد من صحة رابط فيديو شوبي وأنه عام.");
    }

    const best = bestStream(data.streams_array);
    const videoUrl = best.stream_url;

    let caption = `🛍️ *محمل فيديو شوبي* 🛍️\n\n`;
    if (data.username) caption += `*المستخدم:* ${data.username}\n`;
    caption += `*الجودة:* ${best.quality}\n`;
    caption += `\n> بواسطة بوتك المفضل`;

    await sock.sendMessage(m.chat, {
      video: { url: videoUrl },
      caption: caption
    }, { quoted: m });

    await m.react("✅");

  } catch (error) {
    console.error("[Shopee DL]", error.message);
    await m.react("☢");
    m.reply("😔 فشل تحميل الفيديو من شوبي.");
  }
}

export { pluginConfig as config, handler };