// قائمة الإيجار - أمر لعرض قائمة المجموعات المسجلة في الإيجار

import { getDatabase } from '../../src/lib/maro-database.js'
import * as timeHelper from '../../src/lib/maro-time.js'

const pluginConfig = {
    name: 'قائمة_الإيجار',
    alias: ['listsewa'],
    category: 'owner',
    description: 'عرض قائمة المجموعات المسجلة في الإيجار',
    usage: '.قائمة_الإيجار',
    example: '.قائمة_الإيجار',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function formatCountdown(data) {
    if (data.status === 'expired') return '🚫 منتهي (مغادر)'
    if (data.isLifetime) return '♾️ دائم'
    const diff = data.expiredAt - Date.now()
    if (diff <= 0) return '❌ منتهي'
    const days = Math.floor(diff / 86400000)
    const hours = Math.floor((diff % 86400000) / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    if (days > 0) return `${days}ي ${hours}س`
    if (hours > 0) return `${hours}س ${minutes}د`
    return `${minutes}د`
}

function getStatusEmoji(data) {
    if (data.status === 'expired') return '🚫'
    if (data.isLifetime) return '♾️'
    const diff = data.expiredAt - Date.now()
    if (diff <= 0) return '❌'
    if (diff <= 259200000) return '⚠️'
    return '✅'
}

function handler(m) {
    const db = getDatabase()
    if (!db.db.data.sewa) {
        db.db.data.sewa = { enabled: false, groups: {} }
        db.db.write()
    }

    const sewaGroups = db.db.data.sewa.groups || {}
    const groupIds = Object.keys(sewaGroups)

    if (groupIds.length === 0) {
        return m.reply(
            `📋 *قائمة الإيجار*\n\n` +
            `حالة النظام: *${db.db.data.sewa.enabled ? '✅ مفعل' : '❌ معطل'}*\n` +
            `لا توجد مجموعات مسجلة\n\n` +
            `الإضافة: *${m.prefix}إضافة_إيجار <الرابط> <المدة>*`
        )
    }

    const sorted = groupIds.sort((a, b) => {
        const aData = sewaGroups[a]
        const bData = sewaGroups[b]
        if (aData.isLifetime && !bData.isLifetime) return 1
        if (!aData.isLifetime && bData.isLifetime) return -1
        return (aData.expiredAt || 0) - (bData.expiredAt || 0)
    })

    const active = sorted.filter(id => sewaGroups[id].isLifetime || sewaGroups[id].expiredAt > Date.now())
    const expired = sorted.filter(id => !sewaGroups[id].isLifetime && sewaGroups[id].expiredAt <= Date.now())

    let text = `📋 *قائمة الإيجار*\n\n`
    text += `حالة النظام: *${db.db.data.sewa.enabled ? '✅ مفعل' : '❌ معطل'}*\n`
    text += `الإجمالي: *${groupIds.length}* مجموعة (${active.length} نشطة, ${expired.length} منتهية)\n\n`

    for (let i = 0; i < sorted.length; i++) {
        const gid = sorted[i]
        const data = sewaGroups[gid]
        const status = getStatusEmoji(data)
        const countdown = formatCountdown(data)
        const addedDate = data.addedAt ? timeHelper.fromTimestamp(data.addedAt, 'DD/MM/YYYY') : '-'

        text += `${status} *${i + 1}. ${data.name || 'غير معروف'}*\n`
        text += `   المعرف: ${gid.split('@')[0]}\n`
        text += `   المتبقي: ${countdown}\n`
        text += `   تاريخ الإضافة: ${addedDate}\n\n`
    }

    text += `*الإجراءات:*\n`
    text += `• *${m.prefix}تجديد_الإيجار <المعرف> <المدة>* — تمديد\n`
    text += `• *${m.prefix}حذف_الإيجار <المعرف>* — حذف من القائمة البيضاء`

    return m.reply(text)
}

export { pluginConfig as config, handler }