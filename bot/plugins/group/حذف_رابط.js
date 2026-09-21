import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'حذف_رابط',
    alias: ['delantilink'],
    category: 'group',
    description: 'حذف رابط من قائمة منع الروابط',
    usage: '.حذف_رابط <نطاق/نمط>',
    example: '.حذف_رابط tiktok.com',
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
    const link = m.args.join(' ')?.trim()?.toLowerCase()
    
    if (!link) {
        const groupData = db.getGroup(m.chat) || {}
        const antilinkList = groupData.antilinkList || []
        
        if (antilinkList.length === 0) {
            return m.reply(`📋 قائمة منع الروابط فارغة!`)
        }
        
        let txt = `🔗 *قائمة منع الروابط*\n\n`
        antilinkList.forEach((l, i) => {
            txt += `> ${i + 1}. \`${l}\`\n`
        })
        txt += `\n> المجموع: *${antilinkList.length}* رابط`
        txt += `\n\n\`${m.prefix}حذف_رابط <نطاق>\` للحذف`
        
        return m.reply(txt)
    }
    
    const groupData = db.getGroup(m.chat) || {}
    const antilinkList = groupData.antilinkList || []
    
    const index = antilinkList.findIndex(l => l === link)
    
    if (index === -1) {
        return m.reply(`⚠️ الرابط \`${link}\` غير موجود في قائمة المنع!`)
    }
    
    antilinkList.splice(index, 1)
    db.setGroup(m.chat, { antilinkList })
    
    m.reply(
        `✅ *تم حذف الرابط*\n\n` +
        `> الرابط: \`${link}\`\n` +
        `> المتبقي: *${antilinkList.length}* رابط`
    )
}

export { pluginConfig as config, handler }