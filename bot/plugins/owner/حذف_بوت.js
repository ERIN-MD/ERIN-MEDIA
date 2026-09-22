// حذف بوت - أمر لإيقاف وحذف جلسة البوت الفرعي لمستخدم بشكل دائم

import { stopJadibot, getAllJadibotSessions } from '../../src/lib/maro-jadibot-manager.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'حذف_بوت',
    alias: ['stopdandeletejadibot'],
    category: 'owner',
    description: 'إيقاف وحذف جلسة البوت الفرعي لمستخدم بشكل دائم',
    usage: '.حذف_بوت @مستخدم',
    example: '.حذف_بوت @628xxx',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    let target = null

    if (m.quoted) {
        target = m.quoted.sender
    } else if (m.mentionedJid?.[0]) {
        target = m.mentionedJid[0]
    } else if (m.text?.trim()) {
        const num = m.text.trim().replace(/[^0-9]/g, '')
        if (num) target = num + '@s.whatsapp.net'
    }

    if (!target) {
        const sessions = getAllJadibotSessions()

        if (sessions.length === 0) {
            return m.reply(`❌ لا توجد جلسات بوتات فرعية محفوظة`)
        }

        let txt = `🗑️ *حذف بوت*\n\n`
        txt += `اختر الهدف بالإشارة أو الرد:\n\n`

        sessions.forEach((s, i) => {
            const status = s.isActive ? '🟢' : '⚫'
            txt += `${status} *${i + 1}.* @${s.id}\n`
        })

        txt += `\n> مثال: \`${m.prefix}حذف_بوت @628xxx\``

        return sock.sendMessage(m.chat, {
            text: txt,
            mentions: sessions.map(s => s.jid)
        }, { quoted: m })
    }

    const id = target.replace(/@.+/g, '')
    const sessions = getAllJadibotSessions()
    const session = sessions.find(s => s.id === id)

    if (!session) {
        return m.reply(`❌ جلسة البوت لـ *@${id}* غير موجودة`, { mentions: [target] })
    }

    await m.react('🕕')

    try {
        await stopJadibot(target, true)

        await m.react('✅')

        await sock.sendMessage(m.chat, {
            text: `🗑️ *تم حذف البوت*\n\n` +
                `> 📱 الرقم: *@${id}*\n` +
                `> 🗑️ الحالة: *محذوف*\n\n` +
                `تم حذف الجلسة بشكل دائم.\n` +
                `يحتاج المستخدم إلى كتابة \`.جاديبوت\` مرة أخرى لإنشاء جلسة جديدة.`,
            mentions: [target]
        }, { quoted: m })
    } catch (error) {
        await m.react('☢')
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }