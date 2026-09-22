import config from '../../config.js'
import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'تحقق_المميز',
    alias: ['cekprem'],
    category: 'cek',
    description: 'تحقق من تفاصيل حالة المستخدم المميز',
    usage: '.تحقق_المميز @مستخدم',
    example: '.تحقق_المميز',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function formatDate(ts) {
    return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

async function handler(m) {
    const db = getDatabase()
    let targetNumber = ''

    if (m.quoted) {
        targetNumber = m.quoted.sender?.replace(/[^0-9]/g, '') || ''
    } else if (m.mentionedJid?.length) {
        targetNumber = m.mentionedJid[0]?.replace(/[^0-9]/g, '') || ''
    } else if (m.args?.length) {
        targetNumber = m.args[0].replace(/[^0-9]/g, '')
    } else {
        targetNumber = m.sender?.replace(/[^0-9]/g, '') || ''
    }

    if (targetNumber.startsWith('0')) targetNumber = '62' + targetNumber.slice(1)
    if (!db.data.premium) db.data.premium = []

    const premData = db.data.premium.find(p =>
        typeof p === 'string' ? p === targetNumber : p.id === targetNumber
    )
    const jid = targetNumber + '@s.whatsapp.net'
    const isConfigPrem = config.isPremium(targetNumber)
    const isConfigOwner = config.isOwner(targetNumber)

    if (!premData && !isConfigPrem && !isConfigOwner) {
        return m.reply(`❌ @${targetNumber} ليس مميزاً`, { mentions: [jid] })
    }

    const user = db.getUser(jid)
    const now = Date.now()

    let txt = `💎 *تفاصيل المميز*\n\n`
    txt += `👤 المستخدم: @${targetNumber}\n`

    if (isConfigOwner) {
        txt += `🏷️ الرتبة: *👑 مالك (دائم)*\n`
    } else if (typeof premData === 'string' || !premData?.expired) {
        txt += `🏷️ الرتبة: *💎 مميز (دائم)*\n`
    } else {
        const remaining = Math.ceil((premData.expired - now) / (1000 * 60 * 60 * 24))
        const totalDays = premData.addedAt ? Math.ceil((premData.expired - premData.addedAt) / (1000 * 60 * 60 * 24)) : '?'
        txt += `📛 الاسم: *${premData.name || 'غير معروف'}*\n`
        txt += `📅 البداية: *${premData.addedAt ? formatDate(premData.addedAt) : 'غير معروف'}*\n`
        txt += `⏳ الانتهاء: *${formatDate(premData.expired)}*\n`
        txt += `🗓️ المدة: *${totalDays} يوم*\n`
        txt += `📊 المتبقي: *${remaining > 0 ? remaining + ' يوم' : '⚠️ منتهي'}*\n`
    }

    if (user) {
        txt += `⚡ الطاقة: *${user.energi === -1 ? '∞' : (user.energi ?? 0)}*\n`
        txt += `💰 العملات: *${user.koin === -1 ? '∞' : (user.koin ?? 0).toLocaleString('id-ID')}*\n`
        txt += `⭐ الخبرة: *${(user.exp ?? 0).toLocaleString('id-ID')}*\n`
        txt += `📊 المستوى: *${user.level ?? 1}*\n`
    }

    await m.reply(txt, { mentions: [jid] })
}

export { pluginConfig as config, handler }