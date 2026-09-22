const pluginConfig = {
    name: 'اشعار_الخفض',
    alias: ['notifdemote'],
    category: 'group',
    description: 'تفعيل/تعطيل إشعار عند خفض مشرف',
    usage: '.اشعار_الخفض تشغيل/إيقاف',
    example: '.اشعار_الخفض تشغيل',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function handler(m, { sock, db }) {
    if (!m.isAdmin && !m.isOwner) {
        return m.reply(`❌ فقط مشرفي المجموعة يمكنهم استخدام هذه الميزة`)
    }
    
    const args = m.args[0]?.toLowerCase()
    const group = db.getGroup(m.chat) || {}
    
    if (!['تشغيل', 'ايقاف', 'on', 'off'].includes(args)) {
        const status = group.notifDemote === true ? '✅ مفعل' : '❌ معطل'
        return m.reply(`👤 *إشعار الخفض*\n\n> الحالة: ${status}\n\n*الاستخدام:*\n\`${m.prefix}اشعار_الخفض تشغيل\` - تفعيل\n\`${m.prefix}اشعار_الخفض إيقاف\` - تعطيل`)
    }
    
    if (args === 'تشغيل' || args === 'on') {
        group.notifDemote = true
        db.setGroup(m.chat, group)
        return m.reply(`✅ *تم تفعيل إشعار الخفض*`)
    }
    
    if (args === 'ايقاف' || args === 'off') {
        group.notifDemote = false
        db.setGroup(m.chat, group)
        return m.reply(`❌ *تم تعطيل إشعار الخفض*`)
    }
}

export { pluginConfig as config, handler }