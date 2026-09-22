import axios from "axios";
import te from "../../src/lib/maro-error.js";

// ═══════════════════════════════════════════════
// 🛠️ رفع الصورة إلى Catbox
// ═══════════════════════════════════════════════
async function uploadToCatbox(buffer) {
  const FormData = (await import("form-data")).default;
  const fetch = (await import("node-fetch")).default;
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("fileToUpload", buffer, { filename: "image.jpg", contentType: "image/jpeg" });

  const res = await fetch("https://catbox.moe/user/api.php", {
    method: "POST", body: form, headers: form.getHeaders(),
  });
  const url = (await res.text()).trim();
  if (!url.startsWith("http")) throw new Error("فشل الرفع");
  return url;
}

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "ميوزك_وهمي",
  alias: ["mcard"],
  category: "canvas",
  description: "إنشاء بطاقة موسيقية وهمية",
  usage: ".ميوزك_وهمي <العنوان>|<الفنان> (رد على صورة)",
  example: ".ميوزك_وهمي Perfect|Ed Sheeran",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 5, energi: 2, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🎵 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const text = m.text?.trim();

  let buffer = null;
  if (m.quoted && m.quoted.isImage) {
    buffer = await m.quoted.download();
  } else if (m.isImage) {
    buffer = await m.download();
  } else {
    return m.reply(`🎵 *ميوزك وهمي*\n\n📌 مثال: \`${m.prefix}ميوزك_وهمي Perfect|Ed Sheeran\`\n\n💡 رد على صورة`);
  }

  if (!buffer) return m.reply("❌ فشل تحميل الصورة");

  if (!text || !text.includes("|")) {
    return m.reply("❌ اكتب العنوان والفنان\n\n📌 مثال: \`.ميوزك_وهمي Perfect|Ed Sheeran\`");
  }

  const parts = text.split("|");
  const judul = parts[0].trim();
  const nama = parts[1]?.trim() || "غير معروف";

  await m.react("⏳");

  try {
    const imgUrl = await uploadToCatbox(buffer);

    const apiUrl = `https://api.nexray.eu.cc/canvas/musiccard?judul=${encodeURIComponent(judul)}&nama=${encodeURIComponent(nama)}&image_url=${encodeURIComponent(imgUrl)}`;

    const res = await axios.get(apiUrl, { responseType: "arraybuffer", timeout: 30000 });
    const cardBuffer = Buffer.from(res.data);

    await sock.sendMessage(m.chat, {
      image: cardBuffer,
      caption: `🎵 *${judul}*\n🎤 *${nama}*`
    }, { quoted: m });

    await m.react("✅");

  } catch (err) {
    console.error("[Music Card]", err.message);
    await m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };