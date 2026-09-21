import axios from 'axios';
import FormData from 'form-data';
import { randomUUID } from 'crypto';
import config from '../../config.js';

const uploadUrl = 'https://files.use.ai/upload';
const baseUrl = 'https://use.ai';

const MIME_MAP = {
  imageMessage: 'image/jpeg',
  videoMessage: 'video/mp4',
  audioMessage: 'audio/mpeg',
  stickerMessage: 'image/webp',
  documentMessage: 'application/octet-stream',
  ptvMessage: 'video/mp4',
};

const pluginConfig = {
  name: 'ارفع',
  alias: ['upload'],
  category: 'tools',
  description: 'رفع الملفات إلى السحابة',
  usage: '.ارفع (رد على ملف)',
  example: '.ارفع',
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 10, energi: 1, isEnabled: true
};

async function handler(m, { sock }) {
  if (!m.quoted) return m.reply('📤 *ارفع*\n\n📌 رد على صورة/فيديو/ملف لرفعه');

  const type = m.quoted.type;
  const mime = m.quoted.mimetype || MIME_MAP[type] || 'application/octet-stream';

  if (type === 'conversation' || type === 'extendedTextMessage') {
    return m.reply('❌ لا يمكن رفع النصوص. ارفع صورة أو فيديو أو ملف.');
  }

  m.react('⏳');

  try {
    const buffer = await m.quoted.download();
    const extMap = { imageMessage: 'jpg', videoMessage: 'mp4', audioMessage: 'mp3', stickerMessage: 'webp', ptvMessage: 'mp4' };
    const ext = extMap[type] || 'bin';
    const filename = `${randomUUID()}-${Date.now()}.${ext}`;

    const form = new FormData();
    form.append('name', filename);
    form.append('type', mime);
    form.append('file', buffer, { filename, contentType: mime });

    const { data } = await axios.post(uploadUrl, form, {
      headers: {
        ...form.getHeaders(),
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
        Origin: `${baseUrl}/`,
        Referer: `${baseUrl}/`,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 60000
    });

    if (!data?.success || !data?.url) throw new Error(`فشل: ${JSON.stringify(data)}`);

    const fileUrl = data.url.startsWith('http') ? data.url : `${baseUrl}${data.url}`;
    await m.reply(`✅ *تم الرفع*\n🔗 ${fileUrl}`);
    m.react('✅');
  } catch (err) {
    console.error('Upload Error:', err);
    m.react('❌');
    await m.reply(`❌ ${err.message}`);
  }
}

export { pluginConfig as config, handler };