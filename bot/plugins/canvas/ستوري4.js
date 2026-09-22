import { getAssetBuffer } from "../../src/lib/maro-asset-manager.js";
import * as _canvas from '@napi-rs/canvas'
import axios from "axios";
import te from "../../src/lib/maro-error.js";

// ═══════════════════════════════════════════════
// 🛠️ إعدادات الرسم
// ═══════════════════════════════════════════════
const canvasConfig = { width: 720, cardBg: "#121212", textColor: "#ffffff", cornerRadius: 35 };

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

async function createFakeStory(username, avatarBuffer, img1Buffer, img2Buffer) {
  const { createCanvas, loadImage } = _canvas;
  const height = 1150;
  const canvas = createCanvas(canvasConfig.width, height);
  const ctx = canvas.getContext("2d");
  const avatar = await loadImage(avatarBuffer);
  const img1 = await loadImage(img1Buffer);
  const img2 = await loadImage(img2Buffer || img1Buffer);

  ctx.fillStyle = "#1a1a1a"; ctx.fillRect(0, 0, canvas.width, canvas.height);

  const m = 25, top = 60;
  const cw = canvas.width - m * 2, ch = height - top * 2;

  ctx.save();
  roundedRectPath(ctx, m, top, cw, ch, canvasConfig.cornerRadius);
  ctx.fillStyle = canvasConfig.cardBg; ctx.fill(); ctx.clip();

  drawAvatar(ctx, avatar, m + 20, top + 22, 45);
  ctx.font = "bold 18px Arial"; ctx.fillStyle = canvasConfig.textColor;
  ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillText(username, m + 80, top + 45);

  // صورتين
  const imgH = (ch - 160) / 2;
  [img1, img2].forEach((img, idx) => {
    const ratio = img.width / img.height;
    let dw, dh, dx, dy;
    const yPos = top + 90 + idx * imgH;
    if (ratio > cw / imgH) { dh = imgH; dw = imgH * ratio; dx = m - (dw - cw) / 2; dy = yPos; }
    else { dw = cw; dh = cw / ratio; dx = m; dy = yPos - (dh - imgH) / 2; }
    ctx.save(); ctx.beginPath(); ctx.rect(m, yPos, cw, imgH); ctx.clip();
    ctx.drawImage(img, dx, dy, dw, dh); ctx.restore();
  });

  ctx.restore();
  return await canvas.encode("png");
}

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "ستوري4",
  alias: ["fakestory4"],
  category: "canvas",
  description: "إنشاء ستوري انستغرام بصورتين",
  usage: ".ستوري4 <اسم> (رد على صور)",
  example: ".ستوري4 محمد",
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
    } catch { avatarBuffer = getAssetBuffer("pp-kosong"); }

    let img1, img2;
    if (m.quoted && m.quoted.isImage) {
      img1 = await m.quoted.download();
      img2 = m.isImage ? await m.download() : img1;
    } else if (m.isImage) {
      img1 = await m.download();
      img2 = img1;
    } else {
      m.react("❌");
      return m.reply(`📷 *ستوري 4*\n\n📌 مثال: \`${m.prefix}ستوري4 محمد\`\n\n💡 أرسل صورة أو رد على صورة`);
    }

    if (!img1) { m.react("❌"); return m.reply(`❌ فشل تحميل الصورة`); }

    const result = await createFakeStory(username, avatarBuffer, img1, img2);
    await sock.sendMedia(m.chat, result, null, m, { type: "image" });
    m.react("✅");
  } catch (error) {
    m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };