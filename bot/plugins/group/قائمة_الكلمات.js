import { getDatabase } from '../../src/lib/maro-database.js'
import { DEFAULT_TOXIC_WORDS } from './منع_الكلمات.js'
const pluginConfig = {
    name: 'قائمة_الكلمات',
    alias: ['listtoxic'],
    category: 'group',
    description: 'عرض قائمة الكلمات الممنوعة',
    usage: '.قائمة_الكلمات',
    example: '.قائمة_الكلمات',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const groupData = db.getGroup(m.chat) || {}
    
    const customWords = groupData.toxicWords || []
    const defaultWords = DEFAULT_TOXIC_WORDS || []
    
    let text = `📋 *قائمة الكلمات الممنوعة*\n\n`
    
    if (customWords.length > 0) {
        text += `╭┈┈⬡「 ✏️ *مخصصة* (${customWords.length}) 」\n`
        for (let i = 0; i < customWords.length; i++) {
            text += `┃ ${i + 1}. ${customWords[i]}\n`
        }
        text += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    }
    
    text += `╭┈┈⬡「 📦 *افتراضية* (${defaultWords.length}) 」\n`
    
    for (let i = 0; i < defaultWords.length; i++) {
        text += `┃ ${i + 1}. ${defaultWords[i]}\n`
    }
    text += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    
    text += `المجموع: *${customWords.length + defaultWords.length}* كلمة\n`
    text += `\`.اضافة_كلمة <كلمة>\` للإضافة\n`
    text += `\`.حذف_كلمة <كلمة>\` للحذف`
    
    await m.reply(text)
}

export { pluginConfig as config, handler }