import { pixa } from '../../src/scraper/removebackground.js'
import fs from 'fs'
import path from 'path'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'إزالة_الخلفية',
    alias: ['rmbg'],
    category: 'tools',
    description: 'إزالة خلفية الصورة',
    usage: '.إزالة_الخلفية (رد على صورة)',
    example: '.إزالة_الخلفية',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
};

async function handler(m, { sock }) {
    try {
        const isImage = m.isImage || (m.quoted && m.quoted.isImage);
        if (!isImage) {
            return await m.reply('❌ *الصورة مطلوبة*\n\n> أرسل أو رد على صورة مع الأمر .إزالة_الخلفية');
        }
        
        await m.react('🕕')
        
        let mediaBuffer;
        if (m.isImage && m.download) {
            mediaBuffer = await m.download();
        } else if (m.quoted && m.quoted.isImage && m.quoted.download) {
            mediaBuffer = await m.quoted.download();
        } else {
            return await m.reply('❌ فشل تحميل الصورة');
        }
        
        if (!mediaBuffer || !Buffer.isBuffer(mediaBuffer)) {
            return await m.reply('❌ ملف الصورة غير صالح');
        }
        const pathnya = path.join(process.cwd(), 'temp', `rmbg_${Date.now()}.jpg`);
        fs.writeFileSync(pathnya, mediaBuffer);
        const result = await pixa(pathnya);
        
        await sock.sendMessage(m.chat, {
            image: result,
            caption: `✅ *تم إزالة الخلفية*\n\n> تم إزالة خلفية الصورة بنجاح`
        }, { quoted: m });
        try {
            fs.unlinkSync(pathnya);
        } catch (e) {}
    } catch (error) {
        console.error('[خطأ إزالة الخلفية]', error);
        m.reply(te(m.prefix, m.command, m.pushName));
    }
}

export { pluginConfig as config, handler }