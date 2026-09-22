// قائمة المحظورين - أمر لعرض قائمة المستخدمين المحظورين

import config from '../../config.js'
import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'قائمة_المحظورين',
    alias: ['listban'],
    category: 'owner',
    description: 'عرض قائمة المستخدمين المحظورين',
    usage: '.قائمة_المحظورين',
    example: '.قائمة_المحظورين',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const bannedUsers = config.bannedUsers && config.bannedUsers.length > 0 ? config.bannedUsers : (db.setting('bannedUsers') || [])
    
    if (bannedUsers.length === 0) {
        return m.reply(`🚫 *قائمة المحظورين*\n\n> لا يوجد مستخدمين محظورين\n\n\`استخدم: ${m.prefix}حظر <الرقم>\``)
    }
    
    let caption = `🚫 *قائمة المحظورين*\n\n`
    caption += `╭┈┈⬡「 ⛔ *المستخدمين* 」\n`
    
    for (let i = 0; i < bannedUsers.length; i++) {
        caption += `┃ ${i + 1}. \`${bannedUsers[i]}\`\n`
    }
    
    caption += `╰┈┈⬡\n\n`
    caption += `> الإجمالي: \`${bannedUsers.length}\` مستخدم محظور`
    
    await m.reply(caption)
}

export { pluginConfig as config, handler }