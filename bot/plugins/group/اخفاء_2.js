import config from '../../config.js'
import { getParticipantJids } from '../../src/lib/maro-lid.js'
import te from '../../src/lib/maro-error.js'
const pluginConfig = {
    name: 'اخفاء_2',
    alias: ['h2'],
    category: 'group',
    description: 'اخفاء مع اقتباس مزيف',
    usage: '.اخفاء_2 <نص> أو رد على رسالة',
    example: '.اخفاء_2 إعلان مهم!',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 30,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
}

async function handler(m, { sock }) {
    const text = m.fullArgs?.trim()

    if (!text && !m.quoted) {
        return m.reply(
            `📢 *اخفاء 2*\n\n` +
            `• \`${m.prefix}اخفاء_2 <نص>\`\n` +
            `• رد على رسالة + \`${m.prefix}اخفاء_2\``
        )
    }
    try {
        m.react('📢')
        const groupMeta = m.groupMetadata
        const users = getParticipantJids(groupMeta.participants || [])
        const fakeQuoted = {
            key: {
                fromMe: false,
                participant: '0@s.whatsapp.net',
                remoteJid: 'status@broadcast'
            },
            message: {
                conversation: config.bot?.name || 'Maro MD'
            }
        }
        if (m.quoted) {
            const q = m.quoted
            const qMsg = q.message || {}
            const type = Object.keys(qMsg)[0]
            if (type === 'imageMessage') {
                const media = await q.download()
                return sock.sendMessage(m.chat, { image: media, caption: qMsg.imageMessage?.caption || '', mentions: users }, { quoted: fakeQuoted })
            }
            if (type === 'videoMessage') {
                const media = await q.download()
                return sock.sendMessage(m.chat, { video: media, caption: qMsg.videoMessage?.caption || '', mentions: users }, { quoted: fakeQuoted })
            }
            if (type === 'stickerMessage') {
                const media = await q.download()
                return sock.sendMessage(m.chat, { sticker: media, mentions: users }, { quoted: fakeQuoted })
            }
            if (type === 'audioMessage') {
                const media = await q.download()
                return sock.sendMessage(m.chat, { audio: media, mimetype: qMsg.audioMessage?.mimetype, ptt: qMsg.audioMessage?.ptt || false, mentions: users }, { quoted: fakeQuoted })
            }
            if (type === 'documentMessage') {
                const media = await q.download()
                return sock.sendMessage(m.chat, { document: media, fileName: qMsg.documentMessage?.fileName || 'ملف', mimetype: qMsg.documentMessage?.mimetype, mentions: users }, { quoted: fakeQuoted })
            }
            const quotedText = q.text || qMsg.conversation || qMsg.extendedTextMessage?.text || ''
            return sock.sendMessage(m.chat, { text: quotedText, mentions: users }, { quoted: fakeQuoted })
        }

        await sock.sendMessage(m.chat, { text, mentions: users }, { quoted: fakeQuoted })
        m.react('✅')

    } catch (err) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }