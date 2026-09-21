const pluginConfig = {
    name: 'حذف',
    alias: ['delete'],
    category: 'group',
    description: 'حذف رسالة بالرد عليها',
    usage: '.حذف (رد على رسالة)',
    example: '.حذف',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    isBotAdmin: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    if (!m.quoted) {
        return m.reply('⚠️ *رد على الرسالة التي تريد حذفها!*')
    }

    const quotedSender = m.quoted.sender || m.quoted.key?.participant
    const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
    const isOwnMessage = m.quoted.key?.fromMe || quotedSender === m.sender
    const isBotMessage = quotedSender === botJid || m.quoted.key?.fromMe

    if (!isOwnMessage && !isBotMessage) {
        if (!m.isBotAdmin) {
            return m.reply('⚠️ *يجب أن يكون البوت مشرفاً لحذف رسائل الآخرين!*')
        }
        if (!m.isAdmin && !m.isOwner) {
            return m.reply('⚠️ *فقط المشرفون يمكنهم حذف رسائل الآخرين!*')
        }
    }

    try {
        const key = {
            remoteJid: m.chat,
            id: m.quoted.key.id,
            fromMe: m.quoted.key.fromMe,
            participant: quotedSender
        }

        await sock.sendMessage(m.chat, { delete: key })
        await m.react('✅')

    } catch (err) {
        if (err.message?.includes('not found') || err.message?.includes('forbidden')) {
            await m.reply('❌ *فشل الحذف!*\n> ربما تم حذف الرسالة بالفعل أو أنها قديمة جداً.')
        } else {
            await m.react('❌')
        }
    }
}

export { pluginConfig as config, handler }