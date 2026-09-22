import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'منع_الحالة',
    alias: ['antiswgc'],
    category: 'group',
    description: 'كشف رسائل منشن الحالة الجماعية الواردة للمجموعة',
    usage: '.منع_الحالة <تشغيل/إيقاف>',
    example: '.منع_الحالة تشغيل',
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

async function handler(m, { db }) {
    const action = (m.args || [])[0]?.toLowerCase()
    const group = db.getGroup(m.chat) || {}

    if (!action) {
        const status = group.antiswgc || 'off'
        await m.reply(
            `📡 *منع الحالة*\n\n` +
            `> الحالة: *${status === 'on' ? '✅ مفعل' : '❌ معطل'}*\n\n` +
            `> هذه الميزة تكشف أنواع منشن الحالة الجماعية مثل:\n` +
            `> • groupStatusMentionMessage\n` +
            `> • groupMentionedMessage\n` +
            `> • statusMentionMessage\n` +
            `> • contextInfo.groupMentions\n\n` +
            `> \`${m.prefix}منع_الحالة تشغيل\`\n` +
            `> \`${m.prefix}منع_الحالة إيقاف\``
        )
        return
    }

    if (action === 'تشغيل' || action === 'on') {
        db.setGroup(m.chat, { ...group, antiswgc: 'on' })
        await m.reply('✅ *تم تفعيل منع الحالة*\n\n> سيتم حذف رسائل منشن الحالة الجماعية تلقائياً.')
        return
    }

    if (action === 'ايقاف' || action === 'off') {
        db.setGroup(m.chat, { ...group, antiswgc: 'off' })
        await m.reply('❌ *تم تعطيل منع الحالة*')
        return
    }

    await m.reply('❌ استخدم: تشغيل أو إيقاف')
}

export { pluginConfig as config, handler }