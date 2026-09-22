import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'اضف_كوينز',
    alias: ['addkoin'],
    category: 'owner',
    description: 'إضافة كوينز لمستخدم (الحد الأقصى 9 تريليون)',
    usage: '.اضف_كوينز <الكمية> @المستخدم',
    example: '.اضف_كوينز 100000 @المستخدم',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

const MAX_KOIN = 9000000000000

function formatKoin(num) {
    if (num === -1) return '∞ غير محدود'
    if (num >= 1000000000000) return (num / 1000000000000).toFixed(2) + 'T'
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B'
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K'
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []

    const numArg = args.find(a => !isNaN(a) && !a.startsWith('@'))
    let amount = parseInt(numArg) || 0

    let targetJid = null
    if (m.quoted) {
        targetJid = m.quoted.sender
    } else if (m.mentionedJid?.length) {
        targetJid = m.mentionedJid[0]
    }

    if (!targetJid && amount > 0) {
        targetJid = m.sender
    }

    if (!targetJid || amount <= 0) {
        return m.reply(
            `💰 *إضافة كوينز*\n\n` +
            `> \`.اضف_كوينز <الكمية>\` - لنفسك\n` +
            `> \`.اضف_كوينز <الكمية> @المستخدم\` - لشخص آخر\n` +
            `> الحد الأقصى: 9.000.000.000.000 (9T)\n\n` +
            `\`مثال: ${m.prefix}اضف_كوينز 100000\``
        )
    }

    if (amount > MAX_KOIN) amount = MAX_KOIN

    const user = db.getUser(targetJid) || db.setUser(targetJid)

    if (user.koin === -1) {
        return m.reply(
            `💰 *معلومة*\n` +
            `@${targetJid.split('@')[0]} يمتلك بالفعل كوينز *∞ غير محدودة*\n` +
            `لا حاجة لإضافة المزيد من الكوينز`,
            { mentions: [targetJid] }
        )
    }

    const newKoin = db.updateKoin(targetJid, amount)

    await m.react('✅')
    await m.reply(
        `✅ تمت إضافة *${formatKoin(amount)}* كوينز بنجاح إلى *@${targetJid.split('@')[0]}*`,
        { mentions: [targetJid] }
    )
}

export { pluginConfig as config, handler }