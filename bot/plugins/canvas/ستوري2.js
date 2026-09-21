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
  options: "M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
};

function roundedRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

function drawAvatar(ctx, img, x, y, size) {
  ctx.save(); ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
  ctx.closePath(); ctx.clip(); ctx.drawImage(img, x, y, size, size); ctx.restore();
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

  const m = 25, top = 60;
  const cw = canvas.width - m * 2, ch = height - top * 2;

  ctx.save();
  roundedRectPath(ctx, m, top, cw, ch, canvasConfig.cornerRadius);
  ctx.fillStyle = canvasConfig.cardBg; ctx.fill(); ctx.clip();

  // الصورة الشخصية
  drawAvatar(ctx, avatar, m + 20, top + 22, 45);
  ctx.font = "bold 18px Arial"; ctx.fillStyle = canvasConfig.textColor;
  ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillText(username, m + 80, top + 45);

  // الصورة الرئيسية
  const imgRatio = img.width / img.height;
  const contentH = ch - 160;
  let dw, dh, dx, dy;
  if (imgRatio > cw / contentH) { dh = contentH; dw = contentH * imgRatio; dx = m - (dw - cw) / 2; dy = top + 90; }
  else { dw = cw; dh = cw / imgRatio; dx = m; dy = top + 90 - (dh - contentH) / 2; }
  ctx.save(); ctx.beginPath(); ctx.rect(m, top + 90, cw, contentH); ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh); ctx.restore();

  ctx.restore();
  return await canvas.encode("png");
}

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "ستوري2",
  alias: ["fakestory2"],
  category: "canvas",
  description: "إنشاء ستوري انستغرام وهمية V2",
  usage: ".ستوري2 <اسم> (رد على صورة)",
  example: ".ستوري2 محمد",
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
      return m.reply(`📷 *ستوري 2*\n\n📌 مثال: \`${m.prefix}ستوري2 محمد\`\n\n💡 رد على صورة`);
    }

    if (!imageBuffer) { m.react("❌"); return m.reply(`❌ فشل تحميل الصورة`); }

    const resultBuffer = await createFakeStory(username, avatarBuffer, imageBuffer);
    await sock.sendMedia(m.chat, resultBuffer, null, m, { type: "image" });
    m.react("✅");
  } catch (error) {
    m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };