// ترحيب الكل - أمر لتفعيل/تعطيل الترحيب في جميع المجموعات

import { getDatabase } from '../../src/lib/maro-database.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'ترحيب_الكل',
    alias: ['welcomeall'],
    category: 'owner',
    description: 'تفعيل/تعطيل الترحيب في جميع المجموعات',
    usage: '.ترحيب_الكل <تشغيل/إيقاف>',
    example: '.ترحيب_الكل تشغيل',
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
            `👋 *ترحيب الكل*\n\n` +
            `> تفعيل/تعطيل الترحيب في جميع المجموعات دفعة واحدة\n\n` +
            `╭┈┈⬡「 📋 *طريقة الاستخدام* 」\n` +
            `┃ ${m.prefix}ترحيب_الكل تشغيل\n` +
            `┃ ${m.prefix}ترحيب_الكل إيقاف\n` +
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
            db.setGroup(groupId, { welcome: status })
            count++
        }
        
        await m.react('✅')
        
        if (status) {
            return m.reply(
                `✅ *تم تفعيل ترحيب الكل*\n\n` +
                `╭┈┈⬡「 📊 *النتيجة* 」\n` +
                `┃ 🌐 إجمالي المجموعات: *${count}*\n` +
                `┃ ✅ الترحيب: *مفعل*\n` +
                `╰┈┈┈┈┈┈┈┈⬡\n\n` +
                `> سيتم الترحيب بجميع الأعضاء الجدد تلقائياً!`
            )
        } else {
            return m.reply(
                `❌ *تم تعطيل ترحيب الكل*\n\n` +
                `╭┈┈⬡「 📊 *النتيجة* 」\n` +
                `┃ 🌐 إجمالي المجموعات: *${count}*\n` +
                `┃ ❌ الترحيب: *معطل*\n` +
                `╰┈┈┈┈┈┈┈┈⬡\n\n` +
                `> تم تعطيل الترحيب في جميع المجموعات.`
            )
        }
    } catch (error) {
        console.error('[ترحيب_الكل] خطأ:', error.message)
        await m.react('☢')
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }