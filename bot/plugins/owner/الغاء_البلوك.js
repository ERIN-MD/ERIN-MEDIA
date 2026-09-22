// الغاء البلوك - أمر لإلغاء حظر رقم واتساب

import config from '../../config.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: ['الغاء_البلوك'],
    alias: ['unblock'],
    category: 'owner',
    description: 'إلغاء حظر رقم واتساب',
    usage: '.الغاء_البلوك <الرقم/رد/إشارة>',
    example: '.الغاء_البلوك 628xxx',
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
        if (!num) return m.reply('❌ الرقم غير صالح.')
        targetJid = num + '@s.whatsapp.net'
    } else if (!m.isGroup) {
        targetJid = m.chat
    }

    if (!targetJid) {
        return m.reply(
            '⚠️ *طريقة الاستخدام*\n\n' +
            '> `.الغاء_البلوك 628xxx` — إلغاء حظر عبر الرقم\n' +
            '> `.الغاء_البلوك` (رد على رسالة) — إلغاء حظر المرسل\n' +
            '> `.الغاء_البلوك @إشارة` — إلغاء حظر المُشار إليه\n' +
            '> `.الغاء_البلوك` (في المحادثة الخاصة) — إلغاء حظر هذا المستخدم'
        )
    }

    try {
        await sock.updateBlockStatus(targetJid, 'unblock')
        await m.react('✅')
        return m.reply(
            `✅ *تم إلغاء حظر الرقم*\n\n` +
            `> الهدف: @${targetJid.split('@')[0]}`,
            { mentions: [targetJid] }
        )
    } catch (err) {
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }