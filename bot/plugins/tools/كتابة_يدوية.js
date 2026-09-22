// كتابة_يدوية - أمر لإنشاء كتابة يدوية على ورق

import * as _canvas from "@napi-rs/canvas";
import path from "path";
import fs from "fs";
import * as timeHelper from "../../src/lib/maro-time.js";
import te from "../../src/lib/maro-error.js";
import { saluranCtx } from "../../src/lib/maro-context.js";
import axios from "axios";
import config from "../../config.js";
import { getAssetBuffer } from "../../src/lib/maro-asset-manager.js";

const pluginConfig = {
  name: "كتابة_يدوية",
  alias: ["nulis"],
  category: "tools",
  description: "إنشاء كتابة يدوية على ورق",
  usage: ".كتابة_يدوية <النص>",
  example: ".كتابة_يدوية أحبك إلى الأبد",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

const fontUrl = getAssetBuffer("maro-font");
let _fontRegistered = false;

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";
  for (const word of words) {
    const testLine = currentLine + (currentLine ? " " : "") + word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

async function handler(m, { sock }) {
  const text = m.args?.join(" ");
  if (!text) {
    return m.reply(
      `⚠️ *طريقة الاستخدام*\n\n` +
        `> \`${m.prefix}كتابة_يدوية <النص>\`\n\n` +
        `> مثال:\n` +
        `> \`${m.prefix}كتابة_يدوية أحبك إلى الأبد\``,
    );
  }
  if (text.length > 500) {
    return m.reply(`❌ *النص طويل جداً*\n\n> الحد الأقصى 500 حرف`);
  }

  const inputUrl = getAssetBuffer("maro-kertas");
  if (!inputUrl) {
    return m.reply(
      `❌ *القالب غير موجود*\n\n> ملف قالب الورق غير موجود في config.assets`,
    );
  }

  await m.react("🕕");
  await m.reply(`🕕 *جاري المعالجة...*\n\n> إنشاء كتابة يدوية...`);

  try {
    const { createCanvas, loadImage, GlobalFonts } = _canvas;

    if (!_fontRegistered) {
      try {
        const fontBuf = getAssetBuffer("maro-font");
        if (fontBuf) {
          GlobalFonts.register(fontBuf, "Zahraaa");
        }
      } catch (err) {
        console.error("فشل تحميل الخط:", err);
      }
      _fontRegistered = true;
    }

    const bgBuf = getAssetBuffer("maro-kertas");
    const bgImage = await loadImage(bgBuf);

    const canvas = createCanvas(bgImage.width, bgImage.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(bgImage, 0, 0);

    // ترجمة أيام الأسبوع والأشهر
    const tgl = timeHelper.formatDate("DD/MM/YYYY");
    const hari = timeHelper.formatFull("dddd");

    // ترجمة اليوم إلى العربية
    const dayMap = {
      'Monday': 'الاثنين',
      'Tuesday': 'الثلاثاء',
      'Wednesday': 'الأربعاء',
      'Thursday': 'الخميس',
      'Friday': 'الجمعة',
      'Saturday': 'السبت',
      'Sunday': 'الأحد'
    };

    let hariAr = hari;
    for (const [en, ar] of Object.entries(dayMap)) {
      hariAr = hariAr.replace(en, ar);
    }

    ctx.font = "20px Zahraaa, Arial";
    ctx.fillStyle = "#1a1a2e";
    ctx.fillText(hariAr, 806, 78);

    ctx.font = "18px Zahraaa, Arial";
    ctx.fillText(tgl, 806, 102);

    ctx.font = "20px Zahraaa, Arial";
    const maxWidth = 600;
    const lineHeight = 28;
    const startX = 344;
    const startY = 142;

    const lines = wrapText(ctx, text, maxWidth);

    lines.forEach((line, i) => {
      ctx.fillText(line, startX, startY + i * lineHeight);
    });

    const buffer = canvas.toBuffer("image/jpeg");

    await m.react("✅");
    await sock.sendMedia(
      m.chat,
      buffer,
      `✅ *كتابة يدوية*\n\n> احترس من أن يراك أحد! 📖`,
      m,
      { type: "image", contextInfo: saluranCtx() },
    );
  } catch (error) {
    await m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };