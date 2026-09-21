import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'مسح_الوداع',
    alias: ['resetgoodbye'],
    category: 'group',
    description: 'إعادة رسالة الوداع إلى الافتراضي',
    usage: '.مسح_الوداع',
    example: '.مسح_الوداع',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const groupData = db.getGroup(m.chat)
    
    if (!groupData?.goodbyeMsg) {
        return m.reply(`❌ *فشل*\n\n> رسالة الوداع بالفعل افتراضية`)
    }
    
    db.setGroup(m.chat, { goodbyeMsg: null })
    
    m.react('✅')
    
    await m.reply(`✅ *تم مسح الوداع*\nتمت العودة إلى الرسالة الافتراضية`)
}

export { pluginConfig as config, handler }