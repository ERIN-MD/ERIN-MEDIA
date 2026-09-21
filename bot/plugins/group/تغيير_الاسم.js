const pluginConfig = {
    name: 'تغيير_الاسم',
    alias: ['setnamegc'],
    category: 'group',
    description: 'تغيير اسم المجموعة',
    usage: '.تغيير_الاسم <اسم جديد>',
    example: '.تغيير_الاسم مجموعة رائعة',
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
    const newName = m.text?.trim()
    
    if (!newName) {
        await m.reply(
            `⚠️ *طريقة الاستخدام*\n\n` +
            `> \`${m.prefix}تغيير_الاسم اسم المجموعة الجديد\``
        )
        return
    }
    
    if (newName.length < 1 || newName.length > 100) {
        await m.reply(`⚠️ *خطأ*\n\n> اسم المجموعة يجب أن يكون بين 1-100 حرف.`)
        return
    }
    
    try {
        await sock.groupUpdateSubject(m.chat, newName)
        
        await m.reply(`✅ تم تغيير اسم المجموعة إلى *${newName}*`)
    } catch (error) {
        await m.reply(
            `❌ *فشل*\n\n` +
            `> لا يمكن تغيير اسم المجموعة.\n` +
            `> _${error.message}_`
        )
    }
}

export { pluginConfig as config, handler }