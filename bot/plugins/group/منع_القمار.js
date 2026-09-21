import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'منع_القمار',
    alias: ['antijudol'],
    category: 'group',
    description: 'كشف محتوى القمار في المجموعة',
    usage: '.منع_القمار <تشغيل/إيقاف/طريقة> [طرد/حذف]',
    example: '.منع_القمار تشغيل',
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
        const status = groupData.antijudol || 'off'
        const mode = groupData.antijudolMode || 'remove'
        return m.reply(
            `🎰 *منع القمار*\n\n` +
            `> الحالة: *${status === 'on' ? 'مفعل' : 'معطل'}*\n` +
            `> الوضع: *${mode === 'kick' ? 'طرد' : 'حذف'}*\n\n` +
            `> يكشف محتوى القمار مثل: جودي، سلوت، غاكور، ماكسوين، توغل، بونص ممبر، روابط بديلة، وأنماط مشابهة.\n\n` +
            `> \`${m.prefix}منع_القمار تشغيل\`\n` +
            `> \`${m.prefix}منع_القمار إيقاف\`\n` +
            `> \`${m.prefix}منع_القمار طريقة طرد\`\n` +
            `> \`${m.prefix}منع_القمار طريقة حذف\``
        )
    }

    if (option === 'تشغيل' || option === 'on') {
        db.setGroup(m.chat, { antijudol: 'on' })
        return m.reply('✅ *تم تفعيل منع القمار*')
    }

    if (option === 'ايقاف' || option === 'off') {
        db.setGroup(m.chat, { antijudol: 'off' })
        return m.reply('❌ *تم تعطيل منع القمار*')
    }

    if (option === 'طريقة' || option.startsWith('metode')) {
        const method = m.args?.[1]?.toLowerCase()
        if (method === 'طرد' || method === 'kick') {
            db.setGroup(m.chat, { antijudol: 'on', antijudolMode: 'kick' })
            return m.reply('✅ *تم تفعيل منع القمار مع الطرد*')
        }
        if (method === 'حذف' || method === 'remove' || method === 'delete') {
            db.setGroup(m.chat, { antijudol: 'on', antijudolMode: 'remove' })
            return m.reply('✅ *تم تفعيل منع القمار مع الحذف*')
        }
        return m.reply(`❌ طريقة غير صالحة! استخدم: \`طرد\` أو \`حذف\``)
    }

    if (option === 'طرد' || option === 'kick') {
        db.setGroup(m.chat, { antijudol: 'on', antijudolMode: 'kick' })
        return m.reply('✅ *تم تفعيل منع القمار مع الطرد*')
    }

    if (option === 'حذف' || option === 'remove' || option === 'delete') {
        db.setGroup(m.chat, { antijudol: 'on', antijudolMode: 'remove' })
        return m.reply('✅ *تم تفعيل منع القمار مع الحذف*')
    }

    return m.reply('❌ خيار غير صالح! استخدم: `تشغيل`, `إيقاف`, `طريقة طرد`, `طريقة حذف`')
}

export { pluginConfig as config, handler }