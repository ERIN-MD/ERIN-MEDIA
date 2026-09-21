import { getDatabase } from '../../src/lib/maro-database.js'
import { DEFAULT_INTRO } from './تعارف.js'
const pluginConfig = {
    name: 'مسح_التعارف',
    alias: ['resetintro'],
    category: 'group',
    description: 'إعادة رسالة التعارف إلى الافتراضي (للمشرفين فقط)',
    usage: '.مسح_التعارف',
    example: '.مسح_التعارف',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true,
    isAdmin: true
}

async function handler(m) {
    const db = getDatabase()
    const groupData = db.getGroup(m.chat) || db.setGroup(m.chat)
    
    if (!groupData.intro) {
        return m.reply(`❌ المجموعة بالفعل تستخدم التعارف الافتراضي!`)
    }
    
    delete groupData.intro
    db.setGroup(m.chat, groupData)
    db.save()
    
    await m.reply(
        `✅ *تم مسح التعارف!*\n` +
        `تمت إعادة رسالة التعارف إلى الافتراضي.\n\n` +
        `اكتب *${m.prefix}تعارف* للاطلاع على النتيجة.`
    )
}

export { pluginConfig as config, handler }