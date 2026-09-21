import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'تفاعل_تلقائي',
    alias: ['autoreactsw'],
    category: 'owner',
    description: 'تفاعل تلقائي على جميع الحالات/الستوريات',
    usage: '.تفاعل_تلقائي on/off [ايموجي]',
    example: '.تفاعل_تلقائي on 🔥',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
    const db = getDatabase()
    const args = m.args || []
    const action = (args[0] || '').toLowerCase()
    const emoji = args[1] || '🔥'

    const current = db.setting('autoReactSW') || { enabled: false, emoji: '🔥' }

    if (!action) {
        return m.reply(
            `👁️ *تفاعل تلقائي على الستوريات*\n\n` +
            `> الحالة: *${current.enabled ? '✅ مفعل' : '❌ معطل'}*\n` +
            `> الايموجي: *${current.emoji}*\n\n` +
            `*طريقة الاستخدام:*\n` +
            `> \`${m.prefix}تفاعل_تلقائي on\` — تفعيل (ايموجي افتراضي 🔥)\n` +
            `> \`${m.prefix}تفاعل_تلقائي on 😍\` — تفعيل مع ايموجي\n` +
            `> \`${m.prefix}تفاعل_تلقائي off\` — تعطيل`
        )
    }

    if (action === 'on') {
        db.setting('autoReactSW', { enabled: true, emoji })
        db.save()
        await m.react('✅')
        return m.reply(
            `✅ *تم تفعيل التفاعل التلقائي على الستوريات*\n\n` +
            `> الايموجي: *${emoji}*\n` +
            `> البوت سيتفاعل تلقائياً مع جميع ستوريات الواتساب`
        )
    }

    if (action === 'off') {
        db.setting('autoReactSW', { enabled: false, emoji: current.emoji })
        db.save()
        await m.react('✅')
        return m.reply(`❌ *تم تعطيل التفاعل التلقائي على الستوريات*`)
    }

    return m.reply(`❌ استخدم \`on\` أو \`off\``)
}

export { pluginConfig as config, handler }