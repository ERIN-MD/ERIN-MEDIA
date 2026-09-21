import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'قائمة_المنع',
    alias: ['listantilink'],
    category: 'group',
    description: 'عرض قائمة الروابط المحظورة',
    usage: '.قائمة_المنع',
    example: '.قائمة_المنع',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const DEFAULT_BLOCKED_LINKS = [
    'chat.whatsapp.com',
    'wa.me',
    'bit.ly',
    't.me',
    'telegram.me',
    'discord.gg',
    'discord.com/invite'
]

function handler(m) {
    const db = getDatabase()
    const groupData = db.getGroup(m.chat) || {}
    const customList = groupData.antilinkList || []
    
    let txt = `🔗 *قائمة منع الروابط*\n\n`
    
    txt += `╭┈┈⬡「 📌 *الافتراضية* 」\n`
    DEFAULT_BLOCKED_LINKS.forEach((l, i) => {
        txt += `┃ ${i + 1}. \`${l}\`\n`
    })
    txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    
    if (customList.length > 0) {
        txt += `╭┈┈⬡「 ➕ *مخصصة* 」\n`
        customList.forEach((l, i) => {
            txt += `┃ ${i + 1}. \`${l}\`\n`
        })
        txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    }
    
    txt += `> الافتراضية: *${DEFAULT_BLOCKED_LINKS.length}* رابط\n`
    txt += `> المخصصة: *${customList.length}* رابط\n\n`
    txt += `\`${m.prefix}اضافة_رابط <رابط>\` للإضافة\n`
    txt += `\`${m.prefix}حذف_رابط <رابط>\` للحذف`
    
    m.reply(txt)
}

export { pluginConfig as config, handler, DEFAULT_BLOCKED_LINKS }