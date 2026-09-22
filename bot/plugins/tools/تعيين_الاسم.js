const pluginConfig = {
    name: 'تعيين_الاسم',
    alias: ['setname'],
    category: 'tools',
    description: 'تغيير اسم ملف تعريف البوت',
    usage: '.تعيين_الاسم <الاسم الجديد>',
    example: '.تعيين_الاسم Maro-AI',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const newName = m.text?.trim()
    
    if (!newName) {
        await m.reply(
            `⚠️ *طريقة الاستخدام*\n\n` +
            `> \`${m.prefix}تعيين_الاسم اسم البوت الجديد\``
        )
        return
    }
    
    if (newName.length < 1 || newName.length > 25) {
        await m.reply(
            `⚠️ *تحقق*\n\n` +
            `> يجب أن يكون اسم البوت بين 1-25 حرفاً.`
        )
        return
    }
    
    try {
        await sock.updateProfileName(newName)
        
        await m.reply(
            `✅ *تم تغيير اسم البوت*\n\n` +
            `> اسم البوت الآن: *${newName}*`
        )
    } catch (error) {
        await m.reply(
            `❌ *فشل*\n\n` +
            `> لا يمكن تغيير اسم البوت.\n` +
            `> _${error.message}_`
        )
    }
}

export { pluginConfig as config, handler }