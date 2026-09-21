import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'اشعار_الصلاة',
    alias: ['notifsholat'],
    category: 'group',
    description: 'تفعيل/تعطيل إشعار مواقيت الصلاة للمجموعة',
    usage: '.اشعار_الصلاة تشغيل/إيقاف',
    example: '.اشعار_الصلاة تشغيل',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

function handler(m, { sock, db }) {
    if (!m.isAdmin && !m.isOwner) {
        return m.reply(`❌ فقط مشرفي المجموعة يمكنهم استخدام هذه الميزة`);
    }

    const args = m.args[0]?.toLowerCase();
    const group = db.getGroup(m.chat) || {};
    const globalDb = getDatabase();
    const kotaSetting = globalDb.setting('autoSholatKota') || { nama: 'مدينة جاكرتا' };

    if (!['تشغيل', 'ايقاف', 'on', 'off'].includes(args)) {
        const isGlobalActive = globalDb.setting('autoSholat') || false;
        const statusGlobal = isGlobalActive ? '✅ مفعل' : '❌ معطل';
        const statusGrup = group.notifSholat !== false ? '✅ مفعل' : '❌ معطل';
        
        return m.reply(
            `🕌 *تذكير مواقيت الصلاة*\n\n` +
            `الحالة العامة: *${statusGlobal}* (من المالك)\n` +
            `حالة المجموعة: *${statusGrup}*\n` +
            `الموقع: *${kotaSetting.nama}*\n\n` +
            `*إعدادات المجموعة:*\n` +
            `• *${m.prefix}اشعار_الصلاة تشغيل* — تفعيل الإشعار\n` +
            `• *${m.prefix}اشعار_الصلاة إيقاف* — تعطيل الإشعار\n\n` +
            `*طريقة العمل:*\n` +
            `1. إرسال صوت الأذان وصورة الجدول عند دخول وقت الصلاة\n` +
            `2. يتبع الجدول المباشر من myquran.com\n` +
            `3. إذا كانت الحالة العامة معطلة، لن يرسل الأذان حتى لو كانت حالة المجموعة مفعلة\n` +
            `4. يمكن للمشرف تعطيل الإشعار لهذه المجموعة فقط`
        );
    }

    if (args === 'تشغيل' || args === 'on') {
        group.notifSholat = true;
        db.setGroup(m.chat, group);
        return m.reply(`✅ *تم تفعيل إشعار الصلاة*\n\n> ستتلقى هذه المجموعة تذكير بمواقيت الصلاة\n> الموقع: ${kotaSetting.nama}`);
    }

    if (args === 'ايقاف' || args === 'off') {
        group.notifSholat = false;
        db.setGroup(m.chat, group);
        return m.reply(`❌ *تم تعطيل إشعار الصلاة*`);
    }
}

export { pluginConfig as config, handler }