import { getDatabase } from '../../src/lib/maro-database.js'
import config from '../../config.js'

const pluginConfig = {
    name: "setbirthday",
    alias: ["setbday"],
    category: 'user',
    description: 'تعيين تاريخ الميلاد',
    usage: '.setbirthday <DD-MM>',
    example: '.setbirthday 25-12',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
    const db = getDatabase()
    const input = m.args?.[0]?.trim()
    const userJid = m.sender
    const cleanJid = userJid.replace(/@.+/g, '')
    
    if (!input) {
        const user = db.getUser(userJid)
        const currentBday = user?.birthday
        
        let text = `🎂 *تعيين تاريخ الميلاد*\n\n`
        
        if (currentBday) {
            text += `> تاريخ ميلادك: *${currentBday}*\n\n`
        }
        
        text += `╭┈┈⬡「 📋 *الصيغة* 」\n`
        text += `┃ ${m.prefix}setbirthday DD-MM\n`
        text += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        text += `*مثال:*\n`
        text += `> ${m.prefix}setbirthday 25-12\n`
        text += `> ${m.prefix}setbirthday 01-01`
        
        return m.reply(text)
    }
    
    const dateRegex = /^(\d{1,2})[-\/](\d{1,2})$/
    const match = input.match(dateRegex)
    
    if (!match) {
        return m.reply(`❌ صيغة خاطئة! استخدم: DD-MM\n\n> مثال: ${m.prefix}setbirthday 25-12`)
    }
    
    const day = parseInt(match[1])
    const month = parseInt(match[2])
    
    if (month < 1 || month > 12) {
        return m.reply(`❌ شهر غير صالح! (1-12)`)
    }
    
    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    if (day < 1 || day > daysInMonth[month - 1]) {
        return m.reply(`❌ يوم غير صالح للشهر ${month}!`)
    }
    
    const formattedDate = `${day.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}`
    
    db.setUser(m.sender, { 
        birthday: formattedDate 
    })
    
    await db.save()
    
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    
    await m.reply(
        `✅ *تم حفظ تاريخ الميلاد!*\n\n` +
        `╭┈┈⬡「 🎂 *التفاصيل* 」\n` +
        `┃ 📅 التاريخ: *${day} ${months[month - 1]}*\n` +
        `┃ 👤 المستخدم: @${cleanJid}\n` +
        `╰┈┈┈┈┈┈┈┈⬡\n\n` +
        `> سيهنئك البوت في عيد ميلادك! 🎉`,
        { mentions: [userJid] }
    )
}

export { pluginConfig as config, handler }