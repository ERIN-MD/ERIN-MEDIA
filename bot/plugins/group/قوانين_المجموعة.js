import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'قوانين_المجموعة',
    alias: ['setrulesgrup'],
    category: 'group',
    description: 'تعيين قوانين مخصصة للمجموعة (للمشرفين فقط)',
    usage: '.ضبط_القوانين <نص>',
    example: '.ضبط_القوانين 1. يمنع السبام\n2. احترم الآخرين',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function handler(m) {
    const db = getDatabase()
    const text = m.text?.trim() || (m.quoted?.body || m.quoted?.text || '')

    if (!text) {
        return m.reply(
            `📝 *ضبط القوانين*\n\n` +
            `> أدخل نص القوانين الجديدة\n\n` +
            `\`مثال:\`\n` +
            `\`${m.prefix}ضبط_القوانين 1. يمنع السبام
2. احترم الآخرين\``
        )
    }

    db.setGroup(m.chat, { groupRules: text })

    m.reply(
        `✅ *تم تحديث القوانين*\n\n` +
        `تم تغيير قوانين المجموعة!\n` +
        `اكتب \`${m.prefix}قوانين\` للاطلاع.`
    )
}

export { pluginConfig as config, handler }