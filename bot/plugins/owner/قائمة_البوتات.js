// قائمة البوتات - أمر لعرض جميع جلسات الجاديبوت المحفوظة

import { getAllJadibotSessions, getActiveJadibots } from '../../src/lib/maro-jadibot-manager.js'

const pluginConfig = {
    name: 'قائمة_البوتات',
    alias: ['listjadibot'],
    category: 'owner',
    description: 'عرض جميع جلسات الجاديبوت المحفوظة',
    usage: '.قائمة_البوتات',
    example: '.قائمة_البوتات',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const sessions = getAllJadibotSessions()
    const active = getActiveJadibots()

    if (sessions.length === 0) {
        return m.reply(`❌ لا توجد جلسات جاديبوت محفوظة`)
    }

    let txt = `🤖 *قائمة البوتات*\n\n`
    txt += `> 📊 الإجمالي: *${sessions.length}* جلسة\n`
    txt += `> 🟢 نشط: *${active.length}*\n`
    txt += `> ⚫ غير متصل: *${sessions.length - active.length}*\n\n`

    sessions.forEach((s, i) => {
        const status = s.isActive ? '🟢' : '⚫'
        const label = s.isActive ? 'متصل' : 'غير متصل'
        txt += `${status} *${i + 1}.* @${s.id} — _${label}_\n`
    })

    txt += `\n> \`${m.prefix}قائمة_البوتات_النشطة\` — تفاصيل النشط\n`
    txt += `> \`${m.prefix}إيقاف_كل_البوتات\` — إيقاف الكل\n`
    txt += `> \`${m.prefix}إيقاف_وحذف_بوت @user\` — حذف الجلسة`

    const mentions = sessions.map(s => s.jid)

    await sock.sendMessage(m.chat, {
        text: txt,
        mentions,
        interactiveButtons: [
            {
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    display_text: '🟢 عرض النشط',
                    id: `${m.prefix}قائمة_البوتات_النشطة`
                })
            },
            {
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    display_text: '🛑 إيقاف الكل',
                    id: `${m.prefix}إيقاف_كل_البوتات`
                })
            }
        ]
    }, { quoted: m })
}

export { pluginConfig as config, handler }