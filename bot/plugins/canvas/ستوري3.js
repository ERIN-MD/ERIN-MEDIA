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

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" "); const lines = []; let currentLine = "";
  for (const word of words) {
    const test = currentLine + (currentLine ? " " : "") + word;
    if (ctx.measureText(test).width > maxWidth && currentLine) { lines.push(currentLine); currentLine = word; }
    else currentLine = test;
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

async function createFakeStory(username, avatarBuffer, imageBuffer, text1, text2) {
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
  const imgH = ch - 160;
  const imgRatio = img.width / img.height;
  let dw, dh, dx, dy;
  if (imgRatio > cw / imgH) { dh = imgH; dw = imgH * imgRatio; dx = m - (dw - cw) / 2; dy = top + 90; }
  else { dw = cw; dh = cw / imgRatio; dx = m; dy = top + 90 - (dh - imgH) / 2; }
  ctx.save(); ctx.beginPath(); ctx.rect(m, top + 90, cw, imgH); ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);

  // النصوص
  if (text1) {
    ctx.font = "bold 24px Arial"; ctx.fillStyle = "white"; ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 8;
    const lines = wrapText(ctx, text1, cw - 60);
    lines.forEach((line, i) => ctx.fillText(line, canvas.width / 2, top + imgH / 2 + i * 30));
    ctx.shadowBlur = 0;
  }
  ctx.restore();
  ctx.restore();

  return await canvas.encode("png");
}

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "ستوري3",
  alias: ["fakestory3"],
  category: "canvas",
  description: "إنشاء ستوري انستغرام مع نص",
  usage: ".ستوري3 <اسم>|<نص1>|<نص2> (رد على صورة)",
  example: ".ستوري3 محمد|ابتسم|الحياة جميلة",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 10, energi: 1, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 📷 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const input = m.args.join(" ");
  if (!input || !input.includes("|")) {
    return m.reply(`📷 *ستوري 3*\n\n📌 مثال: \`${m.prefix}ستوري3 محمد|ابتسم|الحياة جميلة\`\n\n💡 رد على صورة`);
  }

  const parts = input.split("|").map(s => s.trim());
  const username = parts[0] || m.pushName || "مستخدم";
  const text1 = parts[1] || "";
  const text2 = parts[2] || "";

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
    if (m.quoted && m.quoted.isImage) imageBuffer = await m.quoted.download();
    else if (m.isImage) imageBuffer = await m.download();
    else { m.react("❌"); return m.reply(`❌ رد على صورة!`); }

    if (!imageBuffer) { m.react("❌"); return m.reply(`❌ فشل تحميل الصورة`); }

    const resultBuffer = await createFakeStory(username, avatarBuffer, imageBuffer, text1, text2);
    await sock.sendMedia(m.chat, resultBuffer, null, m, { type: "image" });
    m.react("✅");
  } catch (error) {
    m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };