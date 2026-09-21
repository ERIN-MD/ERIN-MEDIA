import { startJadibot, isJadibotActive } from '../../src/lib/maro-jadibot-manager.js'

const pluginConfig = {
    name: 'تنصيب',
    alias: ['jadibot'],
    category: 'main',
    description: 'حول رقمك إلى بوت (رمز الاقتران)',
    usage: '.تنصيب',
    example: '.تنصيب',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: true,
    cooldown: 30,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const sender = m.sender
    if (!sender) return m.reply('❌ فشل في التعرف على رقمك')

    if (isJadibotActive(sender)) {
        return m.reply(
            `⚠️ *البوت الفرعي نشط بالفعل*\n\n` +
            `> رقمك يعمل كبوت بالفعل\n` +
            `> اكتب \`${m.prefix}ايقاف-بوت-فرعي\` للإيقاف`
        )
    }

    try {
        // ✨ startJadibot يرسل صورة + كود + زر نسخ تلقائياً
        await startJadibot(sock, m, sender, true)
    } catch (e) {
        await m.reply(`❌ *فشل*\n> ${e.message}`)
    }
}

export { pluginConfig as config, handler }