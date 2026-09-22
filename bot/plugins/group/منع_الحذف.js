const pluginConfig = {
    name: 'منع_الحذف',
    alias: ['antiremove'],
    category: 'group',
    description: 'تفعيل/تعطيل منع حذف الرسائل في المجموعة',
    usage: '.منع_الحذف <تشغيل/إيقاف>',
    example: '.منع_الحذف تشغيل',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: false
}

async function handler(m, { sock, db }) {
    const action = (m.args || [])[0]?.toLowerCase()
    const group = db.getGroup(m.chat) || {}

    if (!action) {
        const status = group.antiremove || 'off'
        await m.reply(
            `🗑️ *منع الحذف*\n\n` +
            `> الحالة: *${status === 'on' ? '✅ مفعل' : '❌ معطل'}*\n\n` +
            `> \`.منع_الحذف تشغيل/إيقاف\``
        )
        return
    }

    if (action === 'تشغيل' || action === 'on') {
        db.setGroup(m.chat, { ...group, antiremove: 'on' })
        m.react('✅')
        await m.reply(`✅ *تم تفعيل منع الحذف*\n> الرسائل المحذوفة سيتم إعادة توجيهها.`)
        return
    }

    if (action === 'ايقاف' || action === 'off') {
        db.setGroup(m.chat, { ...group, antiremove: 'off' })
        m.react('❌')
        await m.reply(`❌ *تم تعطيل منع الحذف*`)
        return
    }

    await m.reply(`❌ استخدم \`.منع_الحذف تشغيل\` أو \`.منع_الحذف إيقاف\``)
}

export { pluginConfig as config, handler }