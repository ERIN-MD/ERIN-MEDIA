// إيقاف البوتات - أمر لإيقاف جميع الجاديبوت النشطة

import { stopAllJadibots, getActiveJadibots } from '../../src/lib/maro-jadibot-manager.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'إيقاف_البوتات',
    alias: ['stopalljadibot'],
    category: 'owner',
    description: 'إيقاف جميع الجاديبوت النشطة',
    usage: '.إيقاف_البوتات',
    example: '.إيقاف_البوتات',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const active = getActiveJadibots()

    if (active.length === 0) {
        return m.reply(`❌ لا توجد بوتات نشطة`)
    }

    await m.react('🕕')

    try {
        const stopped = await stopAllJadibots()

        await m.react('✅')

        const names = stopped.map(id => `@${id}`).join(', ')

        await sock.sendMessage(m.chat, {
            text: `🛑 *تم إيقاف جميع البوتات*\n\n` +
                `> 📊 الإجمالي: *${stopped.length}* بوت\n` +
                `> 💾 الجلسات: *محفوظة*\n\n` +
                `تم الإيقاف: ${names}\n\n` +
                `> جميع الجلسات محفوظة ويمكن إعادة تشغيلها لاحقاً.`,
            mentions: stopped.map(id => id + '@s.whatsapp.net')
        }, { quoted: m })
    } catch (error) {
        await m.react('☢')
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }