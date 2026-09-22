import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'مسح_الترحيب',
    alias: ['resetwelcome'],
    category: 'group',
    description: 'إعادة رسالة الترحيب إلى الافتراضي',
    usage: '.مسح_الترحيب',
    example: '.مسح_الترحيب',
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
    
    if (!groupData?.welcomeMsg) {
        return m.reply(`❌ *فشل*\n\n> رسالة الترحيب بالفعل افتراضية`)
    }
    
    db.setGroup(m.chat, { welcomeMsg: null })
    
    m.react('✅')
    
    await m.reply(`✅ *تم مسح الترحيب*\n\n> تمت العودة إلى الرسالة الافتراضية`)
}

export { pluginConfig as config, handler }