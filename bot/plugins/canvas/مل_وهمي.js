import { getAssetBuffer } from "../../src/lib/maro-asset-manager.js";
import axios from "axios";
import { uploadTo0x0 } from "../../src/lib/maro-tmpfiles.js";
import te from "../../src/lib/maro-error.js";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "مل_وهمي",
  alias: ["fakeml"],
  category: "canvas",
  description: "إنشاء بطاقة موبايل ليجند وهمية",
  usage: ".مل_وهمي <اسم> (رد/إرسال صورة)",
  example: ".مل_وهمي محمد",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 10, energi: 1, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🎮 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const name = m.text?.trim();
  if (!name) {
    return m.reply(`🎮 *ML وهمي*\n\n📌 مثال: \`${m.prefix}مل_وهمي محمد\`\n\n💡 رد على صورة أو أرسل صورة مع الاسم`);
  }

  let buffer = null;

  if (m.quoted && (m.quoted.type === "imageMessage" || m.quoted.isImage)) {
    try { buffer = await m.quoted.download(); } catch (e) {}
  } else if (m.isMedia && m.type === "imageMessage") {
    try { buffer = await m.download(); } catch (e) {}
  } else {
    try {
      let pp = await sock.profilePictureUrl(m.sender, "image");
      buffer = Buffer.from((await axios.get(pp, { responseType: "arraybuffer" })).data);
    } catch {
      buffer = getAssetBuffer("pp-kosong");
    }
  }

  if (!buffer) {
    return m.reply(`❌ أرسل صورة أو رد على صورة!`);
  }

  m.react("⏳");

  try {
    const gmbr = await uploadTo0x0(buffer, { filename: "image.jpg", contentType: "image/jpeg" });
    await sock.sendMedia(
      m.chat,
      `https://api.nexray.web.id/maker/fakelobyml?avatar=${encodeURIComponent(gmbr.directUrl)}&nickname=${encodeURIComponent(name)}`,
      null, m, { type: "image" }
    );
    m.react("✅");
  } catch (error) {
    m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };