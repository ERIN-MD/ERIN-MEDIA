// قائمة البوتات النشطة - أمر لعرض الجاديبوت النشط مع التفاصيل

import { getActiveJadibots } from '../../src/lib/maro-jadibot-manager.js'

const pluginConfig = {
    name: 'قائمة_البوتات_النشطة',
    alias: ['listjadibotaktif'],
    category: 'owner',
    description: 'عرض الجاديبوت النشط مع التفاصيل',
    usage: '.قائمة_البوتات_النشطة',
    example: '.قائمة_البوتات_النشطة',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) return `${hours}س ${minutes % 60}د`
    if (minutes > 0) return `${minutes}د ${seconds % 60}ث`
    return `${seconds}ث`
}

async function handler(m, { sock }) {
    const active = getActiveJadibots()

    if (active.length === 0) {
        return m.reply(`❌ لا يوجد بوتات نشطة حالياً`)
    }

    let txt = `🟢 *البوتات النشطة*\n\n`
    txt += `> 📊 الإجمالي: *${active.length}* بوت نشط\n\n`

    active.forEach((s, i) => {
        const uptime = formatUptime(Date.now() - s.startedAt)
        const owner = s.ownerJid?.split('@')[0] || 'غير معروف'
        txt += `*${i + 1}.* 🟢 @${s.id}\n`
        txt += `   ⏱️ *${uptime}* — 👤 @${owner}\n\n`
    })

    txt += `> \`${m.prefix}إيقاف_كل_البوتات\` — إيقاف الكل`

    const mentions = active.flatMap(s => [s.jid, s.ownerJid].filter(Boolean))

    await sock.sendMessage(m.chat, {
        text: txt,
        mentions,
        interactiveButtons: [
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