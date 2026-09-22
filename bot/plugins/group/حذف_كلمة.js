import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'حذف_كلمة',
    alias: ['deltoxic'],
    category: 'group',
    description: 'حذف كلمة من قائمة الكلمات الممنوعة',
    usage: '.حذف_كلمة <كلمة>',
    example: '.حذف_كلمة كلمة_مسيئة',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const word = m.args.join(' ').trim().toLowerCase()
    
    if (!word) {
        return m.reply(
            `🗑️ *حذف كلمة*\n\n` +
            `> استخدم: \`.حذف_كلمة <كلمة>\`\n\n` +
            `\`مثال: ${m.prefix}حذف_كلمة كلمةمسيئة\``
        )
    }
    
    const groupData = db.getGroup(m.chat) || {}
    const toxicWords = groupData.toxicWords || []
    
    const index = toxicWords.indexOf(word)
    
    if (index === -1) {
        return m.reply(`❌ *فشل*\n\n> الكلمة \`${word}\` غير موجودة في القائمة`)
    }
    
    toxicWords.splice(index, 1)
    db.setGroup(m.chat, { toxicWords })
    
    m.react('✅')
    
    await m.reply(
        `✅ *تم حذف الكلمة*\n\n` +
        `╭┈┈⬡「 📋 *تفاصيل* 」\n` +
        `┃ 📝 الكلمة: \`${word}\`\n` +
        `┃ 📊 المتبقي: \`${toxicWords.length}\` كلمة\n` +
        `╰┈┈⬡`
    )
}

export { pluginConfig as config, handler }