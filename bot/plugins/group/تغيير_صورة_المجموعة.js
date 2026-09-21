const pluginConfig = {
    name: 'تغيير_صورة_المجموعة',
    alias: ['setppgc'],
    category: 'group',
    description: 'تغيير صورة عرض المجموعة',
    usage: '.تغيير_صورة_المجموعة (رد على صورة)',
    example: '.تغيير_صورة_المجموعة',
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
    let buffer = null
    if (m.quoted?.isImage) {
        try {
            buffer = await m.quoted.download()
        } catch (e) {
            await m.reply(`❌ فشل أخذ الصورة.`)
            return
        }
    } else if (m.isImage) {
        try {
            buffer = await m.download()
        } catch (e) {
            await m.reply(`❌ فشل أخذ الصورة.`)
            return
        }
    }
    if (!buffer) {
        await m.reply(
            `⚠️ *طريقة الاستخدام*\n\n` +
            `> رد على صورة + \`${m.prefix}تغيير_صورة_المجموعة\`\n` +
            `> أرسل صورة + تعليق \`${m.prefix}تغيير_صورة_المجموعة\``
        )
        return
    }
    try {
        await sock.updateProfilePicture(m.chat, buffer)
        await m.reply(`✅ تم تحديث صورة المجموعة!`)
    } catch (error) {
        await m.reply(
            `❌ فشل تغيير صورة المجموعة.\n` +
            `> _${error.message}_`
        )
    }
}

export { pluginConfig as config, handler }