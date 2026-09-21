import { getDatabase } from '../../src/lib/maro-database.js'

const activeTimers = global.activeTimers || (global.activeTimers = {});

const pluginConfig = {
    name: 'فك_الكتم',
    alias: ['unmute'],
    category: 'group',
    description: 'فك الكتم عن شخص في المجموعة',
    usage: '.فك_الكتم @مستخدم',
    example: '.فك_الكتم @مستخدم',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    isBotAdmin: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    let target = null
    if (m.quoted) {
        target = m.quoted.sender
    } else if (m.mentionedJid && m.mentionedJid.length > 0) {
        target = m.mentionedJid[0]
    }

    if (!target) {
        return m.reply(`❌ *استخدام:* \`${m.prefix}فك_الكتم @مستخدم\` أو رد على رسالته`)
    }

    const targetName = target.split('@')[0]
    const group = db.getGroup(m.chat) || {}
    const mutedMembers = group.mutedMembers || []

    if (!mutedMembers.some(jid => {
        const c = jid.replace(/@.+/g, '')
        return c === targetName
    })) {
        return m.reply(`❌ @${targetName} ليس مكتوماً.`, { mentions: [target] })
    }

    // إلغاء المؤقت إذا وجد
    const timerKey = `mute_${m.chat}_${target}`
    if (activeTimers[timerKey]) {
        clearTimeout(activeTimers[timerKey])
        delete activeTimers[timerKey]
    }

    // إزالة من قائمة المكتومين
    group.mutedMembers = mutedMembers.filter(jid => {
        const c = jid.replace(/@.+/g, '')
        return c !== targetName
    })
    db.setGroup(m.chat, group)

    await m.reply(`🔓 تم فك الكتم عن @${targetName}`, { mentions: [target] })
}

export { pluginConfig as config, handler }