// وداع الكل - أمر لتفعيل/تعطيل الوداع في جميع المجموعات

import { getDatabase } from '../../src/lib/maro-database.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'وداع_الكل',
    alias: ['goodbyeall'],
    category: 'owner',
    description: 'تفعيل/تعطيل الوداع في جميع المجموعات',
    usage: '.وداع_الكل <تشغيل/إيقاف>',
    example: '.وداع_الكل تشغيل',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const action = args[0]?.toLowerCase()
    
    if (!action || !['on', 'off', 'تشغيل', 'إيقاف'].includes(action)) {
        return m.reply(
            `👋 *وداع الكل*\n\n` +
            `> تفعيل/تعطيل الوداع في جميع المجموعات دفعة واحدة\n\n` +
            `╭┈┈⬡「 📋 *طريقة الاستخدام* 」\n` +
            `┃ ${m.prefix}وداع_الكل تشغيل\n` +
            `┃ ${m.prefix}وداع_الكل إيقاف\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        )
    }
    
    await m.react('🕕')
    
    try {
        const groups = await sock.groupFetchAllParticipating()
        const groupIds = Object.keys(groups)
        const status = ['on', 'تشغيل'].includes(action)
        let count = 0
        
        for (const groupId of groupIds) {
            db.setGroup(groupId, { goodbye: status, leave: status })
            count++
        }
        
        await m.react('✅')
        
        if (status) {
            return m.reply(
                `✅ *تم تفعيل وداع الكل*\n\n` +
                `╭┈┈⬡「 📊 *النتيجة* 」\n` +
                `┃ 🌐 إجمالي المجموعات: *${count}*\n` +
                `┃ ✅ الوداع: *مفعل*\n` +
                `╰┈┈┈┈┈┈┈┈⬡\n\n` +
                `> سيتم إرسال رسالة وداع للأعضاء المغادرين!`
            )
        } else {
            return m.reply(
                `❌ *تم تعطيل وداع الكل*\n\n` +
                `╭┈┈⬡「 📊 *النتيجة* 」\n` +
                `┃ 🌐 إجمالي المجموعات: *${count}*\n` +
                `┃ ❌ الوداع: *معطل*\n` +
                `╰┈┈┈┈┈┈┈┈⬡\n\n` +
                `> تم تعطيل الوداع في جميع المجموعات.`
            )
        }
    } catch (error) {
        console.error('[وداع_الكل] خطأ:', error.message)
        await m.react('☢')
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }