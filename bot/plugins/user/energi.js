import { getDatabase } from '../../src/lib/maro-database.js'
import config from '../../config.js'

const pluginConfig = {
    name: "energi",
    alias: ["limit"],
    category: 'user',
    description: 'التحقق من طاقة المستخدم',
    usage: '.energi [@user]',
    example: '.energi',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

function formatNumber(num) {
    if (num === -1) return '∞ غير محدودة'
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

async function handler(m, { sock }) {
    const db = getDatabase()
    
    let targetJid = m.sender
    let targetName = m.pushName || 'أنت'
    
    if (m.quoted) {
        targetJid = m.quoted.sender
        targetName = m.quoted.pushName || targetJid.split('@')[0]
    } else if (m.mentionedJid?.length) {
        targetJid = m.mentionedJid[0]
        targetName = targetJid.split('@')[0]
    }
    
    const user = db.getUser(targetJid) || db.setUser(targetJid)
    const isOwner = config.owner?.number?.includes(targetJid.replace(/[^0-9]/g, '')) || config.isOwner?.(targetJid)

    const dbToggle = db.setting('energi')
    const energiEnabled = dbToggle !== undefined ? dbToggle : (config.energi?.enabled !== false)

    let finalEnergi
    if (!energiEnabled || isOwner) {
        finalEnergi = -1
    } else if (user.isPremium) {
        finalEnergi = user.energi ?? config.energi?.premium ?? 100
    } else {
        finalEnergi = user.energi ?? config.energi?.default ?? 25
    }

    const isUnlimited = finalEnergi === -1
    const energiDisplay = formatNumber(finalEnergi)
    
    const isSelf = targetJid === m.sender
    
    let userStatus = 'مجاني'
    if (isOwner) userStatus = 'المالك'
    else if (user.isPremium) userStatus = 'مميز'
    if (!energiEnabled) userStatus += ' (الطاقة معطلة)'
    
    let text = `*〔 ⚡ معلومات الطاقة 〕*\n\n`
    text += `*〔 👤 المستخدم 〕* ${targetName}\n`
    text += `*〔 ⚡ الطاقة 〕* ${energiDisplay}\n`
    text += `*〔 💎 الحالة 〕* ${userStatus}\n\n`
    
    if (!energiEnabled) {
        text += `🔌 نظام الطاقة معطل — جميع الأوامر مجانية`
    } else if (isSelf && !isUnlimited && finalEnergi < 10) {
        text += `⚠️ الطاقة على وشك النفاد!\n`
        text += `استخدم \`.buyenergi\` للشراء`
    } else if (isUnlimited) {
        text += `✨ الطاقة غير محدودة!`
    }
    
    await m.reply(text)
}

export { pluginConfig as config, handler }