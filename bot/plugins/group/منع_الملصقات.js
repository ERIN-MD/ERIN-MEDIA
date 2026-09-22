import { getDatabase } from '../../src/lib/maro-database.js'
import config from '../../config.js'
const pluginConfig = {
    name: 'منع_الملصقات',
    alias: ['antisticker'],
    category: 'group',
    description: 'منع الملصقات في المجموعة',
    usage: '.منع_الملصقات <تشغيل/إيقاف>',
    example: '.منع_الملصقات تشغيل',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    isBotAdmin: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function gpMsg(key, replacements = {}) {
    const defaults = {
        antisticker: '⚠ *منع الملصقات* — ملصق من @%user% تم حذفه.',
    }
    let text = config.groupProtection?.[key] || defaults[key] || ''
    for (const [k, v] of Object.entries(replacements)) {
        text = text.replace(new RegExp(`%${k}%`, 'g'), v)
    }
    return text
}

async function checkAntisticker(m, sock, db) {
    if (!m.isGroup) return false
    if (m.isAdmin || m.isOwner || m.fromMe) return false

    const groupData = db.getGroup(m.chat) || {}
    if (!groupData.antisticker) return false

    const isSticker = m.isSticker || m.type === 'stickerMessage'
    if (!isSticker) return false

    try {
        await sock.sendMessage(m.chat, { delete: m.key })
    } catch {}

    await sock.sendMessage(m.chat, {
        text: gpMsg('antisticker', { user: m.sender.split('@')[0] }),
        mentions: [m.sender],
    })

    return true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const action = (m.args || [])[0]?.toLowerCase()
    const groupData = db.getGroup(m.chat) || {}

    if (!action) {
        const status = groupData.antisticker ? '✅ مفعل' : '❌ معطل'
        await m.reply(`🎭 *منع الملصقات*\n\n> الحالة: *${status}*\n\n> \`.منع_الملصقات تشغيل/إيقاف\``)
        return
    }

    if (action === 'تشغيل' || action === 'on') {
        db.setGroup(m.chat, { antisticker: true })
        m.react('✅')
        await m.reply(`✅ *تم تفعيل منع الملصقات*`)
        return
    }

    if (action === 'ايقاف' || action === 'off') {
        db.setGroup(m.chat, { antisticker: false })
        m.react('❌')
        await m.reply(`❌ *تم تعطيل منع الملصقات*`)
        return
    }

    await m.reply(`❌ استخدم \`.منع_الملصقات تشغيل\` أو \`.منع_الملصقات إيقاف\``)
}

export { pluginConfig as config, handler, checkAntisticker }