import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'خصم_طاقة',
    alias: ['delenergi'],
    category: 'owner',
    description: 'خصم طاقة من مستخدم',
    usage: '.خصم_طاقة <الكمية> @المستخدم',
    example: '.خصم_طاقة 50 @المستخدم',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

function formatNumber(num) {
    if (num === -1) return '∞ غير محدود'
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
            `⚡ *خصم طاقة*\n\n` +
            `> \`.خصم_طاقة <الكمية>\` - من نفسك\n` +
            `> \`.خصم_طاقة <الكمية> @المستخدم\` - من مستخدم\n\n` +
            `\`مثال: ${m.prefix}خصم_طاقة 50\``
        )
    }
    
    if (amount <= 0) {
        return m.reply(`❌ *فشل*\n\n> الكمية يجب أن تكون أكثر من 0`)
    }
    
    const user = db.getUser(targetJid)
    
    if (!user) {
        return m.reply(`❌ *فشل*\n\n> المستخدم غير موجود في قاعدة البيانات`)
    }
    
    if (user.energi === -1) {
        db.setUser(targetJid, { energi: 25 })
    }
    
    const newEnergi = db.updateEnergi(targetJid, -amount)
    
    await m.react('✅')
    
    await m.reply(
        `✅ *تم خصم الطاقة*\n\n` +
        `╭┈┈⬡「 📋 *التفاصيل* 」\n` +
        `┃ 👤 المستخدم: @${targetJid.split('@')[0]}\n` +
        `┃ ➖ المخصوم: *-${formatNumber(amount)}*\n` +
        `┃ ⚡ المتبقي: *${formatNumber(newEnergi)}*\n` +
        `╰┈┈⬡`,
        { mentions: [targetJid] }
    )
}

export { pluginConfig as config, handler }