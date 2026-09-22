import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import config from '../../config.js';
import te from '../../src/lib/maro-error.js';

const SCALE_RADIO = "2";
const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function upscaleImage(imagePath) {
  const fileStream = fs.createReadStream(imagePath);
  const formData = new FormData();
  formData.append('file', fileStream, path.basename(imagePath));

  const upload = await axios.post('https://imgupscaler.com/api/legacy/upload', formData, {
    headers: { ...formData.getHeaders(), 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36', 'Referer': 'https://imgupscaler.com/', 'Origin': 'https://imgupscaler.com' },
    timeout: 30000
  });

  const taskId = upload.data?.taskId;
  if (!taskId) throw new Error('فشل رفع الصورة');

  for (let i = 0; i < 30; i++) {
    await delay(5000);
    const res = await axios.post('https://imgupscaler.com/api/legacy/status', {
      tool: "upscaler", taskId, scaleRadio: SCALE_RADIO
    }, {
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://imgupscaler.com/' },
      timeout: 15000
    });
    if (res.data?.status === 'success') {
      return res.data?.downloadUrls || res.data?.raw?.data?.downloadUrls;
    }
  }
  throw new Error('انتهت المهلة');
}

const pluginConfig = {
  name: 'تحسين_جودة',
  alias: ['upscale', 'hd'],
  category: 'tools',
  description: 'تحسين جودة الصورة',
  usage: '.تحسين_جودة (رد على صورة)',
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 60, energi: 5, isEnabled: true
};

async function handler(m, { sock }) {
  if (!m.quoted?.message?.imageMessage) {
    return m.reply(`🖼️ *تحسين_جودة*\n\n📌 رد على صورة لتحسين جودتها`);
  }

  m.react('⏳');
  await m.reply('🔄 *جاري تحسين الجودة...*');

  const tmpDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const imgPath = path.join(tmpDir, `upscale_${Date.now()}.jpg`);
  const buffer = await m.quoted.download();
  fs.writeFileSync(imgPath, buffer);

  try {
    const urls = await upscaleImage(imgPath);
    try { fs.unlinkSync(imgPath); } catch {}

    if (!urls?.length) { m.react('❌'); return m.reply('❌ فشل التحسين'); }

    const url = Array.isArray(urls) ? urls[0] : urls;
    await sock.sendMessage(m.chat, { image: { url }, caption: '✅ *تم تحسين الجودة*' }, { quoted: m });
    m.react('✅');
  } catch (error) {
    try { fs.unlinkSync(imgPath); } catch {}
    console.error('Upscale Error:', error);
    m.react('❌');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };