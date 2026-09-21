import { getParticipantJids } from '../../src/lib/maro-lid.js'
import te from '../../src/lib/maro-error.js'
import config from '../../config.js'

const pluginConfig = {
    name: ['اخفاء', 'مخفي', 'هيد_تاغ'],
    alias: ['ht'],
    category: 'group',
    description: 'منشن مخفي لجميع الأعضاء مع دعم الرد على الرسائل (نص/وسائط) واقتباس مزيف',
    usage: '.اخفاء [نص] أو رد على رسالة',
    example: '.اخفاء أو رد على رسالة ثم .اخفاء',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 30,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: false
}

async function handler(m, { sock }) {
    try {
        const groupMeta = m.groupMetadata
        const participants = groupMeta.participants || []
        const mentions = getParticipantJids(participants)

        const quoted = m.quoted
        const text = m.fullArgs?.trim()

        // اقتباس مزيف
        const fakeQuoted = {
            key: {
                fromMe: false,
                participant: "0@s.whatsapp.net",
                remoteJid: m.chat,
                id: Date.now().toString()
            },
            message: {
                conversation: `${config.bot?.name || 'Maro MD'}`
            }
        }

        if (quoted) {
            const qMsg = quoted.message || {}
            const type = Object.keys(qMsg)[0]

            if (type === 'imageMessage') {
                const media = await quoted.download()
                const caption = qMsg.imageMessage?.caption || text || ''
                return sock.sendMessage(m.chat, { image: media, caption, mentions }, { quoted: fakeQuoted })
            }

            if (type === 'videoMessage') {
                const media = await quoted.download()
                const caption = qMsg.videoMessage?.caption || text || ''
                return sock.sendMessage(m.chat, { video: media, caption, mentions }, { quoted: fakeQuoted })
            }

            if (type === 'stickerMessage') {
                const media = await quoted.download()
                await sock.sendMessage(m.chat, { sticker: media, mentions }, { quoted: fakeQuoted })
                if (text) { await sock.sendMessage(m.chat, { text, mentions }, { quoted: fakeQuoted }) }
                return
            }

            if (type === 'audioMessage') {
                const media = await quoted.download()
                const audioMsg = qMsg.audioMessage || {}
                await sock.sendMessage(m.chat, { audio: media, mimetype: audioMsg.mimetype, ptt: audioMsg.ptt || false, mentions }, { quoted: fakeQuoted })
                if (text) { await sock.sendMessage(m.chat, { text, mentions }, { quoted: fakeQuoted }) }
                return
            }

            if (type === 'documentMessage') {
                const media = await quoted.download()
                const docMsg = qMsg.documentMessage || {}
                await sock.sendMessage(m.chat, { document: media, mimetype: docMsg.mimetype, fileName: docMsg.fileName || 'ملف', mentions }, { quoted: fakeQuoted })
                if (text) { await sock.sendMessage(m.chat, { text, mentions }, { quoted: fakeQuoted }) }
                return
            }

            const quotedText = quoted.text || qMsg.conversation || qMsg.extendedTextMessage?.text || ''
            const finalText = text || quotedText
            if (!finalText) { return m.reply('❌ *النص فارغ*') }
            return sock.sendMessage(m.chat, { text: finalText, mentions }, { quoted: fakeQuoted })
        }

        if (!text) {
            return m.reply(
                `📢 *اخفاء / مخفي*\n\n` +
                `• رد على رسالة ثم اكتب \`${m.prefix}اخفاء\`\n` +
                `• أو اكتب \`${m.prefix}اخفاء <نص>\`\n\n` +
                `يدعم: نص، صورة، فيديو، ملصق، صوت، مستندات\n\n` +
                `*للمطور:* يعمل مع جميع الأعضاء`
            )
        }

        // وضع مخفي - حرف غير مرئي مع النص
        const invisibleChar = String.fromCharCode(8206)
        const fullMessage = `${invisibleChar.repeat(4000)}\n\n${text}`

        await sock.sendMessage(m.chat, {
            text: fullMessage,
            mentions
        }, { quoted: fakeQuoted })

    } catch (err) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }