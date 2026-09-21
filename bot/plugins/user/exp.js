import { getDatabase } from '../../src/lib/maro-database.js'
import { calculateLevel, getRole } from '../../src/lib/maro-level.js'

const pluginConfig = {
    name: 'exp',
    alias: ['xp'],
    category: 'user',
    description: 'التحقق من خبرة المستخدم',
    usage: '.exp [@user]',
    example: '.exp',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

function formatNumber(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B'
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
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
    const expDisplay = formatNumber(user.exp || 0)
    const level = calculateLevel(user.exp || 0)
    const title = getRole(level)
    
    let text = `*〔 ⭐ معلومات الخبرة 〕*\n\n`
    text += `*〔 👤 المستخدم 〕* ${targetName}\n`
    text += `*〔 ⭐ الخبرة 〕* ${expDisplay}\n`
    text += `*〔 🏆 المستوى 〕* ${level}\n`
    text += `*〔 🎖️ اللقب 〕* ${title}\n`
    
    await m.reply(text)
}

export { pluginConfig as config, handler }