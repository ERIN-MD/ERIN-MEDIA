const pluginConfig = {
    name: 'اشعار_الترقية',
    alias: ['notifpromote'],
    category: 'group',
    description: 'تفعيل/تعطيل إشعار عند ترقية مشرف',
    usage: '.اشعار_الترقية تشغيل/إيقاف',
    example: '.اشعار_الترقية تشغيل',
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
        const status = group.notifPromote === true ? '✅ مفعل' : '❌ معطل'
        return m.reply(`👑 *إشعار الترقية*\n\n> الحالة: ${status}\n\n*الاستخدام:*\n\`${m.prefix}اشعار_الترقية تشغيل\` - تفعيل\n\`${m.prefix}اشعار_الترقية إيقاف\` - تعطيل`)
    }
    
    if (args === 'تشغيل' || args === 'on') {
        group.notifPromote = true
        db.setGroup(m.chat, group)
        return m.reply(`✅ *تم تفعيل إشعار الترقية*`)
    }
    
    if (args === 'ايقاف' || args === 'off') {
        group.notifPromote = false
        db.setGroup(m.chat, group)
        return m.reply(`❌ *تم تعطيل إشعار الترقية*`)
    }
}

export { pluginConfig as config, handler }