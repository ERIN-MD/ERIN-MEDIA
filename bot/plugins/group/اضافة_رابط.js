import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'اضافة_رابط',
    alias: ['addantilink'],
    category: 'group',
    description: 'إضافة رابط إلى قائمة منع الروابط',
    usage: '.اضافة_رابط <نطاق/نمط>',
    example: '.اضافة_رابط tiktok.com',
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
    const link = m.text?.toLowerCase()
    
    if (!link) {
        return m.reply(
            `🔗 *إضافة منع رابط*\n\n` +
            `> أدخل نطاق/نمط الرابط الذي تريد حظره\n\n` +
            `\`مثال:\`\n` +
            `\`${m.prefix}اضافة_رابط tiktok.com\`\n` +
            `\`${m.prefix}اضافة_رابط chat.whatsapp.com\`\n` +
            `\`${m.prefix}اضافة_رابط instagram.com\``
        )
    }
    
    const groupData = db.getGroup(m.chat) || {}
    const antilinkList = groupData.antilinkList || []
    
    if (antilinkList.includes(link)) {
        return m.reply(`⚠️ الرابط \`${link}\` موجود بالفعل في قائمة المنع!`)
    }
    
    antilinkList.push(link)
    db.setGroup(m.chat, { antilinkList })
    
    m.reply(
        `✅ *تمت إضافة الرابط*\n\n` +
        `> الرابط: \`${link}\`\n` +
        `> المجموع: *${antilinkList.length}* رابط\n\n` +
        `> استخدم \`${m.prefix}قائمة_المنع\` للاطلاع على القائمة`
    )
}

export { pluginConfig as config, handler }