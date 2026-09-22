import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'خصم_خبرة',
    alias: ['delexp'],
    category: 'owner',
    description: 'خصم خبرة من مستخدم',
    usage: '.خصم_خبرة <الكمية> @المستخدم',
    example: '.خصم_خبرة 5000 @المستخدم',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

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
    const amount = parseInt(numArg) || 0
    
    let targetJid = await extractTarget(m)
    
    if (!targetJid && amount > 0) {
        targetJid = m.sender
    }
    
    if (!targetJid || amount <= 0) {
        return m.reply(
            `⭐ *خصم خبرة*\n\n` +
            `> \`.خصم_خبرة <الكمية>\` - من نفسك\n` +
            `> \`.خصم_خبرة <الكمية> @المستخدم\` - من مستخدم\n\n` +
            `\`مثال: ${m.prefix}خصم_خبرة 5000\``
        )
    }
    
    if (amount <= 0) {
        return m.reply(`❌ *فشل*\n\n> الكمية يجب أن تكون أكثر من 0`)
    }
    
    const user = db.getUser(targetJid)
    
    if (!user) {
        return m.reply(`❌ *فشل*\n\n> المستخدم غير موجود في قاعدة البيانات`)
    }
    
    const newExp = db.updateExp(targetJid, -amount)
    
    await m.react('✅')
    
    await m.reply(
        `✅ *تم خصم الخبرة*\n\n` +
        `╭┈┈⬡「 📋 *التفاصيل* 」\n` +
        `┃ 👤 المستخدم: @${targetJid.split('@')[0]}\n` +
        `┃ ➖ المخصوم: *-${formatNumber(amount)}*\n` +
        `┃ ⭐ المتبقي: *${formatNumber(newExp)}*\n` +
        `╰┈┈⬡`,
        { mentions: [targetJid] }
    )
}

export { pluginConfig as config, handler }