import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: "levelup",
    alias: ["lvlup"],
    category: 'user',
    description: 'تفعيل/إلغاء إشعارات رفع المستوى',
    usage: '.levelup <on/off>',
    example: '.levelup on',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    const args = m.args || []
    const sub = args[0]?.toLowerCase()
    
    if (!user.settings) user.settings = {}
    
    if (sub === 'on') {
        user.settings.levelupNotif = true
        db.save()
        return m.reply(
            `✅ *إشعارات رفع المستوى*\n\n` +
            `> الحالة: *ON* ✅\n` +
            `> ستتلقى إشعارات عند رفع مستواك!`
        )
    }
    
    if (sub === 'off') {
        user.settings.levelupNotif = false
        db.save()
        return m.reply(
            `❌ *إشعارات رفع المستوى*\n\n` +
            `> الحالة: *OFF* ❌\n` +
            `> تم إلغاء إشعارات رفع المستوى.`
        )
    }
    
    const status = user.settings.levelupNotif !== false ? 'ON ✅' : 'OFF ❌'
    return m.reply(
        `🔔 *إشعارات رفع المستوى*\n\n` +
        `> الحالة الحالية: *${status}*\n\n` +
        `╭┈┈⬡「 📋 *الاستخدام* 」\n` +
        `┃ > \`.levelup on\` - تفعيل\n` +
        `┃ > \`.levelup off\` - إلغاء\n` +
        `╰┈┈┈┈┈┈┈┈⬡`
    )
}

export { pluginConfig as config, handler }