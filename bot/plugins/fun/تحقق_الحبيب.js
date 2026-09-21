import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'تحقق_الحبيب',
    alias: ['cekpacar'],
    category: 'fun',
    description: 'تحقق من حالة علاقة شخص ما',
    usage: '.تحقق_الحبيب أو .تحقق_الحبيب @إشارة',
    example: '.تحقق_الحبيب',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    let targetJid = m.sender
    let isOther = false
    if (m.quoted) {
        targetJid = m.quoted.sender
        isOther = true
    } else if (m.mentionedJid?.[0]) {
        targetJid = m.mentionedJid[0]
        isOther = true
    } else if (args[0]) {
        let num = args[0].replace(/[^0-9]/g, '')
        if (num.length > 5 && num.length < 20) {
            targetJid = num + '@s.whatsapp.net'
            isOther = true
        }
    }
    
    const userData = db.getUser(targetJid) || {}
    
    if (!userData.fun?.pasangan) {
        const nama = isOther ? `@${targetJid.split('@')[0]}` : 'أنت'
        await m.react('💔')
        return m.reply(
            `💔 *حالة العلاقة*\n\n` +
            `*${nama}* ليس لديه حبيب.\n` +
            `نصيحة: ابحث عن حبيب أولاً بـ \`${m.prefix}اعتراف @إشارة\``,
            { mentions: isOther ? [targetJid] : [] }
        )
    }
    
    const partnerJid = userData.fun.pasangan
    const partnerData = db.getUser(partnerJid) || {}
    const isMutual = partnerData.fun?.pasangan === targetJid
    const nama = isOther ? `@${targetJid.split('@')[0]}` : 'أنت'
    if (isMutual) {
        await m.react('💕')
        await m.reply(
            `💕 *حالة العلاقة*\n\n` +
            `*${nama}* على علاقة مع @${partnerJid.split('@')[0]}! 🥳`,
            { mentions: [targetJid, partnerJid] }
        )
    } else {
        await m.react('💭')
        await m.reply(
            `💭 *حالة العلاقة*\n\n` +
            `*${nama}* يتقرب من @${partnerJid.split('@')[0]}\n` +
            `الحالة: *معلق* 😅\n\n` +
            `في انتظار الرد...`,
            { mentions: [targetJid, partnerJid] }
        )
    }
}

export { pluginConfig as config, handler }