import { getDatabase } from '../../src/lib/maro-database.js'
import config from '../../config.js'

const pluginConfig = {
    name: 'birthday',
    alias: ['bday'],
    category: 'user',
    description: 'عرض تاريخ ميلاد العضو',
    usage: '.birthday [@user]',
    example: '.birthday @user',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const target = m.mentionedJid?.[0] || m.quoted?.sender || m.sender
    const cleanJid = target.replace(/@.+/g, '')
    const db = getDatabase()
    const user = db.getUser(target)
    
    if (!user?.birthday) {
        if (target === m.sender) {
            return m.reply(
                `❌ لم تقم بتعيين تاريخ ميلادك!\n\n` +
                `> استخدم: ${m.prefix}setbirthday DD-MM\n` +
                `> مثال: ${m.prefix}setbirthday 25-12`
            )
        }
        return m.reply(`❌ هذا المستخدم لم يعين تاريخ ميلاده!`)
    }
    
    const [day, month] = user.birthday.split('-').map(Number)
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    
    const now = new Date()
    const currentYear = now.getFullYear()
    let nextBday = new Date(currentYear, month - 1, day)
    
    if (nextBday < now) {
        nextBday = new Date(currentYear + 1, month - 1, day)
    }
    
    const diffTime = nextBday.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    const isToday = now.getDate() === day && now.getMonth() === month - 1
    
    let text = `🎂 *معلومات تاريخ الميلاد*\n\n`
    text += `╭┈┈⬡「 👤 *المستخدم* 」\n`
    text += `┃ 🏷️ @${cleanJid}\n`
    text += `┃ 📅 ${day} ${months[month - 1]}\n`
    
    if (isToday) {
        text += `┃ 🎉 *اليوم هو عيد ميلاده!*\n`
    } else {
        text += `┃ 🕕 متبقي ${diffDays} يوم\n`
    }
    
    text += `╰┈┈┈┈┈┈┈┈⬡`
    
    if (isToday) {
        text += `\n\n🎊 *عيد ميلاد سعيد!* 🎊\n`
        text += `> كل عام وأنت بخير\n`
        text += `> وعمر مديد! 🎉🎂`
    }
    
    await m.reply(text, { mentions: [target] })
}

export { pluginConfig as config, handler }