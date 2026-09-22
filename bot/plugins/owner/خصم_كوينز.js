import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'خصم_كوينز',
    alias: ['delkoin'],
    category: 'owner',
    description: 'خصم كوينز من مستخدم',
    usage: '.خصم_كوينز <الكمية> @المستخدم',
    example: '.خصم_كوينز 50000 @المستخدم',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

function formatKoin(num) {
    if (num >= 1000000000000) return (num / 1000000000000).toFixed(2) + 'T'
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
            `💰 *خصم كوينز*\n\n` +
            `> \`.خصم_كوينز <الكمية>\` - من نفسك\n` +
            `> \`.خصم_كوينز <الكمية> @المستخدم\` - من مستخدم\n\n` +
            `\`مثال: ${m.prefix}خصم_كوينز 50000\``
        )
    }
    
    if (amount <= 0) {
        return m.reply(`❌ *فشل*\n\n> الكمية يجب أن تكون أكثر من 0`)
    }
    
    const user = db.getUser(targetJid)
    
    if (!user) {
        return m.reply(`❌ *فشل*\n\n> المستخدم غير موجود في قاعدة البيانات`)
    }
    
    const newKoin = db.updateKoin(targetJid, -amount)
    
    await m.react('✅')
    
    await m.reply(
        `✅ *تم خصم الكوينز*\n\n` +
        `╭┈┈⬡「 📋 *التفاصيل* 」\n` +
        `┃ 👤 المستخدم: @${targetJid.split('@')[0]}\n` +
        `┃ ➖ المخصوم: *-${formatKoin(amount)}*\n` +
        `┃ 💰 المتبقي: *${formatKoin(newKoin)}*\n` +
        `╰┈┈⬡`,
        { mentions: [targetJid] }
    )
}

export { pluginConfig as config, handler }