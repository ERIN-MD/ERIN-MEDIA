import { getDatabase } from '../../src/lib/maro-database.js';

const pluginConfig = {
    name: 'شكل_مسج',
    alias: ['replyform', 'شكل', 'msgform'],
    category: 'owner',
    description: 'تغيير شكل الردود (1-13)',
    usage: '.شكل_مسج <رقم>',
    example: '.شكل_مسج 4',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

async function handler(m, { sock, text }) {
    if (!text) {
        let txt = `🎨 *أشكال الردود المتاحة*\n\n`;
        txt += `1  - نص عادي\n`;
        txt += `2  - مستند وهمي مع صورة\n`;
        txt += `3  - فيديو GIF\n`;
        txt += `4  - معاينة رابط\n`;
        txt += `5  - طلب وهمي (Order)\n`;
        txt += `6  - مستند مع اقتباس\n`;
        txt += `7  - ViewOnce + لوكيشن\n`;
        txt += `8  - رسالة تفاعلية + Order\n`;
        txt += `9  - OrderMessage مباشر\n`;
        txt += `10 - طلب دفع وهمي\n`;
        txt += `11 - رسالة متحركة\n`;
        txt += `12 - أزرار تفاعلية متعددة\n`;
        txt += `13 - ViewOnce + Order (جديد)\n\n`;
        txt += `📌 *الاستخدام:* \`${m.prefix}شكل_مسج <رقم>\`\n`;
        txt += `📌 *مثال:* \`${m.prefix}شكل_مسج 4\``;
        return m.reply(txt);
    }

    const num = parseInt(text.trim());
    if (isNaN(num) || num < 1 || num > 13) {
        return m.reply(`❌ رقم غير صالح. اختر من 1 إلى 13`);
    }

    const db = getDatabase();
    db.setting('replyVariant', num);
    await db.save();

const names = {
        1: 'نص عادي',
        2: 'مستند وهمي مع صورة',
        3: 'فيديو GIF',
        4: 'معاينة رابط',
        5: 'طلب وهمي (Order)',
        6: 'مستند مع اقتباس',
        7: 'ViewOnce + لوكيشن',
        8: 'رسالة تفاعلية + Order',
        9: 'OrderMessage مباشر',
        10: 'طلب دفع وهمي',
        11: 'رسالة متحركة',
        12: 'أزرار تفاعلية متعددة',
        13: 'ViewOnce + Order (جديد)'
    };

    await m.reply(`✅ *تم تغيير شكل الرد إلى:* ${num} - ${names[num]}`);
}

export { pluginConfig as config, handler };