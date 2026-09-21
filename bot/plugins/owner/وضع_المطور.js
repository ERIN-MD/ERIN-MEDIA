// وضع المطور - أمر لتفعيل وضع المطور (المطور والبوت فقط)

import config from '../../config.js'
import { getDatabase } from '../../src/lib/maro-database.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'وضع_المطور',
    alias: ['self'],
    category: 'owner',
    description: 'تفعيل وضع المطور (المطور والبوت فقط يمكنهم الوصول)',
    usage: '.وضع_المطور',
    example: '.وضع_المطور',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

/**
 * معالج أمر وضع المطور
 */
async function handler(m, { sock }) {
    try {
        const isRealOwner = validateOwner(m);
        if (!isRealOwner) {
            return await m.reply('🚫 *تم رفض الوصول*\n\n> فقط المطور يمكنه تغيير وضع البوت!');
        }
        const currentMode = config.mode;
        if (currentMode === 'self') {
            return await m.reply('ℹ️ البوت بالفعل في وضع *المطور*');
        }
        config.mode = 'self';
        const db = getDatabase();
        db.setting('botMode', 'self');
        
        const responseText = `🔒 *تم تفعيل وضع المطور*\n\n` +
            `> البوت الآن يستجيب فقط:\n` +
            `> • مطور البوت\n` +
            `> • البوت نفسه (fromMe)\n\n` +
            `_استخدم .عام لفتح الوصول_`;
        await m.reply(responseText);
        console.log(`[Mode] Changed to SELF by ${m.pushName} (${m.sender})`);
    } catch (error) {
        console.error('[Self Command Error]', error);
        await m.reply(te(m.prefix, m.command, m.pushName));
    }
}

/**
 * التحقق من المطور بفحوصات متعددة
 */
function validateOwner(m) {
    if (!m.isOwner) return false;
    if (m.fromMe) return true;
    const senderNumber = m.sender?.replace(/[^0-9]/g, '') || '';
    const ownerNumbers = config.owner?.number || [];
    
    const isInOwnerList = ownerNumbers.some(owner => {
        const cleanOwner = owner.replace(/[^0-9]/g, '');
        return senderNumber.includes(cleanOwner) || cleanOwner.includes(senderNumber);
    });
    if (!isInOwnerList) return false;
    if (!m.sender || !m.sender.includes('@')) return false;
    return true;
}

export { pluginConfig as config, handler }