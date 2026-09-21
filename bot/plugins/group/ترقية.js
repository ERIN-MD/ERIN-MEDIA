import { getParticipantJid } from '../../src/lib/maro-lid.js'
import te from '../../src/lib/maro-error.js'
const pluginConfig = {
    name: 'ترقية',
    alias: ['promote'],
    category: 'group',
    description: 'ترقية عضو إلى مشرف',
    usage: '.ترقية @مستخدم',
    example: '.ترقية @مستخدم',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
}

async function handler(m, { sock }) {
    let target = null

    if (m.quoted) {
        target = m.quoted.sender
    } else if (m.mentionedJid && m.mentionedJid.length > 0) {
        target = m.mentionedJid[0]
    }

    if (!target) {
        await m.reply(
            `❌ *لم يتم العثور على الهدف*\n\n` +
            `> رد على رسالة المستخدم أو اذكره!\n` +
            `> مثال: \`${m.prefix}ترقية @مستخدم\``
        )
        return
    }

    try {
        const groupMeta = m.groupMetadata
        const participant = groupMeta.participants.find(p => getParticipantJid(p) === target)

        if (!participant) {
            await m.reply(`❌ *فشل*\n\n> المستخدم غير موجود في المجموعة!`)
            return
        }

        if (participant.admin) {
            await m.reply(`❌ *فشل*\n\n> المستخدم مشرف بالفعل!`)
            return
        }

        await sock.groupParticipantsUpdate(m.chat, [target], 'promote')

        await m.reply(
            `✅ @${target.split('@')[0]} تمت ترقيته إلى مشرف!`,
            { mentions: [target] }
        )

    } catch (error) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }