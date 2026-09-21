// حذف بريميوم الكل - أمر لحذف جميع أعضاء المجموعة من البريميوم

import config from '../../config.js'
import { getDatabase } from '../../src/lib/maro-database.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'حذف_بريميوم_الكل',
    alias: ['delpremiumall', 'removepremall'],
    category: 'owner',
    description: 'حذف جميع أعضاء المجموعة من البريميوم',
    usage: '.حذف_بريميوم_الكل',
    example: '.حذف_بريميوم_الكل',
    isOwner: true,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        const groupMeta = m.groupMetadata
        const participants = groupMeta.participants || []
        
        if (participants.length === 0) {
            return m.reply(`❌ *فشل*\n\n> لا يوجد أعضاء في هذه المجموعة`)
        }
        
        await m.react('🕕')
        
        const db = getDatabase()
        if (!db.data.premium) db.data.premium = []
        
        let removedCount = 0
        let notPremCount = 0
        
        for (const participant of participants) {
            const number = participant.jid?.replace(/[^0-9]/g, '') || ''
            if (!number) continue
            
            const index = db.data?.premium.indexOf(number)
            
            if (index === -1) {
                notPremCount++
                continue
            }
            
            db.data.premium?.splice(index, 1)
            const jid = number + '@s.whatsapp.net'
            const user = db.getUser(jid)
            if (user) {
                user.isPremium = false
                db.setUser(jid, user)
            }
            
            removedCount++
        }
        
        db.save()
        
        await m.react('🗑️')
        
        await m.reply(
            `🗑️ *حذف البريميوم الكل*\n\n` +
            `╭┈┈⬡「 📋 *النتيجة* 」\n` +
            `┃ 👥 إجمالي الأعضاء: \`${participants.length}\`\n` +
            `┃ ✅ تم الحذف: \`${removedCount}\`\n` +
            `┃ ⏭️ ليس بريميوم: \`${notPremCount}\`\n` +
            `┃ 💎 متبقي بريميوم: \`${db.data.premium.length}\`\n` +
            `╰┈┈⬡\n\n` +
            `> المجموعة: ${groupMeta.subject}`
        )
        
    } catch (error) {
        await m.react('☢')
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }