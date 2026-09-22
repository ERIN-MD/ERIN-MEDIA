import { getDatabase } from '../../src/lib/maro-database.js'
import te from '../../src/lib/maro-error.js'
const pluginConfig = {
    name: 'حظر_المجموعة',
    alias: ['banchat'],
    category: 'group',
    description: 'حظر المجموعة من استخدام البوت (للمالك فقط)',
    usage: '.حظر_المجموعة',
    example: '.حظر_المجموعة',
    isOwner: true,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const cmd = m.command.toLowerCase()
    const isUnban = ['الغاء_الحظر', 'unbanchat', 'unbangroup'].includes(cmd)
    
    try {
        const groupMeta = m.groupMetadata
        const groupName = groupMeta.subject || 'غير معروف'
        const groupData = db.getGroup(m.chat) || {}
        
        if (isUnban) {
            if (!groupData.isBanned) {
                return m.reply(
                    `⚠️ *المجموعة غير محظورة*\n\n` +
                    `> هذه المجموعة ليست محظورة.\n` +
                    `> يمكن للجميع استخدام البوت.`
                )
            }
            
            db.setGroup(m.chat, { ...groupData, isBanned: false })
            
            return sock.sendMessage(m.chat, {
                text: `✅ *تم إلغاء حظر المجموعة*\n\n` +
                    `╭┈┈⬡「 📋 *تفاصيل* 」\n` +
                    `┃ 📛 المجموعة: *${groupName}*\n` +
                    `┃ 📊 الحالة: *✅ مفعلة*\n` +
                    `┃ 👤 بواسطة: @${m.sender.split('@')[0]}\n` +
                    `╰┈┈⬡\n\n` +
                    `> يمكن لجميع الأعضاء استخدام البوت الآن.`,
                mentions: [m.sender]
            }, { quoted: m })
        }
        
        if (groupData.isBanned) {
            return m.reply(
                `⚠️ *المجموعة محظورة بالفعل*\n\n` +
                `> هذه المجموعة محظورة مسبقاً.\n` +
                `> استخدم \`.الغاء_الحظر\` لإلغاء الحظر.`
            )
        }
        
        db.setGroup(m.chat, { ...groupData, isBanned: true })
        
        await m.reply(`🚫 *تم حظر المجموعة*\n\n` +
                `╭┈┈⬡「 📋 *تفاصيل* 」\n` +
                `┃ 📛 المجموعة: *${groupName}*\n` +
                `┃ 📊 الحالة: *🔴 محظورة*\n` +
                `┃ 👤 بواسطة: @${m.sender.split('@')[0]}\n` +
                `╰┈┈⬡\n\n` +
                `> لا يمكن للأعضاء العاديين استخدام البوت.\n` +
                `> فقط المالك يمكنه استخدام البوت.`, {  mentions: [m.sender] })
        
    } catch (error) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }