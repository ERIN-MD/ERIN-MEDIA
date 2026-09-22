const pluginConfig = {
    name: 'تعيين_الصورة',
    alias: ['setpp'],
    category: 'tools',
    description: 'تغيير صورة ملف تعريف البوت',
    usage: '.تعيين_الصورة (رد على صورة)',
    example: '.تعيين_الصورة',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
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
            await m.reply(`❌ فشل تحميل الصورة.`)
            return
        }
    } else if (m.isImage) {
        try {
            buffer = await m.download()
        } catch (e) {
            await m.reply(`❌ فشل تحميل الصورة.`)
            return
        }
    }
    if (!buffer) {
        await m.reply(
            `⚠️ *طريقة الاستخدام*\n\n` +
            `> رد على صورة + \`${m.prefix}تعيين_الصورة\`\n` +
            `> أرسل صورة مع الأمر \`${m.prefix}تعيين_الصورة\``
        )
        return
    }
    
    try {
        const botJid = sock.user?.id
        if (!botJid) {
            await m.reply(`❌ معرف البوت غير موجود.`)
            return
        }
        
        await sock.updateProfilePicture(botJid, buffer)
        
        await m.reply(
            `✅ *تم تغيير صورة البوت*\n\n` +
            `> تم تحديث صورة ملف تعريف البوت بنجاح!`
        )
    } catch (error) {
        await m.reply(
            `❌ *فشل*\n\n` +
            `> لا يمكن تغيير صورة البوت.\n` +
            `> _${error.message}_`
        )
    }
}

export { pluginConfig as config, handler }