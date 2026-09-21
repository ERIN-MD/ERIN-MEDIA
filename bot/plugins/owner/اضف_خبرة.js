import { getDatabase } from '../../src/lib/maro-database.js'
import * as levelHelper from '../../src/lib/maro-level.js'

const pluginConfig = {
    name: 'اضف_خبرة',
    alias: ['addexp'],
    category: 'owner',
    description: 'إضافة خبرة لمستخدم (الحد الأقصى 9 مليار)',
    usage: '.اضف_خبرة <الكمية> @المستخدم',
    example: '.اضف_خبرة 10000 @المستخدم',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

const MAX_EXP = 9000000000

function formatNumber(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B'
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K'
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function extractTarget(m) {
    if (m.quoted) return m.quoted.sender
    if (m.mentionedJid?.length) return m.mentionedJid[0]
    return null
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args
    
    const numArg = args.find(a => !isNaN(a) && !a.startsWith('@'))
    let amount = parseInt(numArg) || 0
    
    let targetJid = await extractTarget(m)
    
    if (!targetJid && amount > 0) {
        targetJid = m.sender
    }
    
    if (!targetJid || amount <= 0) {
        return m.reply(
            `⭐ *إضافة خبرة*\n\n` +
            `> \`.اضف_خبرة <الكمية>\` - لنفسك\n` +
            `> \`.اضف_خبرة <الكمية> @المستخدم\` - لمستخدم\n` +
            `> الحد الأقصى: 9.000.000.000 (9B)\n\n` +
            `\`مثال: ${m.prefix}اضف_خبرة 10000\``
        )
    }
    
    if (amount <= 0) {
        return m.reply(`❌ *فشل*\n\n> كمية الخبرة يجب أن تكون أكثر من 0`)
    }
    
    if (amount > MAX_EXP) {
        amount = MAX_EXP
    }
    
    const user = db.getUser(targetJid) || db.setUser(targetJid)
 
    await levelHelper.addExpWithLevelCheck(sock, m, db, user, amount)
    
    await m.react('✅')
    
    await m.reply(
        `✅ تمت إضافة *${formatNumber(amount)}* خبرة بنجاح إلى *@${targetJid.split('@')[0]}*`,
        { mentions: [targetJid] }
    )
}

export { pluginConfig as config, handler }