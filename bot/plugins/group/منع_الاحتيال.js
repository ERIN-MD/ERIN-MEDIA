import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'منع_الاحتيال',
    alias: ['antiphising'],
    category: 'group',
    description: 'كشف محتوى الاحتيال والتصيد في المجموعة',
    usage: '.منع_الاحتيال <تشغيل/إيقاف/طريقة> [طرد/حذف]',
    example: '.منع_الاحتيال تشغيل',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    isBotAdmin: true,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

function handler(m) {
    const db = getDatabase()
    const groupData = db.getGroup(m.chat) || {}
    const option = m.text?.toLowerCase()?.trim()

    if (!option) {
        const status = groupData.antiphising || 'off'
        const mode = groupData.antiphisingMode || 'remove'
        return m.reply(
            `🎣 *منع الاحتيال*\n\n` +
            `> الحالة: *${status === 'on' ? 'مفعل' : 'معطل'}*\n` +
            `> الوضع: *${mode === 'kick' ? 'طرد' : 'حذف'}*\n\n` +
            `> يكشف رسائل الاحتيال مثل: انقر الرابط، تحقق من حسابك، تسجيل دخول مزيف، روابط قصيرة مشبوهة، روابط IP، بونيكود، وأنماط مشابهة.\n\n` +
            `> \`${m.prefix}منع_الاحتيال تشغيل\`\n` +
            `> \`${m.prefix}منع_الاحتيال إيقاف\`\n` +
            `> \`${m.prefix}منع_الاحتيال طريقة طرد\`\n` +
            `> \`${m.prefix}منع_الاحتيال طريقة حذف\``
        )
    }

    if (option === 'تشغيل' || option === 'on') {
        db.setGroup(m.chat, { antiphising: 'on' })
        return m.reply('✅ *تم تفعيل منع الاحتيال*')
    }

    if (option === 'ايقاف' || option === 'off') {
        db.setGroup(m.chat, { antiphising: 'off' })
        return m.reply('❌ *تم تعطيل منع الاحتيال*')
    }

    if (option === 'طريقة' || option.startsWith('metode')) {
        const method = m.args?.[1]?.toLowerCase()
        if (method === 'طرد' || method === 'kick') {
            db.setGroup(m.chat, { antiphising: 'on', antiphisingMode: 'kick' })
            return m.reply('✅ *تم تفعيل منع الاحتيال مع الطرد*')
        }
        if (method === 'حذف' || method === 'remove' || method === 'delete') {
            db.setGroup(m.chat, { antiphising: 'on', antiphisingMode: 'remove' })
            return m.reply('✅ *تم تفعيل منع الاحتيال مع الحذف*')
        }
        return m.reply('❌ طريقة غير صالحة! استخدم: `طرد` أو `حذف`')
    }

    if (option === 'طرد' || option === 'kick') {
        db.setGroup(m.chat, { antiphising: 'on', antiphisingMode: 'kick' })
        return m.reply('✅ *تم تفعيل منع الاحتيال مع الطرد*')
    }

    if (option === 'حذف' || option === 'remove' || option === 'delete') {
        db.setGroup(m.chat, { antiphising: 'on', antiphisingMode: 'remove' })
        return m.reply('✅ *تم تفعيل منع الاحتيال مع الحذف*')
    }

    return m.reply('❌ خيار غير صالح! استخدم: `تشغيل`, `إيقاف`, `طريقة طرد`, `طريقة حذف`')
}

export { pluginConfig as config, handler }