import { getDatabase } from '../../src/lib/maro-database.js'
import * as timeHelper from '../../src/lib/maro-time.js'
const pluginConfig = {
    name: 'تفقد_الاشتراك',
    alias: ['checksewa'],
    category: 'group',
    description: 'تحقق من وقت الاشتراك المتبقي للبوت في المجموعة',
    usage: '.تفقد_الاشتراك',
    example: '.تفقد_الاشتراك',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

function formatCountdown(expiredAt) {
    const diff = expiredAt - Date.now()
    if (diff <= 0) return { text: 'منتهي', expired: true }
    const days = Math.floor(diff / 86400000)
    const hours = Math.floor((diff % 86400000) / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    let text = ''
    if (days > 0) text += `${days} يوم `
    if (hours > 0) text += `${hours} ساعة `
    if (minutes > 0 && days === 0) text += `${minutes} دقيقة`
    return { text: text.trim(), expired: false }
}

function handler(m) {
    const db = getDatabase()
    if (!db.db.data.sewa) {
        db.db.data.sewa = { enabled: false, groups: {} }
        db.db.write()
    }

    if (!db.db.data.sewa.enabled) {
        return m.reply(`ℹ️ نظام الاشتراك غير مفعل\n\nيمكن استخدام البوت في جميع المجموعات.`)
    }

    const sewaData = db.db.data.sewa.groups[m.chat]

    if (!sewaData) {
        return m.reply(`❌ هذه المجموعة غير مسجلة في نظام الاشتراك\n\nتواصل مع مالك البوت للحصول على اشتراك.`)
    }

    const groupName = sewaData.name || m.chat.split('@')[0]
    const addedDate = sewaData.addedAt ? timeHelper.fromTimestamp(sewaData.addedAt, 'D MMMM YYYY') : '-'

    if (sewaData.isLifetime) {
        m.react('♾️')
        return m.reply(
            `♾️ *حالة الاشتراك*\n\n` +
            `المجموعة: *${groupName}*\n` +
            `الحالة: *دائم* ♾️\n` +
            `مسجل منذ: *${addedDate}*\n\n` +
            `البوت سيعمل للأبد في هذه المجموعة.`
        )
    }

    const countdown = formatCountdown(sewaData.expiredAt)
    const expiredStr = timeHelper.fromTimestamp(sewaData.expiredAt, 'D MMMM YYYY HH:mm')

    if (countdown.expired) {
        return m.reply(
            `❌ *انتهى الاشتراك*\n\n` +
            `المجموعة: *${groupName}*\n` +
            `انتهى: *${expiredStr}*\n\n` +
            `تواصل مع مالك البوت لتجديد الاشتراك.`
        )
    }

    const diff = sewaData.expiredAt - Date.now()
    const isAlmostExpired = diff <= 259200000

    m.react(isAlmostExpired ? '⚠️' : '⏱️')
    let text = `⏱️ *حالة الاشتراك*\n\n`
    text += `المجموعة: *${groupName}*\n`
    text += `الوقت المتبقي: *${countdown.text}*\n`
    text += `ينتهي: *${expiredStr}*\n`
    text += `مسجل منذ: *${addedDate}*`

    if (isAlmostExpired) {
        text += `\n\n⚠️ الاشتراك على وشك الانتهاء! تواصل مع مالك البوت للتجديد.`
    }

    return m.reply(text)
}

export { pluginConfig as config, handler }