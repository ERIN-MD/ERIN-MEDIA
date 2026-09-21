import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: ['تحميل_تلقائي', 'تنزيل_تلقائي'],
    alias: ['autodl'],
    category: 'group',
    description: 'تفعيل/تعطيل التحميل التلقائي لروابط التواصل الاجتماعي',
    usage: '.تحميل_تلقائي تشغيل/إيقاف',
    example: '.تحميل_تلقائي تشغيل',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    isBotAdmin: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args[0]?.toLowerCase()
    
    const groupData = db.getGroup(m.chat)
    const current = groupData?.autodl || false
    
    if (!args || args === 'حالة') {
        return m.reply(
            `🔗 *التحميل التلقائي*\n\n` +
            `> الحالة: ${current ? '✅ مفعل' : '❌ معطل'}\n\n` +
            `*المنصات المدعومة:*\n` +
            `> تيك توك، انستغرام، فيسبوك\n` +
            `> يوتيوب، تويتر/X\n` +
            `> تيليغرام، ديسكورد\n\n` +
            `*الاستخدام:*\n` +
            `> \`${m.prefix}تحميل_تلقائي تشغيل\` - تفعيل\n` +
            `> \`${m.prefix}تحميل_تلقائي إيقاف\` - تعطيل`
        )
    }
    
    if (args === 'تشغيل' || args === 'on') {
        db.setGroup(m.chat, { ...groupData, autodl: true })
        m.react('✅')
        return m.reply(
            `✅ *تم تفعيل التحميل التلقائي*\n\n` +
            `> أرسل رابط وسائل التواصل وسيقوم البوت بالتحميل تلقائياً!\n` +
            `> يدعم: تيك توك، انستغرام، فيسبوك، يوتيوب، تويتر/X`
        )
    }
    
    if (args === 'ايقاف' || args === 'off') {
        db.setGroup(m.chat, { ...groupData, autodl: false })
        m.react('❌')
        return m.reply(`❌ *تم تعطيل التحميل التلقائي*`)
    }
    
    return m.reply(`❌ *خيار غير صالح*\n\n> استخدم: \`تشغيل\` أو \`إيقاف\``)
}

export { pluginConfig as config, handler }