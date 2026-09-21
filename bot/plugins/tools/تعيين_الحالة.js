const pluginConfig = {
    name: 'تعيين_الحالة',
    alias: ['setbio'],
    category: 'tools',
    description: 'تغيير حالة/نبذة البوت',
    usage: '.تعيين_الحالة <الحالة الجديدة>',
    example: '.تعيين_الحالة بوت واتساب',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const newBio = m.text?.trim()
    
    if (!newBio && m.args?.length === 0) {
        await m.reply(
            `⚠️ *طريقة الاستخدام*\n\n` +
            `> \`${m.prefix}تعيين_الحالة حالة البوت الجديدة\`\n` +
            `> \`${m.prefix}تعيين_الحالة clear\` - حذف الحالة`
        )
        return
    }
    
    const bioToSet = newBio?.toLowerCase() === 'clear' ? '' : (newBio || '')
    
    if (bioToSet.length > 139) {
        await m.reply(
            `⚠️ *تحقق*\n\n` +
            `> الحد الأقصى للحالة هو 139 حرفاً.`
        )
        return
    }
    
    try {
        await sock.updateProfileStatus(bioToSet)
        
        if (bioToSet) {
            await m.reply(
                `✅ *تم تغيير حالة البوت*\n\n` +
                `> حالة البوت الآن:\n` +
                `> _${bioToSet}_`
            )
        } else {
            await m.reply(
                `✅ *تم حذف حالة البوت*\n\n` +
                `> تم حذف حالة البوت بنجاح!`
            )
        }
    } catch (error) {
        await m.reply(
            `❌ *فشل*\n\n` +
            `> لا يمكن تغيير حالة البوت.\n` +
            `> _${error.message}_`
        )
    }
}

export { pluginConfig as config, handler }