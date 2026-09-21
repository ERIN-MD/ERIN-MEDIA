import axios from "axios";
import { uploadImage } from "../../src/lib/maro-uploader.js";
import { f } from "../../src/lib/maro-http.js";
import te from "../../src/lib/maro-error.js";
import { live3d } from "../../src/scraper/seaart.js";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "لاسود",
  alias: ["black"],
  category: "ai",
  description: "تحويل الصورة إلى بشرة داكنة",
  usage: ".لاسود (رد على صورة)",
  example: ".لاسود",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 30,
  energi: 2,
  isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🖤 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const isImage = m.isImage || (m.quoted && m.quoted.type === "imageMessage");

  if (!isImage) {
    return m.reply(`🖤 *لاسود*\n\n> رد على صورة لتغيير لون البشرة\n\n📌 *مثال:* \`${m.prefix}لاسود\``);
  }

  const PROMPT = `Transform skin tone to a darker complexion, maintain facial features, realistic shadows, high detail, natural skin texture, no distortion`;

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

    await m.react("⏳");
    const result = await live3d(buffer, PROMPT);

    m.react("✅");
    await sock.sendMedia(m.chat, result.image, null, m, { type: "image" });
  } catch (error) {
    console.log(error);
    m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };