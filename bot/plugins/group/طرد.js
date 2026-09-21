import { findParticipantByNumber } from '../../src/lib/maro-lid.js'
import te from '../../src/lib/maro-error.js'
const pluginConfig = {
    name: 'طرد',
    alias: ['kick'],
    category: 'group',
    description: 'طرد عضو من المجموعة',
    usage: '.طرد @مستخدم',
    example: '.طرد @مستخدم',
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
    let targetJid = null

    if (m.quoted) {
        targetJid = m.quoted.sender
    } else if (m.mentionedJid && m.mentionedJid.length > 0) {
        targetJid = m.mentionedJid[0]
    }

    if (!targetJid) {
        await m.reply(
            `❌ *لم يتم العثور على الهدف*\n\n` +
            `> رد على رسالة المستخدم أو اذكره!\n` +
            `> مثال: \`${m.prefix}طرد @مستخدم\``
        )
        return
    }

    const botNumber = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
    const targetNumber = targetJid.replace(/@.*$/, '')

    if (targetJid === botNumber || targetNumber === botNumber.replace(/@.*$/, '')) {
        await m.reply(`❌ *فشل*\n\n> لا يمكن طرد البوت!`)
        return
    }

    if (targetJid === m.sender) {
        await m.reply(`❌ *فشل*\n\n> لا يمكن طرد نفسك!`)
        return
    }

    try {
        const groupMeta = m.groupMetadata
        const targetParticipant = findParticipantByNumber(groupMeta.participants, targetJid)
        
        if (!targetParticipant) {
            await m.reply(`❌ *فشل*\n\n> المستخدم غير موجود في المجموعة!`)
            return
        }
        
        if (targetParticipant.admin) {
            await m.reply(`❌ *فشل*\n\n> لا يمكن طرد مشرف المجموعة!`)
            return
        }
        
        await sock.groupParticipantsUpdate(m.chat, [targetParticipant.id], 'remove')

        await m.reply(`✅ @${targetNumber} تم طرده من المجموعة.`, { mentions: [targetJid] })

    } catch (error) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }