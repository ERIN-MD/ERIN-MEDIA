import FormData from "form-data";
import fetch from "node-fetch";
import mime from "mime-types";
import te from "../../src/lib/maro-error.js";

// ═══════════════════════════════════════════════
// 🛠️ رفع الصورة
// ═══════════════════════════════════════════════
async function uploadToCatbox(buffer, filename = "file.jpg") {
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("fileToUpload", buffer, { filename, contentType: mime.lookup(filename) || "image/jpeg" });

  const res = await fetch("https://catbox.moe/user/api.php", {
    method: "POST", body: form, headers: form.getHeaders(), timeout: 30000,
  });

  if (!res.ok) throw new Error("فشل الرفع");
  const url = await res.text();
  if (!url.startsWith("http")) throw new Error("استجابة غير صالحة");
  return url;
}

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "جورا",
  alias: ["gura"],
  category: "canvas",
  description: "تأثير Gura على الصورة",
  usage: ".جورا (رد على صورة)",
  example: ".جورا",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 5, energi: 1, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🦈 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  let buffer = null;

  if (m.quoted && m.quoted.isImage) {
    buffer = await m.quoted.download();
  } else if (m.isImage) {
    buffer = await m.download();
  } else {
    return m.reply(`🦈 *جورا*\n\n📌 مثال: \`${m.prefix}جورا\`\n\n💡 رد على صورة`);
  }

  if (!buffer) return m.reply("❌ فشل تحميل الصورة");

  await m.react("⏳");

  try {
    const imgUrl = await uploadToCatbox(buffer);
    const apiUrl = `https://api.nexray.eu.cc/canvas/gura?url=${encodeURIComponent(imgUrl)}`;
    const res = await fetch(apiUrl);

    if (!res.ok) throw new Error("API فشل");

    const result = Buffer.from(await res.arrayBuffer());
    await sock.sendMessage(m.chat, { image: result, caption: "🦈 *جورا هنا!*" }, { quoted: m });
    await m.react("✅");

  } catch (err) {
    await m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };