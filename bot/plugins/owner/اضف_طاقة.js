import config from '../../config.js'
import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'اضف_طاقة',
    alias: ['addenergi'],
    category: 'owner',
    description: 'إضافة طاقة لمستخدم',
    usage: '.اضف_طاقة <الكمية> @المستخدم',
    example: '.اضف_طاقة 100 @المستخدم',
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

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []

    let amount = 0
    let isUnlimited = false
    let targetJid = null

    if (m.text?.toLowerCase().includes('--unlimited') || m.text?.toLowerCase().includes('--unli')) {
        isUnlimited = true
    }

    const numArg = args.find(a => !isNaN(a) && !a.includes('@') && !a.startsWith('-'))
    if (numArg) amount = parseInt(numArg)

    if (m.quoted) {
        targetJid = m.quoted.sender
    } else if (m.mentionedJid?.length) {
        targetJid = m.mentionedJid[0]
    } else {
        const phoneArg = args.find(a => a !== numArg && a.length > 5 && /^\d+$/.test(a.replace(/[^0-9]/g, '')))
        if (phoneArg) {
            targetJid = phoneArg.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
        }
    }

    if (!targetJid && (amount > 0 || isUnlimited)) {
        targetJid = m.sender
    }

    if (!targetJid || (!isUnlimited && amount <= 0)) {
        return m.reply(
            `⚡ *إضافة طاقة*\n\n` +
            `> \`.اضف_طاقة <الكمية>\` - لنفسك\n` +
            `> \`.اضف_طاقة <الكمية> @المستخدم\` - لمستخدم\n` +
            `> \`.اضف_طاقة --unlimited\` - غير محدود\n\n` +
            `\`مثال: ${m.prefix}اضف_طاقة 100\``
        )
    }

    const user = db.getUser(targetJid) || db.setUser(targetJid)

    const effectiveUnlimited = user.energi === -1 ||
        (config.isOwner(targetJid) && (config.energi?.owner ?? -1) === -1) ||
        (config.isPremium(targetJid) && (config.energi?.premium ?? -1) === -1)

    if (!isUnlimited && effectiveUnlimited) {
        return m.reply(
            `⚡ *معلومة*\n` +
            `@${targetJid.split('@')[0]} يمتلك بالفعل طاقة *∞ غير محدودة*\n` +
            `لا حاجة لإضافة المزيد من الطاقة`,
            { mentions: [targetJid] }
        )
    }

    if (isUnlimited) {
        db.setUser(targetJid, { energi: -1 })

        await m.react('✅')
        await m.reply(
            `✅ *طاقة @${targetJid.split('@')[0]} الآن غير محدودة*`,
            { mentions: [targetJid] }
        )
    } else {
        const newEnergi = db.updateEnergi(targetJid, amount)

        await m.react('✅')
        await m.reply(
            `✅ تمت إضافة *${formatNumber(amount)}* طاقة بنجاح إلى *@${targetJid.split('@')[0]}*!\nالآن يمتلك *${formatNumber(newEnergi)}* طاقة`,
            { mentions: [targetJid] }
        )
    }
}

export { pluginConfig as config, handler }