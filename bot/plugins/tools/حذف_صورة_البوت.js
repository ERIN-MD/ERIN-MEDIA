// حذف_صورة_البوت - أمر لحذف صورة ملف تعريف البوت

const pluginConfig = {
    name: 'حذف_صورة_البوت',
    alias: ['delpp'],
    category: 'tools',
    description: 'حذف صورة ملف تعريف البوت',
    usage: '.حذف_صورة_البوت',
    example: '.حذف_صورة_البوت',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        const botJid = sock.user?.id
        if (!botJid) {
            await m.reply(`❌ معرف البوت غير موجود.`)
            return
        }
        
        await sock.removeProfilePicture(botJid)
        
        await m.reply(
            `✅ *تم حذف صورة البوت*\n\n` +
            `> تم حذف صورة ملف تعريف البوت بنجاح!`
        )
    } catch (error) {
        await m.reply(
            `❌ *فشل*\n\n` +
            `> لا يمكن حذف صورة البوت.\n` +
            `> _${error.message}_`
        )
    }
}

export { pluginConfig as config, handler }