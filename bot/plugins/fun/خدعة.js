const pluginConfig = {
    name: 'خدعة',
    alias: ['sulap'],
    category: 'fun',
    description: 'عرض خدع سحرية - طرد عضو بشكل درامي',
    usage: '.خدعة',
    example: '.خدعة',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 60,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
}

if (!global.sulapSessions) global.sulapSessions = new Map()

const successLines = [
    '💨 *بوف!* و... اختفى!',
    '🌟 نجحت الخدعة! إلى اللقاء~',
    '✨ غاب عن الأنظار، ننتظر عودتك!',
    '🎪 انتهى العرض! 👏'
]

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function handler(m, { sock }) {
    await m.react('🎩')

    const sent = await m.reply(`🎩✨ *عرض خدع سحرية*\n\n` +
            `من تريد أن يختفي؟\n\n` +
            `> رد على هذه الرسالة وأشر على الشخص`)

    global.sulapSessions.set(sent.key.id, {
        admin: m.sender,
        chat: m.chat,
        timestamp: Date.now()
    })

    setTimeout(() => {
        global.sulapSessions.delete(sent.key.id)
    }, 120000)
}

async function replyHandler(m, sock) {
    if (!m.quoted) return false

    const quotedId = m.quoted?.id || m.quoted?.key?.id
    if (!quotedId) return false

    const session = global.sulapSessions.get(quotedId)
    if (!session) return false
    if (session.chat !== m.chat) return false
    if (session.admin !== m.sender) return false

    let targetJid = null
    if (m.mentionedJid?.[0]) {
        targetJid = m.mentionedJid[0]
    } else if (m.quoted?.sender && m.quoted.sender !== sock.user?.id) {
        return false
    }

    if (!targetJid) {
        await sock.sendMessage(m.chat, { text: '❌ أشر على الشخص!' }, { quoted: m })
        return true
    }

    global.sulapSessions.delete(quotedId)

    const targetNumber = targetJid.split('@')[0]
    const botNumber = sock.user?.id?.split(':')[0]
    const senderNumber = m.sender.split('@')[0]

    if (targetNumber === botNumber) {
        await sock.sendMessage(m.chat, { text: '🎭 البوت لا يستطيع إخفاء نفسه!' })
        return true
    }

    if (targetJid === m.sender) {
        await sock.sendMessage(m.chat, { text: '🎭 لا يمكنك إخفاء نفسك!' })
        return true
    }

    try {
        const groupMeta = m.groupMetadata
        const target = groupMeta.participants.find(p =>
            p.jid === targetJid || p.jid?.includes(targetNumber)
        )

        if (!target) {
            await sock.sendMessage(m.chat, { text: '👻 هذا الشخص غير موجود في المجموعة!' })
            return true
        }

        if (['admin', 'superadmin'].includes(target.admin)) {
            await sock.sendMessage(m.chat, { text: '🛡️ المشرف محصن ضد السحر!' })
            return true
        }

        await sock.sendMessage(m.chat, {
            text: `🪄 *استعد @${targetNumber}...* ✨`,
            mentions: [targetJid]
        })

        await sleep(2000)

        await sock.groupParticipantsUpdate(m.chat, [targetJid], 'remove')

        const line = successLines[Math.floor(Math.random() * successLines.length)]
        await sock.sendMessage(m.chat, {
            text: `${line}\n\n` +
                `🎯 @${targetNumber} اختفى!\n` +
                `🎩 الساحر: @${senderNumber}\n\n` +
                `> _انتهى العرض~_ ✨`,
            mentions: [targetJid, m.sender]
        })

    } catch (error) {
        await sock.sendMessage(m.chat, { text: `😅 فشلت الخدعة...\n\n> ${error.message}` })
    }

    return true
}

export { pluginConfig as config, handler, replyHandler }