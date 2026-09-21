const pluginConfig = {
    name: 'تغيير_الوصف',
    alias: ['setdeskgc'],
    category: 'group',
    description: 'تغيير وصف المجموعة',
    usage: '.تغيير_الوصف <وصف جديد>',
    example: '.تغيير_الوصف مجموعة للنقاش',
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
    const newDesc = m.text?.trim() || ''
    if (!m.text && m.args?.length === 0) {
        await m.reply(
            `⚠️ *طريقة الاستخدام*\n\n` +
            `> \`${m.prefix}تغيير_الوصف وصف جديد\`\n` +
            `> \`${m.prefix}تغيير_الوصف مسح\` - حذف الوصف`
        )
        return
    }
    const descToSet = newDesc.toLowerCase() === 'مسح' ? '' : newDesc
    
    if (descToSet.length > 2048) {
        await m.reply(`⚠️ *خطأ*\n\n> الوصف الأقصى 2048 حرف.`)
        return
    }
    
    try {
        await sock.groupUpdateDescription(m.chat, descToSet)
        
        if (descToSet) {
            await m.reply(`✅ تم تحديث وصف المجموعة!`)
        } else {
            await m.reply(`✅ تم حذف وصف المجموعة!`)
        }
    } catch (error) {
        await m.reply(
            `❌ *فشل*\n\n` +
            `> لا يمكن تغيير وصف المجموعة.\n` +
            `> _${error.message}_`
        )
    }
}

export { pluginConfig as config, handler }