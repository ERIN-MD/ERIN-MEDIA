import config from '../../config.js'
import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'تحقق_المالك',
    alias: ['cekowner'],
    category: 'cek',
    description: 'تحقق مما إذا كان المستخدم مالك البوت',
    usage: '.تحقق_المالك @مستخدم',
    example: '.تحقق_المالك',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    let targetNumber = ''
    let targetJid = ''

    if (m.quoted) {
        targetNumber = m.quoted.sender?.replace(/[^0-9]/g, '') || ''
        targetJid = m.quoted.sender
    } else if (m.mentionedJid?.length) {
        targetNumber = m.mentionedJid[0]?.replace(/[^0-9]/g, '') || ''
        targetJid = m.mentionedJid[0]
    } else if (m.args?.length) {
        targetNumber = m.args[0].replace(/[^0-9]/g, '')
        targetJid = targetNumber + '@s.whatsapp.net'
    } else {
        targetNumber = m.sender?.replace(/[^0-9]/g, '') || ''
        targetJid = m.sender
    }

    if (targetNumber.startsWith('0')) targetNumber = '62' + targetNumber.slice(1)

    const isOwnerUser = config.isOwner(targetNumber)
    const isPartnerUser = config.isPartner(targetNumber)
    const isPremiumUser = config.isPremium(targetNumber)
    const user = db.getUser(targetJid)

    const roles = []
    if (isOwnerUser) roles.push('👑 مالك')
    if (isPartnerUser) roles.push('🤝 شريك')
    if (isPremiumUser) roles.push('💎 مميز')
    if (roles.length === 0) roles.push('👤 مستخدم مجاني')

    const ownerList = db.data.owner || []
    const isInOwnerDb = ownerList.includes(targetNumber)

    let txt = `📋 *معلومات المستخدم*\n\n`
    txt += `👤 المستخدم: @${targetNumber}\n`
    txt += `🏷️ الرتبة: *${roles.join(' • ')}*\n`
    txt += `📊 قاعدة المالكين: *${isInOwnerDb ? 'نعم' : 'لا'}*\n`
    if (user) {
        txt += `⚡ الطاقة: *${user.energi === -1 ? '∞' : (user.energi ?? 0)}*\n`
        txt += `💰 العملات: *${user.koin === -1 ? '∞' : (user.koin ?? 0).toLocaleString('id-ID')}*\n`
        txt += `⭐ المستوى: *${user.level ?? 1}*\n`
    }

    await m.reply(txt, { mentions: [targetJid] })
}

export { pluginConfig as config, handler }