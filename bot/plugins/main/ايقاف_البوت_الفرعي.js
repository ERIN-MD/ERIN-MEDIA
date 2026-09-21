import { stopJadibot, isJadibotActive, getJadibotStatus } from '../../src/lib/maro-jadibot-manager.js'

const pluginConfig = {
    name: 'ايقاف_البوت_الفرعي',
    alias: ['stopjadibot'],
    category: 'main',
    description: 'إيقاف جلسة البوت الفرعي الخاصة بك',
    usage: '.ايقاف_البوت_الفرعي',
    example: '.ايقاف_البوت_الفرعي',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
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
    const sender = m.sender
    if (!sender) return m.reply('❌ فشل في التعرف على رقمك')

    if (!isJadibotActive(sender)) {
        return m.reply(
            `❌ *أنت لست بوت فرعي*\n\n` +
            `> اكتب \`${m.prefix}تنصيب\` لتصبح بوت`
        )
    }

    const status = getJadibotStatus(sender)
    const uptime = status ? formatUptime(Date.now() - status.startedAt) : '-'

    await m.react('🕕')

    try {
        await stopJadibot(sender, false)
        await m.react('✅')

        await m.reply(
            `🛑 *تم إيقاف البوت الفرعي*\n\n` +
            `> 📱 الرقم: *@${sender.split('@')[0]}*\n` +
            `> ⏱️ مدة التشغيل: *${uptime}*\n` +
            `> 💾 الجلسة: *محفوظة*\n\n` +
            `اكتب \`${m.prefix}تنصيب\` لإعادة التفعيل.`,
            { mentions: [sender] }
        )
    } catch (e) {
        await m.react('☢')
        await m.reply(`❌ فشل في إيقاف البوت الفرعي: ${e.message}`)
    }
}

export { pluginConfig as config, handler }