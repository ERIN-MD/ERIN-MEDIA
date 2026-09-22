import config from '../../config.js'
import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'تحقق_الشريك',
    alias: ['cekpartner'],
    category: 'cek',
    description: 'تحقق من تفاصيل حالة الشريك للمستخدم',
    usage: '.تحقق_الشريك @مستخدم',
    example: '.تحقق_الشريك',
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
    if (!db.data.partner) db.data.partner = []

    const info = db.data.partner.find(p => p.id === targetNumber)
    const jid = targetNumber + '@s.whatsapp.net'

    if (!info) {
        return m.reply(`❌ @${targetNumber} ليس شريكاً`, { mentions: [jid] })
    }

    const now = Date.now()
    const remaining = Math.ceil((info.expired - now) / (1000 * 60 * 60 * 24))
    const totalDays = info.addedAt ? Math.ceil((info.expired - info.addedAt) / (1000 * 60 * 60 * 24)) : '?'
    const user = db.getUser(jid)

    let txt = `🤝 *تفاصيل الشريك*\n\n`
    txt += `👤 المستخدم: @${targetNumber}\n`
    txt += `📛 الاسم: *${info.name || 'غير معروف'}*\n`
    txt += `📅 البداية: *${info.addedAt ? formatDate(info.addedAt) : 'غير معروف'}*\n`
    txt += `⏳ الانتهاء: *${formatDate(info.expired)}*\n`
    txt += `🗓️ المدة: *${totalDays} يوم*\n`
    txt += `📊 المتبقي: *${remaining > 0 ? remaining + ' يوم' : '⚠️ منتهي'}*\n`
    if (user) {
        txt += `⚡ الطاقة: *${user.energi === -1 ? '∞' : (user.energi ?? 0)}*\n`
        txt += `💰 العملات: *${user.koin === -1 ? '∞' : (user.koin ?? 0).toLocaleString('id-ID')}*\n`
    }

    await m.reply(txt, { mentions: [jid] })
}

export { pluginConfig as config, handler }