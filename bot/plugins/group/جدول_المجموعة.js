import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'جدول_المجموعة',
    alias: ['jadwalgroup'],
    category: 'group',
    description: 'جدولة فتح/إغلاق المجموعة تلقائياً',
    usage: '.جدول_المجموعة <فتح/اغلاق> <HH:MM>',
    example: '.جدول_المجموعة فتح 06:00',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
};

function parseTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const cleaned = timeStr.trim().replace(/\s+/g, '');
    const match = cleaned.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return { hours, minutes };
}

function formatTime(hours, minutes) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

async function handler(m, { sock, db }) {
    const args = m.args || []
    const action = args[0]?.toLowerCase();
    
    let time = args[1];
    if (args.length >= 4 && args[2] === ':') { time = `${args[1]}:${args[3]}`; }
    else if (args.length >= 2) { time = args.slice(1).join('').replace(/\s+/g, ''); }
    
    if (!action) {
        const group = db.getGroup(m.chat) || {};
        const openTime = group.scheduleOpen || null;
        const closeTime = group.scheduleClose || null;
        
        let scheduleInfo = `⏰ *جدول المجموعة*\n\n` +
            `「 📋 *الحالة* 」\n` +
            `🔓 فتح: *${openTime || 'غير مفعل'}*\n` +
            `🔒 إغلاق: *${closeTime || 'غير مفعل'}*\n\n` +
            `*طريقة الاستخدام:*\n` +
            `\`.جدول_المجموعة فتح 06:00\`\n` +
            `\`.جدول_المجموعة اغلاق 22:00\`\n` +
            `\`.جدول_المجموعة حذف فتح\`\n` +
            `\`.جدول_المجموعة حذف اغلاق\``;
        
        await m.reply(scheduleInfo);
        return;
    }
    
    if (action === 'حذف' || action === 'مسح') {
        const type = args[1]?.toLowerCase();
        
        if (type !== 'فتح' && type !== 'اغلاق') {
            await m.reply(`⚠️ *خطأ*\n\n> استخدم: \`.جدول_المجموعة حذف فتح\`\n> أو: \`.جدول_المجموعة حذف اغلاق\``);
            return;
        }
        
        const group = db.getGroup(m.chat) || {};
        
        if (type === 'فتح') {
            delete group.scheduleOpen; db.setGroup(m.chat, group);
            await m.reply(`✅ *تم*\n\n> تم حذف جدول *فتح* المجموعة التلقائي.`);
        } else {
            delete group.scheduleClose; db.setGroup(m.chat, group);
            await m.reply(`✅ *تم*\n\n> تم حذف جدول *إغلاق* المجموعة التلقائي.`);
        }
        return;
    }
    
    if (action !== 'فتح' && action !== 'اغلاق') {
        await m.reply(`⚠️ *خطأ*\n\n> يجب أن يكون الإجراء \`فتح\` أو \`اغلاق\`!\n\n> *مثال:*\n> \`.جدول_المجموعة فتح 06:00\`\n> \`.جدول_المجموعة اغلاق 22:00\``);
        return;
    }
    
    if (!time) {
        await m.reply(`⚠️ *خطأ*\n\n> يجب إدخال الوقت!\n\n> *صيغة:* \`HH:MM\` (24 ساعة)\n> *مثال:* \`.جدول_المجموعة ${action} 08:00\``);
        return;
    }
    
    const parsed = parseTime(time);
    if (!parsed) {
        await m.reply(`⚠️ *خطأ*\n\n> صيغة الوقت غير صالحة!\n\n> *صيغة:* \`HH:MM\` (24 ساعة)\n> *مثال:* \`06:00\`, \`22:30\``);
        return;
    }
    
    const group = db.getGroup(m.chat) || {};
    const formattedTime = formatTime(parsed.hours, parsed.minutes);
    
    if (action === 'فتح') { group.scheduleOpen = formattedTime; }
    else { group.scheduleClose = formattedTime; }
    
    db.setGroup(m.chat, group);
    
    const actionText = action === 'فتح' ? 'فتح' : 'إغلاق';
    const emoji = action === 'فتح' ? '🔓' : '🔒';
    
    await m.reply(
        `✅ *تم حفظ الجدول*\n\n` +
        `╭┈┈⬡「 ⏰ *الإعداد* 」\n` +
        `┃ ${emoji} الإجراء: *${actionText}*\n` +
        `┃ ⏱️ الوقت: *${formattedTime}*\n` +
        `┃ 📡 الحالة: *🟢 مفعل*\n` +
        `╰┈┈⬡\n\n` +
        `> _سيتم ${action === 'فتح' ? 'فتح' : 'إغلاق'} المجموعة تلقائياً_\n` +
        `> _كل يوم الساعة *${formattedTime}*._`
    );
}

export { pluginConfig as config, handler }