import config from '../../config.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: ['حظر_رقم', 'block'],
    alias: [],
    category: 'owner',
    description: 'حظر رقم واتساب',
    usage: '.حظر_رقم <رقم/رد/منشن>',
    example: '.حظر_رقم 628xxx',
    isOwner: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    let targetJid = null

    if (m.mentionedJid?.length > 0) {
        targetJid = m.mentionedJid[0]
    } else if (m.quoted) {
        targetJid = m.quoted.sender || m.quoted.participant
    } else if (m.args[0]) {
        let num = m.args[0].replace(/[^0-9]/g, '')
        if (!num) return m.reply('❌ رقم غير صالح.')
        targetJid = num + '@s.whatsapp.net'
    } else if (!m.isGroup) {
        targetJid = m.chat
    }

    if (!targetJid) {
        return m.reply(
            '⚠️ *طريقة الاستخدام*\n\n' +
            '> `.حظر_رقم 628xxx` — حظر عبر الرقم\n' +
            '> `.حظر_رقم` (رد على رسالة) — حظر المرسل\n' +
            '> `.حظر_رقم @منشن` — حظر المطلوب منشن\n' +
            '> `.حظر_رقم` (في الخاص) — حظر هذا المستخدم'
        )
    }

    const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
    if (targetJid === botJid) {
        return m.reply('❌ لا يمكن حظر رقم البوت نفسه.')
    }

    try {
        await sock.updateBlockStatus(targetJid, 'block')
        await m.react('🚫')
        return m.reply(
            `🚫 *تم حظر الرقم*\n\n` +
            `> الهدف: @${targetJid.split('@')[0]}\n` +
            `> استخدم \`.فك_حظر\` لإلغاء الحظر`,
            { mentions: [targetJid] }
        )
    } catch (err) {
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }