import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'قراءة_ستوريات',
    alias: ['autoreadsw'],
    category: 'owner',
    description: 'قراءة تلقائية لجميع الحالات/الستوريات',
    usage: '.قراءة_ستوريات on/off',
    example: '.قراءة_ستوريات on',
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
            `👁️ *قراءة تلقائية للستوريات*\n\n` +
            `> الحالة: *${current.enabled ? '✅ مفعل' : '❌ معطل'}*\n\n` +
            `*طريقة الاستخدام:*\n` +
            `> \`${m.prefix}قراءة_ستوريات on\` — تفعيل\n` +
            `> \`${m.prefix}قراءة_ستوريات off\` — تعطيل`
        )
    }

    if (action === 'on') {
        db.setting('autoReadSW', { enabled: true })
        db.save()
        await m.react('✅')
        return m.reply(
            `✅ *تم تفعيل قراءة الستوريات*\n\n` +
            `> البوت سيقرأ جميع ستوريات الواتساب تلقائياً`
        )
    }

    if (action === 'off') {
        db.setting('autoReadSW', { enabled: false })
        db.save()
        await m.react('✅')
        return m.reply(`❌ *تم تعطيل قراءة الستوريات*`)
    }

    return m.reply(`❌ استخدم \`on\` أو \`off\``)
}

export { pluginConfig as config, handler }