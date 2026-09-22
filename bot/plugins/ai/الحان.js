import axios from "axios";
import te from "../../src/lib/maro-error.js";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "الحان",
  alias: ["suno"],
  category: "ai",
  description: "إنشاء موسيقى بالذكاء الاصطناعي",
  usage: ".الحان <وصف>",
  example: ".الحان أغنية حزينة عن الفراق مع بيانو",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 30,
  energi: 3,
  isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🎵 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const prompt = m.text?.trim() || m.args.join(" ");

  if (!prompt) {
    return m.reply(`❌ اكتب وصف الأغنية.\n\n📌 *مثال:* \`${m.prefix}الحان أغنية بوب رومانسية مبهجة\``);
  }

  await m.react("⏳");

  try {
    const apiUrl = `https://api.nexray.eu.cc/ai/suno?prompt=${encodeURIComponent(prompt)}`;
    
    const res = await axios.get(apiUrl, {
      timeout: 180000,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });

    const data = res.data;
    if (!data.status || !data.result) {
      await m.react("❌");
      return m.reply("⚠️ فشل إنشاء الأغنية. جرب وصفاً آخر.");
    }

    const r = data.result;

    const caption = `🎵 *صانع الموسيقى* 🎵\n\n` +
      `*العنوان:* ${r.title}\n` +
      `*الوسوم:* ${r.tags}\n` +
      `*المدة:* ${r.duration} ثانية\n\n` +
      `*الكلمات:*\n${r.lyrics}`;

    await sock.sendMessage(m.chat, {
      audio: { url: r.url },
      mimetype: "audio/mpeg",
      ptt: false,
    }, { quoted: m });

    await sock.sendMessage(m.chat, {
      image: { url: r.thumbnail },
      caption: caption
    }, { quoted: m });

    await m.react("✅");

  } catch (error) {
    console.error("[Music Maker AI]", error.message);
    await m.react("❌");
    m.reply("😔 حدث خطأ أثناء معالجة الطلب. قد يكون السيرفر مشغولاً.");
  }
}

export { pluginConfig as config, handler };