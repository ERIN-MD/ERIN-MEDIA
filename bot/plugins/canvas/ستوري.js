import { getAssetBuffer } from "../../src/lib/maro-asset-manager.js";
import * as _canvas from '@napi-rs/canvas'
import axios from "axios";
import te from "../../src/lib/maro-error.js";

// ═══════════════════════════════════════════════
// 🛠️ إعدادات الرسم
// ═══════════════════════════════════════════════
const canvasConfig = { width: 720, cardBg: "#121212", textColor: "#ffffff", cornerRadius: 35 };

const icons = {
  heart: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  comment: "M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z",
  share: "M2.01 21L23 12 2.01 3 2 10l15 2-15 2z",
  options: "M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
};

function roundedRectPath(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y); ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius); ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawAvatar(ctx, img, x, y, size) {
  ctx.save(); ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
  ctx.closePath(); ctx.clip(); ctx.drawImage(img, x, y, size, size); ctx.restore();
}

function drawCoverImage(ctx, img, x, y, w, h) {
  const imgRatio = img.width / img.height;
  const canvasRatio = w / h;
  let drawW, drawH, drawX, drawY;
  if (imgRatio > canvasRatio) { drawH = h; drawW = h * imgRatio; drawX = x - (drawW - w) / 2; drawY = y; }
  else { drawW = w; drawH = w / imgRatio; drawX = x; drawY = y - (drawH - h) / 2; }
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.drawImage(img, drawX, drawY, drawW, drawH); ctx.restore();
}

async function createFakeStory(username, avatarBuffer, imageBuffer) {
  const { createCanvas, loadImage } = _canvas;
  const height = 1150;
  const canvas = createCanvas(canvasConfig.width, height);
  const ctx = canvas.getContext("2d");
  const avatar = await loadImage(avatarBuffer);
  const img = await loadImage(imageBuffer);

  // خلفية
  ctx.fillStyle = "#1a1a1a"; ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cardMarginX = 25, cardMarginY = 60;
  const cardW = canvas.width - cardMarginX * 2, cardH = height - cardMarginY * 2;
  const cardX = cardMarginX, cardY = cardMarginY;

  ctx.save();
  roundedRectPath(ctx, cardX, cardY, cardW, cardH, canvasConfig.cornerRadius);
  ctx.fillStyle = canvasConfig.cardBg; ctx.fill(); ctx.clip();

  // الصورة الشخصية والاسم
  drawAvatar(ctx, avatar, cardX + 20, cardY + 22, 45);
  ctx.font = "bold 18px Arial"; ctx.fillStyle = canvasConfig.textColor;
  ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillText(username, cardX + 80, cardY + 45);

  // الصورة الرئيسية
  drawCoverImage(ctx, img, cardX, cardY + 90, cardW, cardH - 160);
  ctx.restore();

  return await canvas.encode("png");
}

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "ستوري",
  alias: ["fakestory"],
  category: "canvas",
  description: "إنشاء ستوري انستغرام وهمية",
  usage: ".ستوري <اسم> (رد على صورة)",
  example: ".ستوري محمد",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 10, energi: 1, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 📷 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const username = m.args.join(" ").trim() || m.pushName || "مستخدم";
  m.react("⏳");

  try {
    let avatarBuffer;
    try {
      const pp = await sock.profilePictureUrl(m.sender, "image");
      const res = await axios.get(pp, { responseType: "arraybuffer", timeout: 10000 });
      avatarBuffer = Buffer.from(res.data);
    } catch {
      avatarBuffer = getAssetBuffer("pp-kosong");
    }

    let imageBuffer;
    if (m.quoted && m.quoted.isImage) {
      imageBuffer = await m.quoted.download();
    } else if (m.isImage) {
      imageBuffer = await m.download();
    } else {
      m.react("❌");
      return m.reply(`📷 *ستوري*\n\n📌 مثال: \`${m.prefix}ستوري محمد\`\n\n💡 رد على صورة`);
    }

    if (!imageBuffer) {
      m.react("❌");
      return m.reply(`❌ فشل تحميل الصورة`);
    }

    const resultBuffer = await createFakeStory(username, avatarBuffer, imageBuffer);
    await sock.sendMedia(m.chat, resultBuffer, null, m, { type: "image" });
    m.react("✅");
  } catch (error) {
    m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };