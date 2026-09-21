import fs from 'fs';
import path from 'path';
import config from '../../config.js';

const TRUSTED_BOTS_PATH = path.join(process.cwd(), 'database', 'trusted-bots.json');

function loadTrustedBots() {
    try {
        if (fs.existsSync(TRUSTED_BOTS_PATH)) {
            return JSON.parse(fs.readFileSync(TRUSTED_BOTS_PATH, 'utf8'));
        }
    } catch {}
    return [];
}

function saveTrustedBots(data) {
    const dir = path.dirname(TRUSTED_BOTS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(TRUSTED_BOTS_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function isTrustedBot(jadibotId) {
    const number = jadibotId?.replace(/@.+/g, '') || '';
    const list = loadTrustedBots();
    return list.includes(number);
}

const pluginConfig = {
    name: 'بوت_رئيسي',
    alias: ['ترقية_بوت', 'توثيق_بوت', 'trustbot'],
    category: 'owner',
    description: 'منح البوت الفرعي صلاحيات كاملة (بدون صلاحيات المالك)',
    usage: '.بوت_رئيسي (رد على رسالة البوت الفرعي)',
    example: '.بوت_رئيسي',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

async function handler(m, { sock }) {
    // لازم يكون رد على رسالة
    if (!m.quoted) {
        return m.reply(`❌ *استخدم الأمر بالرد على رسالة البوت الفرعي*\n\nمثال: رد على رسالة من البوت الفرعي واكتب \`.بوت_رئيسي\``);
    }

    // جيب رقم البوت الفرعي من الرسالة المقتبسة
    const quotedSender = m.quoted.sender || '';
    const quotedNumber = quotedSender.replace(/@.+/g, '');

    if (!quotedNumber || quotedNumber.length < 8) {
        return m.reply('❌ لم يتم التعرف على رقم البوت من الرسالة المقتبسة');
    }

    // تأكد إنه مش بوت رئيسي
    const mainBotNumber = sock.user?.id?.split(':')[0]?.replace(/@.+/g, '') || '';
    if (quotedNumber === mainBotNumber) {
        return m.reply('❌ هذا هو البوت الرئيسي بالفعل!');
    }

    // تأكد إن الرقم عنده بوت فرعي شغال
    const { isJadibotActive } = await import('../../src/lib/maro-jadibot-manager.js');
    if (!isJadibotActive(quotedNumber)) {
        return m.reply('❌ هذا الرقم لا يملك بوتاً فرعياً نشطاً حالياً');
    }

    const list = loadTrustedBots();

    if (list.includes(quotedNumber)) {
        // إزالة من القائمة
        const updated = list.filter(b => b !== quotedNumber);
        saveTrustedBots(updated);
        return m.reply(`🔽 *تم إلغاء ترقية البوت*\n\n> 📱 الرقم: *${quotedNumber}*\n> ⚠️ عاد للوصول المقيد`);
    }

    // إضافة للقائمة
    list.push(quotedNumber);
    saveTrustedBots(list);

    m.reply(
        `✅ *تمت ترقية البوت الفرعي*\n\n` +
        `> 📱 الرقم: *${quotedNumber}*\n` +
        `> 🔓 الصلاحيات: *كل الأوامر*\n` +
        `> ⚠️ الملاحظة: *صاحب الرقم لا يملك صلاحيات المطور*\n\n` +
        `_البوت الفرعي يمكنه الآن استخدام جميع الأوامر_\n` +
        `_لكن صاحب الرقم لا يعتبر مالكاً للبوت_`
    );
}

export { pluginConfig as config, handler, loadTrustedBots, saveTrustedBots, isTrustedBot };