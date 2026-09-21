import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'اضافة_كلمة',
    alias: ['addtoxic'],
    category: 'group',
    description: 'أضف كلمة إلى قائمة الكلمات الممنوعة',
    usage: '.اضافة_كلمة <كلمة>',
    example: '.اضافة_كلمة كلمة_مسيئة',
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
            `📝 *إضافة كلمة*\n\n` +
            `> استخدم: \`.اضافة_كلمة <كلمة>\`\n\n` +
            `\`مثال: ${m.prefix}اضافة_كلمة كلمةمسيئة\``
        )
    }
    
    if (word.length < 2) {
        return m.reply(`❌ *فشل*\n\n> الكلمة قصيرة جداً (حرفين على الأقل)`)
    }
    
    if (word.length > 30) {
        return m.reply(`❌ *فشل*\n\n> الكلمة طويلة جداً (30 حرف كحد أقصى)`)
    }
    
    const groupData = db.getGroup(m.chat) || {}
    const toxicWords = groupData.toxicWords || []
    
    if (toxicWords.includes(word)) {
        return m.reply(`❌ *فشل*\n\n> الكلمة \`${word}\` موجودة بالفعل`)
    }
    
    toxicWords.push(word)
    db.setGroup(m.chat, { toxicWords })
    
    m.react('✅')
    
    await m.reply(
        `✅ *تمت إضافة الكلمة*\n\n` +
        `╭┈┈⬡「 📋 *تفاصيل* 」\n` +
        `┃ 📝 الكلمة: \`${word}\`\n` +
        `┃ 📊 المجموع: \`${toxicWords.length}\` كلمة\n` +
        `╰┈┈⬡`
    )
}

export { pluginConfig as config, handler }