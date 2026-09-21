// عام - أمر لتفعيل الوضع العام (يمكن للجميع الوصول)

import config from '../../config.js'
import { getDatabase } from '../../src/lib/maro-database.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'عام',
    alias: ['public'],
    category: 'owner',
    description: 'تفعيل الوضع العام (يمكن لجميع المستخدمين الوصول)',
    usage: '.عام',
    example: '.عام',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

/**
 * معالج أمر العام
 */
async function handler(m, { sock }) {
    try {
        const isRealOwner = validateOwner(m);
        if (!isRealOwner) {
            return await m.reply('🚫 *تم رفض الوصول*\n\n> فقط المالك يمكنه تغيير وضع البوت!');
        }
        const currentMode = config.mode;
        if (currentMode === 'public') {
            return await m.reply('ℹ️ البوت بالفعل في وضع *عام*');
        }
        config.mode = 'public';
        const db = getDatabase();
        db.setting('botMode', 'public');
        
        const responseText = `🌐 *تم تفعيل الوضع العام*\n\n` +
            `> البوت الآن يستجيب لجميع المستخدمين!\n\n` +
            `_استخدم .خاص لإغلاق الوصول_`;
        await m.reply(responseText);
        console.log(`[Mode] Changed to PUBLIC by ${m.pushName} (${m.sender})`);
    } catch (error) {
        console.error('[Public Command Error]', error);
        await m.reply(te(m.prefix, m.command, m.pushName));
    }
}

/**
 * التحقق من المالك بفحوصات متعددة
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