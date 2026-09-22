// إلغاء الحظر - أمر لإزالة مستخدم من قائمة المحظورين

import config from '../../config.js'
import { getDatabase } from '../../src/lib/maro-database.js'
import { isLid, lidToJid } from '../../src/lib/maro-lid.js'

const pluginConfig = {
    name: 'إلغاء_الحظر',
    alias: ['unban'],
    category: 'owner',
    description: 'إزالة مستخدم من قائمة المحظورين',
    usage: '.إلغاء_الحظر <الرقم/@مستخدم>',
    example: '.إلغاء_الحظر 6281234567890',
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
            `✅ *إلغاء حظر المستخدم*\n\n` +
            `> أدخل الرقم أو أشر إلى المستخدم\n\n` +
            `\`مثال: ${m.prefix}إلغاء_الحظر 6281234567890\``
        )
    }

    const db = getDatabase()
    const bannedList = db.setting('bannedUsers') || []

    const index = bannedList.findIndex(b => {
        const c = String(b).replace(/[^0-9]/g, '')
        return c === targetNumber || c.endsWith(targetNumber) || targetNumber.endsWith(c)
    })

    if (index === -1) {
        return m.reply(`❌ *فشل*\n\n> الرقم \`${targetNumber}\` ليس في قائمة المحظورين`)
    }

    bannedList.splice(index, 1)
    db.setting('bannedUsers', bannedList)
    config.bannedUsers = bannedList

    await m.react('✅')

    await m.reply(
        `✅ *تم إلغاء حظر المستخدم*\n\n` +
        `╭┈┈⬡「 📋 *التفاصيل* 」\n` +
        `┃ 📱 الرقم: \`${targetNumber}\`\n` +
        `┃ ✅ الحالة: \`تم إلغاء الحظر\`\n` +
        `┃ 📊 الإجمالي: \`${bannedList.length}\` مستخدم\n` +
        `╰┈┈⬡`
    )
}

export { pluginConfig as config, handler }