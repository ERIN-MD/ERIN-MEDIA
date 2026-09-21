const pluginConfig = {
    name: 'حذف_صورة_المجموعة',
    alias: ['delppgc'],
    category: 'group',
    description: 'حذف صورة عرض المجموعة',
    usage: '.حذف_صورة_المجموعة',
    example: '.حذف_صورة_المجموعة',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    isBotAdmin: true,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        await sock.removeProfilePicture(m.chat)
        
        await m.reply(`✅ تم حذف صورة المجموعة بنجاح`)
    } catch (error) {
        await m.reply(
            `❌ *فشل*\n\n` +
            `> لا يمكن حذف صورة المجموعة.\n` +
            `> _${error.message}_`
        )
    }
}

export { pluginConfig as config, handler }