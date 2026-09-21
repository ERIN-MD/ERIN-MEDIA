import config from '../../config.js'
import { getDatabase } from '../../src/lib/maro-database.js'
import { isLid, lidToJid, resolveAnyLidToJid } from '../../src/lib/maro-lid.js'

const pluginConfig = {
    name: 'حظر',
    alias: ['ban'],
    category: 'owner',
    description: 'حظر مستخدم من استخدام البوت',
    usage: '.حظر <رقم/@منشن>',
    example: '.حظر 6281234567890',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

function resolveTarget(m) {
    let raw = ''

    if (m.quoted) {
        raw = m.quoted.sender || ''
    } else if (m.mentionedJid?.length) {
        raw = m.mentionedJid[0] || ''
    } else if (m.args[0]) {
        raw = m.args[0]
    }

    if (!raw) return ''

    if (isLid(raw)) raw = lidToJid(raw)
    let num = raw.replace(/[^0-9]/g, '')
    if (num.startsWith('08')) num = '62' + num.slice(1)
    if (num.startsWith('0')) num = '62' + num.slice(1)

    return num
}

async function handler(m, { sock }) {
    const targetNumber = resolveTarget(m)

    if (!targetNumber || targetNumber.length < 10 || targetNumber.length > 15) {
        return m.reply(
            `🚫 *حظر مستخدم*\n\n` +
            `> أدخل رقم أو منشن المستخدم\n\n` +
            `\`مثال: ${m.prefix}حظر 6281234567890\``
        )
    }

    if (config.isOwner(targetNumber)) {
        return m.reply(`❌ *فشل*\n\n> لا يمكن حظر المالك`)
    }

    const db = getDatabase()
    const bannedList = db.setting('bannedUsers') || []

    const alreadyBanned = bannedList.some(b => {
        const c = String(b).replace(/[^0-9]/g, '')
        return c === targetNumber || c.endsWith(targetNumber) || targetNumber.endsWith(c)
    })

    if (alreadyBanned) {
        return m.reply(`❌ *فشل*\n\n> الرقم \`${targetNumber}\` محظور بالفعل`)
    }

    bannedList.push(targetNumber)
    db.setting('bannedUsers', bannedList)
    config.bannedUsers = bannedList

    await m.react('🚫')

    await m.reply(
        `🚫 *تم حظر المستخدم*\n\n` +
        `╭┈┈⬡「 📋 *التفاصيل* 」\n` +
        `┃ 📱 الرقم: \`${targetNumber}\`\n` +
        `┃ 🚫 الحالة: \`محظور\`\n` +
        `┃ 📊 المجموع: \`${bannedList.length}\` مستخدم\n` +
        `╰┈┈⬡`
    )
}

export { pluginConfig as config, handler }