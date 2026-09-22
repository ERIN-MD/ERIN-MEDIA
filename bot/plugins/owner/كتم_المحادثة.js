// كتم المحادثة - أمر لكتم/إلغاء كتم المحادثة

const pluginConfig = {
    name: ['كتم_المحادثة'],
    alias: ['mutechat'],
    category: 'owner',
    description: 'كتم/إلغاء كتم المحادثة',
    usage: '.كتم_المحادثة <الرقم/رد> أو .كتم_المحادثة فتح <الرقم>',
    example: '.كتم_المحادثة 628xxx',
    isOwner: true,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const action = m.args[0]?.toLowerCase()
    let targetJid = null
    let mute = true

    if (action === 'بuka' || action === 'unmute' || action === 'فتح') {
        mute = false
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
            '🔇 *كتم المحادثة*\n\n' +
            '> `.كتم_المحادثة 628xxx` — كتم المحادثة\n' +
            '> `.كتم_المحادثة` (في المحادثة الخاصة) — كتم هذه المحادثة\n' +
            '> `.كتم_المحادثة فتح 628xxx` — إلغاء كتم المحادثة'
        )
    }

    try {
        await sock.chatModify({ mute: mute ? 1 : null }, targetJid)
        await m.react('✅')
        const target = targetJid.split('@')[0]
        return m.reply(
            mute
                ? `🔇 *تم كتم المحادثة*\n\n> الهدف: ${target}`
                : `🔊 *تم إلغاء كتم المحادثة*\n\n> الهدف: ${target}`
        )
    } catch (err) {
        return m.reply(`❌ فشل: ${err.message}`)
    }
}

export { pluginConfig as config, handler }