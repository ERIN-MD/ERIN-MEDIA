import config from '../../config.js'
import { getDatabase } from '../../src/lib/maro-database.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'اضف_بريميوم_للجميع',
    alias: ['addpremall'],
    category: 'owner',
    description: 'إضافة جميع أعضاء المجموعة إلى البريميوم',
    usage: '.اضف_بريميوم_للجميع',
    example: '.اضف_بريميوم_للجميع',
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
        
        let addedCount = 0
        let alreadyPremCount = 0
        
        for (const participant of participants) {
            const number = participant.jid?.replace(/[^0-9]/g, '') || ''
            
            if (!number) continue
            
            if (db.data.premium.includes(number)) {
                alreadyPremCount++
                continue
            }  
            db.data.premium.push(number)
            
            const jid = number + '@s.whatsapp.net'
            const premLimit = config.limits?.premium || 100
            const user = db.getUser(jid) || db.setUser(jid)
            
            user.energi = premLimit
            user.isPremium = true
            
            db.setUser(jid, user)
            db.updateExp(jid, 200000)
            db.updateKoin(jid, 20000)
            addedCount++
        }
        
        db.save()
        
        await m.react('💎')
        await m.reply(
            `💎 *إضافة بريميوم للجميع*\n\n` +
            `╭┈┈⬡「 📋 *النتيجة* 」\n` +
            `┃ 👥 إجمالي الأعضاء: \`${participants.length}\`\n` +
            `┃ ✅ تمت الإضافة: \`${addedCount}\`\n` +
            `┃ ⏭️ بريميوم سابقاً: \`${alreadyPremCount}\`\n` +
            `┃ 💎 إجمالي البريميوم: \`${db.data.premium.length}\`\n` +
            `╰┈┈⬡\n\n` +
            `> المجموعة: ${groupMeta.subject}`
        )
        
    } catch (error) {
        await m.react('☢')
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }