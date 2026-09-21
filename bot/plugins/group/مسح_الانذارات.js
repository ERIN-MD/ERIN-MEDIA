import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'مسح_الانذارات',
    alias: ['resetwarn'],
    category: 'group',
    description: 'مسح إنذارات عضو',
    usage: '.مسح_الانذارات @مستخدم',
    example: '.مسح_الانذارات @مستخدم',
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
    
    let targetUser = null
    if (m.quoted) {
        targetUser = m.quoted.sender
    } else if (m.mentionedJid && m.mentionedJid.length > 0) {
        targetUser = m.mentionedJid[0]
    }
    
    if (!targetUser) {
        await m.reply(
            `⚠️ *طريقة الاستخدام*\n\n` +
            `> رد على رسالة المستخدم + \`${m.prefix}مسح_الانذارات\`\n` +
            `> أو: \`${m.prefix}مسح_الانذارات @مستخدم\``
        )
        return
    }
    
    let groupData = db.getGroup(m.chat) || {}
    let warnings = groupData.warnings || {}
    const maxWarns = groupData.maxWarnings || 3
    
    const targetName = targetUser.split('@')[0]
    
    if (!warnings[targetUser] || warnings[targetUser].length === 0) {
        await m.reply(`✅ @${targetName} ليس لديه إنذارات.`, { mentions: [targetUser] })
        return
    }
    
    const prevCount = warnings[targetUser].length
    delete warnings[targetUser]
    db.setGroup(m.chat, { ...groupData, warnings: warnings })
    
    await m.reply(
        `✅ *تم مسح الإنذارات*\n` +
        `إنذارات @${targetName} تم مسحها!\n` +
        `السابق: *${prevCount}/${maxWarns}*\n` +
        `الحالي: *0/${maxWarns}*`,
        { mentions: [targetUser] }
    )
}

export { pluginConfig as config, handler }