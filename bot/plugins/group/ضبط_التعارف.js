import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'ضبط_التعارف',
    alias: ['setintro'],
    category: 'group',
    description: 'تعيين رسالة التعارف للمجموعة (للمشرفين فقط)',
    usage: '.ضبط_التعارف <رسالة>',
    example: '.ضبط_التعارف أهلاً @user في مجموعة @group!',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true,
    isAdmin: true
}

async function handler(m) {
    const db = getDatabase()
    const introText = m.fullArgs?.trim() || m.text?.trim()
    
    if (!introText) {
        return m.reply(
            `📝 *ضبط التعارف*\n\n` +
            `> أدخل رسالة التعارف!\n\n` +
            `*المتغيرات المتاحة:*\n` +
            `> @user - اسم المستخدم\n` +
            `> @group - اسم المجموعة\n` +
            `> @count - عدد الأعضاء\n` +
            `> @date - تاريخ اليوم\n` +
            `> @time - الوقت الحالي\n` +
            `> @desc - وصف المجموعة\n` +
            `> @botname - اسم البوت\n\n` +
            `*مثال:*\n` +
            `> .ضبط_التعارف أهلاً @user في مجموعة @group! 👋`
        )
    }
    
    const groupData = db.getGroup(m.chat) || db.setGroup(m.chat)
    groupData.intro = introText
    db.setGroup(m.chat, groupData)
    db.save()
    
    await m.reply(
        `✅ *تم حفظ التعارف!*\n` +
        `تم تغيير رسالة التعارف.\n` +
        `اكتب *${m.prefix}تعارف* للاطلاع على النتيجة.`
    )
}

export { pluginConfig as config, handler }