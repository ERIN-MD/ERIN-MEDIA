import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'buyenergi',
    alias: ['belienergi'],
    category: 'user',
    description: 'شراء طاقة بالعملات (1 طاقة = 100 عملة)',
    usage: '.buyenergi <العدد>',
    example: '.buyenergi 10',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const PRICE_PER_ENERGI = 100

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const amount = parseInt(m.args[0]) || 0
    
    if (amount <= 0) {
        const user = db.getUser(m.sender) || db.setUser(m.sender)
        
        return m.reply(
            `🛒 *شراء الطاقة*\n\n` +
            `╭┈┈⬡「 💰 *المعلومات* 」\n` +
            `┃ 💵 السعر: *${PRICE_PER_ENERGI}* عملة/طاقة\n` +
            `┃ 💰 عملاتك: *${formatNumber(user.koin || 0)}*\n` +
            `╰┈┈⬡\n\n` +
            `> استخدم: \`.buyenergi <العدد>\`\n\n` +
            `\`مثال: ${m.prefix}buyenergi 10\``
        )
    }
    
    const totalPrice = amount * PRICE_PER_ENERGI
    const user = db.getUser(m.sender) || db.setUser(m.sender)
    
    if ((user.koin || 0) < totalPrice) {
        return m.reply(
            `❌ *فشل*\n\n` +
            `> العملات غير كافية!\n` +
            `> تحتاج: *${formatNumber(totalPrice)}*\n` +
            `> لديك: *${formatNumber(user.koin || 0)}*`
        )
    }
    
    db.updateKoin(m.sender, -totalPrice)
    
    if (user.energi === -1) {
        m.react('✅')
        return m.reply(
            `✅ *تم الشراء بنجاح*\n\n` +
            `> لكن لديك بالفعل طاقة غير محدودة!\n` +
            `> تم استرجاع العملات.`
        )
    }
    
    const newEnergi = db.updateEnergi(m.sender, amount)
    const newKoin = db.getUser(m.sender).koin
    
    m.react('✅')
    
    await m.reply(
        `✅ *تم الشراء بنجاح*\n\n` +
        `╭┈┈⬡「 📋 *التفاصيل* 」\n` +
        `┃ ⚡ الطاقة: *+${formatNumber(amount)}*\n` +
        `┃ 💵 السعر: *-${formatNumber(totalPrice)}* عملة\n` +
        `╰┈┈⬡\n\n` +
        `╭┈┈⬡「 💰 *الرصيد* 」\n` +
        `┃ ⚡ الطاقة: *${formatNumber(newEnergi)}*\n` +
        `┃ 💰 العملات: *${formatNumber(newKoin)}*\n` +
        `╰┈┈⬡`
    )
}

export { pluginConfig as config, handler }