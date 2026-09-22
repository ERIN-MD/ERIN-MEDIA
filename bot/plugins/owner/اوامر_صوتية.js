import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'اوامر_صوتية',
    alias: ['cmdvn'],
    category: 'owner',
    description: 'تفعيل الأوامر عبر الرسائل الصوتية',
    usage: '.اوامر_صوتية <on/off>',
    example: '.اوامر_صوتية on',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

function handler(m) {
    const db = getDatabase()
    const args = m.args || []
    const subCmd = args[0]?.toLowerCase()

    const current = db.setting('cmdVn') || false

    if (!subCmd || subCmd === 'status') {
        const status = current ? '✅ مفعل' : '❌ معطل'
        return m.reply(
            `🎤 *الأوامر الصوتية*\n\n` +
            `> الحالة: *${status}*\n\n` +
            `> \`${m.prefix}اوامر_صوتية on\` — تفعيل الأوامر الصوتية\n` +
            `> \`${m.prefix}اوامر_صوتية off\` — تعطيل (افتراضي)\n\n` +
            `> عند التفعيل، أرسل رسالة صوتية باسم الأمر\n` +
            `> مثال: رسالة صوتية "menu" → تشغيل .menu`
        )
    }

    if (subCmd === 'on') {
        db.setting('cmdVn', true)
        return m.reply(
            `✅ *تم تفعيل الأوامر الصوتية*\n\n` +
            `> أرسل رسالة صوتية تحتوي على اسم الأمر\n` +
            `> البوت سيحول الصوت إلى نص وينفذ الأمر تلقائياً\n` +
            `> مثال: رسالة صوتية "menu" → تشغيل .menu`
        )
    }

    if (subCmd === 'off') {
        db.setting('cmdVn', false)
        return m.reply(`❌ تم *تعطيل* الأوامر الصوتية. الأوامر النصية طبيعية.`)
    }

    return m.reply(`❌ استخدم \`${m.prefix}اوامر_صوتية on\` أو \`${m.prefix}اوامر_صوتية off\``)
}

export { pluginConfig as config, handler }