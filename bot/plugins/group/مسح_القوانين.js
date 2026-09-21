import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'مسح_القوانين',
    alias: ['resetrulesgrup'],
    category: 'group',
    description: 'إعادة قوانين المجموعة إلى الافتراضي (للمشرفين فقط)',
    usage: '.مسح_القوانين',
    example: '.مسح_القوانين',
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
    
    db.setGroup(m.chat, { groupRules: null })
    
    m.reply(
        `✅ *تم مسح القوانين*\n` +
        `تمت إعادة قوانين المجموعة إلى الافتراضي!\n` +
        `اكتب \`${m.prefix}قوانين\` للاطلاع.`
    )
}

export { pluginConfig as config, handler }