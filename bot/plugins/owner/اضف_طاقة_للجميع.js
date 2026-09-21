import config from '../../config.js'
import { getDatabase } from '../../src/lib/maro-database.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'اضف_طاقة_للجميع',
    alias: ['addenergiall'],
    category: 'owner',
    description: 'إضافة طاقة لجميع أعضاء المجموعة',
    usage: '.اضف_طاقة_للجميع <الكمية>',
    example: '.اضف_طاقة_للجميع 50',
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
        const amount = parseInt(m.args[0])
        
        if (isNaN(amount) || amount <= 0) {
            return m.reply(`⚠️ *طريقة الاستخدام*\n\n> أدخل كمية الطاقة المراد إضافتها.\n\n\`مثال: ${m.prefix}اضف_طاقة_للجميع 50\``)
        }
        
        const groupMeta = m.groupMetadata
        const participants = groupMeta.participants || []
        
        if (participants.length === 0) {
            return m.reply(`❌ *فشل*\n\n> لا يوجد أعضاء في هذه المجموعة`)
        }
        
        await m.react('🕕')
        const db = getDatabase()
        let successCount = 0
        
        for (const participant of participants) {
            const number = participant.jid?.replace(/[^0-9]/g, '') || ''
            if (!number) continue
            const jid = number + '@s.whatsapp.net'
            db.updateEnergi(jid, amount)
            successCount++
        }

        const gb = m?.groupMetadata
        
        await db.save()
        await m.react('⚡')
        await m.reply(
           `✅ تمت إضافة الطاقة بنجاح لجميع الأعضاء ( المجموع *${successCount}* عضو ) في مجموعة *${gb?.subject}*`,
            )
        
    } catch (error) {
        await m.react('☢')
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }