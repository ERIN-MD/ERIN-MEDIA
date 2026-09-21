import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'قراءة_الحالات',
    alias: ['autoreadsw'],
    category: 'owner',
    description: 'قراءة تلقائية لجميع الحالات/الستوريات',
    usage: '.قراءة_الحالات on/off',
    example: '.قراءة_الحالات on',
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
    const action = (m.args?.[0] || '').toLowerCase()
    const current = db.setting('autoReadSW') || { enabled: false }

    if (!action) {
        return m.reply(
            `👁️ *قراءة الحالات*\n\n` +
            `> الحالة: *${current.enabled ? '✅ مفعل' : '❌ معطل'}*\n\n` +
            `*طريقة الاستخدام:*\n` +
            `> \`${m.prefix}قراءة_الحالات on\` — تفعيل\n` +
            `> \`${m.prefix}قراءة_الحالات off\` — تعطيل`
        )
    }

    if (action === 'on') {
        db.setting('autoReadSW', { enabled: true })
        db.save()
        await m.react('✅')
        return m.reply(
            `✅ *تم تفعيل قراءة الحالات*\n\n` +
            `> البوت سيقرأ جميع حالات الواتساب تلقائياً`
        )
    }

    if (action === 'off') {
        db.setting('autoReadSW', { enabled: false })
        db.save()
        await m.react('✅')
        return m.reply(`❌ *تم تعطيل قراءة الحالات*`)
    }

    return m.reply(`❌ استخدم \`on\` أو \`off\``)
}

export { pluginConfig as config, handler }