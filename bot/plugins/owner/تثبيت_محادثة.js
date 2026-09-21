// تثبيت المحادثة - أمر لتثبيت/إلغاء تثبيت المحادثة

const pluginConfig = {
    name: ['تثبيت_المحادثة'],
    alias: ['pinchat'],
    category: 'owner',
    description: 'تثبيت/إلغاء تثبيت المحادثة',
    usage: '.تثبيت_المحادثة <الرقم/رد> أو .تثبيت_المحادثة فتح <الرقم>',
    example: '.تثبيت_المحادثة 628xxx',
    isOwner: true,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const action = m.args[0]?.toLowerCase()
    let targetJid = null
    let pin = true

    if (action === 'بuka' || action === 'unpin' || action === 'فتح') {
        pin = false
        const num = (m.args[1] || '').replace(/[^0-9]/g, '')
        if (num) targetJid = num + '@s.whatsapp.net'
        else if (m.quoted) targetJid = m.quoted.sender || m.quoted.participant
        else if (!m.isGroup) targetJid = m.chat
    } else {
        if (m.mentionedJid?.length > 0) {
            targetJid = m.mentionedJid[0]
        } else if (m.quoted) {
            targetJid = m.quoted.sender || m.quoted.participant
        } else if (m.args[0]) {
            const num = m.args[0].replace(/[^0-9]/g, '')
            if (num) targetJid = num + '@s.whatsapp.net'
        } else if (!m.isGroup) {
            targetJid = m.chat
        }
    }

    if (!targetJid) {
        return m.reply(
            '📌 *تثبيت المحادثة*\n\n' +
            '> `.تثبيت_المحادثة 628xxx` — تثبيت المحادثة\n' +
            '> `.تثبيت_المحادثة` (في المحادثة الخاصة) — تثبيت هذه المحادثة\n' +
            '> `.تثبيت_المحادثة فتح 628xxx` — إلغاء تثبيت المحادثة'
        )
    }

    try {
        await sock.chatModify({ pin }, targetJid)
        await m.react('✅')
        const target = targetJid.split('@')[0]
        return m.reply(
            pin
                ? `📌 *تم تثبيت المحادثة*\n\n> الهدف: ${target}`
                : `📍 *تم إلغاء تثبيت المحادثة*\n\n> الهدف: ${target}`
        )
    } catch (err) {
        return m.reply(`❌ فشل: ${err.message}`)
    }
}

export { pluginConfig as config, handler }