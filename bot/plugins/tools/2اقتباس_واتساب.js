import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import axios from 'axios';
import config from '../../config.js';
import te from '../../src/lib/maro-error.js';
import fs from 'fs';
import path from 'path';

// تسجيل الخطوط
const fontDir = path.join(process.cwd(), 'assets');
try {
  if (fs.existsSync(path.join(fontDir, 'Poppins-Regular.ttf'))) {
    GlobalFonts.registerFromPath(path.join(fontDir, 'Poppins-Regular.ttf'), "Poppins");
  }
  if (fs.existsSync(path.join(fontDir, 'Poppins-SemiBold.ttf'))) {
    GlobalFonts.registerFromPath(path.join(fontDir, 'Poppins-SemiBold.ttf'), "Poppins SemiBold");
  }
} catch (e) {}

async function fakeNotifWA({ name = "User", message = "Hello", nameX = 35, nameY = 190, messageX = 35, messageY = 220, nameSize = 20, messageSize = 20 } = {}) {
  const template = "https://d.tmpfile.link/public/2026-06-08/e92ce22a-404f-4a06-9c73-470743475f1f/IMG-20260608-WA0253(4).jpg";
  const bg = await loadImage(template);
  const canvas = createCanvas(bg.width, bg.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(bg, 0, 0, bg.width, bg.height);
  ctx.fillStyle = "#000000";
  ctx.font = `${nameSize}px "Poppins SemiBold"`;
  ctx.textBaseline = "top";
  ctx.fillText(name, nameX, nameY);
  ctx.fillStyle = "#000000";
  ctx.font = `${messageSize}px "Poppins"`;
  ctx.textBaseline = "top";
  ctx.fillText(message, messageX, messageY);
  
  return await canvas.encode("png");
}

const pluginConfig = {
  name: '2اقتباس_واتساب',
  alias: [],
  category: 'tools',
  description: 'إنشاء إشعار واتساب مزيف',
  usage: '.اقتباس_واتساب <اسم>|<رسالة>',
  example: '.اقتباس_واتساب احمد|تعالى بسرعة',
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 10, energi: 1, isEnabled: true
};

async function handler(m, { sock }) {
  const input = m.args.join(' ')?.trim();

  if (!input) {
    return m.reply(`📱 *2اقتباس_واتساب*\n\n📌 مثال: \`${m.prefix}اقتباس_واتساب احمد|تعالى بسرعة\``);
  }

  const parts = input.split('|');
  const name = parts[0]?.trim() || 'User';
  const message = parts[1]?.trim() || 'Hello';

  m.react('🎨');

  try {
    const buffer = await fakeNotifWA({ name, message });

    await sock.sendMessage(m.chat, {
      image: buffer,
      caption: `📱 *${name}*\n💬 ${message}`
    }, { quoted: m });

    m.react('✅');
  } catch (error) {
    console.error('FakeNotif Error:', error);
    m.react('❌');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };