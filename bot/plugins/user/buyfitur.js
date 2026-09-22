import { getDatabase } from '../../src/lib/maro-database.js'
import config from '../../config.js'

const pluginConfig = {
    name: 'buyfitur',
    alias: ['belifitur'],
    category: 'user',
    description: 'شراء ميزة مميزة (1 ميزة = 3000 عملة)',
    usage: '.buyfitur [اسم_الميزة]',
    example: '.buyfitur',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const PRICE_PER_FEATURE = 3000

const PREMIUM_FEATURES = [
    { id: 'sticker', name: 'ملصقات غير محدودة', desc: 'أوامر ملصقات غير محدودة' },
    { id: 'downloader', name: 'تحميل احترافي', desc: 'تحميل بدون حدود' },
    { id: 'ai', name: 'الذكاء الاصطناعي', desc: 'الوصول إلى ميزات الذكاء الاصطناعي المميزة' },
    { id: 'tools', name: 'أدوات متقدمة', desc: 'أدوات حصرية' },
    { id: 'game', name: 'مكافآت الألعاب', desc: 'ضعف مكافآت الألعاب' }
]

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender) || db.setUser(m.sender)
    const featureName = m.args[0]?.toLowerCase()
    
    if (user.isPremium || config.isPremium(m.sender)) {
        return m.reply(
            `✨ *مستخدم مميز*\n\n` +
            `> أنت بالفعل مشترك مميز!\n` +
            `> جميع الميزات مفتوحة!`
        )
    }
    
    if (!featureName) {
        const unlockedFeatures = user.unlockedFeatures || []
        
        let text = `╭━━━━━━━━━━━━━━━━━╮\n`
        text += `┃  🛒 *شراء الميزات*\n`
        text += `╰━━━━━━━━━━━━━━━━━╯\n\n`
        
        text += `> السعر: *${formatNumber(PRICE_PER_FEATURE)}* عملة/ميزة\n`
        text += `> عملاتك: *${formatNumber(user.koin || 0)}*\n\n`
        
        text += `╭┈┈⬡「 📋 *الميزات* 」\n`
        
        for (const feature of PREMIUM_FEATURES) {
            const isUnlocked = unlockedFeatures.includes(feature.id)
            const status = isUnlocked ? '✅' : '🔒'
            text += `┃ ${status} *${feature.name}*\n`
            text += `┃    _${feature.desc}_\n`
            text += `┃    المعرف: \`${feature.id}\`\n`
            text += `┃\n`
        }
        
        text += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        text += `> استخدم: \`.buyfitur <المعرف>\`\n`
        text += `> أو اشترك *مميز* لفتح الكل!`
        
        await m.reply(text)
        return
    }
    
    const feature = PREMIUM_FEATURES.find(f => f.id === featureName)
    
    if (!feature) {
        return m.reply(
            `❌ *فشل*\n\n` +
            `> الميزة \`${featureName}\` غير موجودة\n` +
            `> اكتب \`.buyfitur\` لعرض القائمة`
        )
    }
    
    const unlockedFeatures = user.unlockedFeatures || []
    
    if (unlockedFeatures.includes(feature.id)) {
        return m.reply(`❌ *فشل*\n\n> الميزة \`${feature.name}\` مفتوحة بالفعل!`)
    }
    
    if ((user.koin || 0) < PRICE_PER_FEATURE) {
        return m.reply(
            `❌ *فشل*\n\n` +
            `> العملات غير كافية!\n` +
            `> تحتاج: *${formatNumber(PRICE_PER_FEATURE)}*\n` +
            `> لديك: *${formatNumber(user.koin || 0)}*`
        )
    }
    
    db.updateKoin(m.sender, -PRICE_PER_FEATURE)
    unlockedFeatures.push(feature.id)
    db.setUser(m.sender, { unlockedFeatures })
    
    const newKoin = db.getUser(m.sender).koin
    
    m.react('✅')
    
    await m.reply(
        `✅ *تم فتح الميزة*\n\n` +
        `╭┈┈⬡「 📋 *التفاصيل* 」\n` +
        `┃ 🎁 الميزة: *${feature.name}*\n` +
        `┃ 💵 السعر: *-${formatNumber(PRICE_PER_FEATURE)}* عملة\n` +
        `┃ 💰 المتبقي: *${formatNumber(newKoin)}*\n` +
        `╰┈┈⬡\n\n` +
        `> _${feature.desc}_\n\n` +
        `> 💡 نصيحة: اشترك *مميز* لفتح الكل!`
    )
}

export { pluginConfig as config, handler, PREMIUM_FEATURES }