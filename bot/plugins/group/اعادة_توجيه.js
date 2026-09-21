import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'اعادة_توجيه',
    alias: ['autoforward'],
    category: 'group',
    description: 'إعادة توجيه تلقائية للرسائل الواردة إلى هذه المجموعة',
    usage: '.اعادة_توجيه <تشغيل/إيقاف>',
    example: '.اعادة_توجيه تشغيل',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function handler(m, { sock }) {
    const db = getDatabase()
    const option = m.text?.toLowerCase()?.trim()
    const groupId = m.chat
    const group = db.getGroup(groupId) || {}
    
    if (!option) {
        const status = group.autoforward ? '✅ مفعل' : '❌ معطل'
        return m.reply(
            `🔄 *إعادة التوجيه التلقائية*\n\n` +
            `╭┈┈⬡「 📋 *معلومات* 」\n` +
            `┃ ◦ الحالة: *${status}*\n` +
            `╰┈┈⬡\n\n` +
            `> استخدم: \`${m.prefix}اعادة_توجيه تشغيل/إيقاف\`\n\n` +
            `_هذه الميزة تعيد توجيه جميع الرسائل إلى هذه المجموعة_`
        )
    }
    
    if (option === 'تشغيل' || option === 'on') {
        db.setGroup(groupId, { ...group, autoforward: true })
        m.react('✅')
        return m.reply(
            `🔄 *إعادة التوجيه التلقائية*\n\n` +
            `╭┈┈⬡「 ✅ *مفعل* 」\n` +
            `┃ ◦ الحالة: *مفعل*\n` +
            `╰┈┈⬡\n\n` +
            `> _سيتم إعادة توجيه جميع الرسائل_`
        )
    }
    
    if (option === 'ايقاف' || option === 'off') {
        db.setGroup(groupId, { ...group, autoforward: false })
        m.react('❌')
        return m.reply(
            `🔄 *إعادة التوجيه التلقائية*\n\n` +
            `╭┈┈⬡「 ❌ *معطل* 」\n` +
            `┃ ◦ الحالة: *معطل*\n` +
            `╰┈┈⬡`
        )
    }
    
    return m.reply(`❌ استخدم: تشغيل أو إيقاف`)
}

export { pluginConfig as config, handler }