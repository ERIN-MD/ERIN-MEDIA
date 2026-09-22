import config from '../../config.js';
import te from '../../src/lib/maro-error.js';
import Tesseract from 'tesseract.js';
import fs from 'fs';
import path from 'path';

const pluginConfig = {
  name: 'قراءة_الصورة',
  alias: ['ocr'],
  category: 'tools',
  description: 'استخراج النص من الصورة (OCR)',
  usage: '.قراءة_الصورة (رد على صورة)',
  example: '.قراءة_الصورة',
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 15, energi: 2, isEnabled: true
};

async function handler(m, { sock }) {
  if (!m.quoted || !m.quoted.message?.imageMessage) {
    return m.reply(`📷 *قراءة_الصورة*\n\n📌 رد على صورة لاستخراج النص منها\n\n💡 مثال: \`${m.prefix}قراءة_الصورة\``);
  }

  m.react('🔍');

  try {
    const buffer = await m.quoted.download();
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    
    const imgPath = path.join(tmpDir, `ocr_${Date.now()}.png`);
    fs.writeFileSync(imgPath, buffer);

    await m.reply('📷 *جاري استخراج النص...*');

    const result = await Tesseract.recognize(imgPath, 'ara+eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          // تقدم العملية
        }
      }
    });

    let text = result.data.text;
    text = text.replace(/\r/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

    // حذف الملف المؤقت
    try { fs.unlinkSync(imgPath); } catch {}

    if (!text) {
      m.react('❌');
      return m.reply('❌ لم يتم التعرف على أي نص في الصورة');
    }

    await m.reply(`📝 *النص المستخرج:*\n\n${text}`);
    m.react('✅');

  } catch (error) {
    console.error('OCR Error:', error);
    m.react('❌');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };