import { getDatabase } from '../../src/lib/maro-database.js'
import config from '../../config.js'
const pluginConfig = {
    name: 'منع_المستندات',
    alias: ['antidocument'],
    category: 'group',
    description: 'تفعيل/تعطيل منع المستندات في المجموعة',
    usage: '.منع_المستندات <تشغيل/إيقاف>',
    example: '.منع_المستندات تشغيل',
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
        antidocument: '⚠ *منع المستندات* — مستند من @%user% تم حذفه.',
    }
    let text = config.groupProtection?.[key] || defaults[key] || ''
    for (const [k, v] of Object.entries(replacements)) {
        text = text.replace(new RegExp(`%${k}%`, 'g'), v)
    }
    return text
}

async function checkAntidocument(m, sock, db) {
    if (!m.isGroup) return false
    if (m.isAdmin || m.isOwner || m.fromMe) return false

    const groupData = db.getGroup(m.chat) || {}
    if (!groupData.antidocument) return false

    const isDocument = m.isDocument || m.type === 'documentMessage' || m.type === 'documentWithCaptionMessage'
    if (!isDocument) return false

    try {
        await sock.sendMessage(m.chat, { delete: m.key })
    } catch {}

    await sock.sendMessage(m.chat, {
        text: gpMsg('antidocument', { user: m.sender.split('@')[0] }),
        mentions: [m.sender],
    })

    return true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const action = (m.args || [])[0]?.toLowerCase()
    const groupData = db.getGroup(m.chat) || {}

    if (!action) {
        const status = groupData.antidocument ? '✅ مفعل' : '❌ معطل'
        await m.reply(`📄 *منع المستندات*\n\n> الحالة: *${status}*\n\n> \`.منع_المستندات تشغيل/إيقاف\``)
        return
    }

    if (action === 'تشغيل' || action === 'on') {
        db.setGroup(m.chat, { antidocument: true })
        m.react('✅')
        await m.reply(`✅ *تم تفعيل منع المستندات*`)
        return
    }

    if (action === 'ايقاف' || action === 'off') {
        db.setGroup(m.chat, { antidocument: false })
        m.react('❌')
        await m.reply(`❌ *تم تعطيل منع المستندات*`)
        return
    }

    await m.reply(`❌ استخدم \`.منع_المستندات تشغيل\` أو \`.منع_المستندات إيقاف\``)
}

export { pluginConfig as config, handler, checkAntidocument }