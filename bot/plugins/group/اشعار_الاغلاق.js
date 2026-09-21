const pluginConfig = {
    name: 'اشعار_الاغلاق',
    alias: ['notifclose'],
    category: 'group',
    description: 'تفعيل/تعطيل إشعار عند إغلاق المجموعة',
    usage: '.اشعار_الاغلاق تشغيل/إيقاف',
    example: '.اشعار_الاغلاق تشغيل',
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
        const status = group.notifCloseGroup === true ? '✅ مفعل' : '❌ معطل'
        return m.reply(`🔒 *إشعار الإغلاق*\n\n> الحالة: ${status}\n\n*الاستخدام:*\n\`${m.prefix}اشعار_الاغلاق تشغيل\` - تفعيل\n\`${m.prefix}اشعار_الاغلاق إيقاف\` - تعطيل`)
    }
    
    if (args === 'تشغيل' || args === 'on') {
        group.notifCloseGroup = true
        db.setGroup(m.chat, group)
        return m.reply(`✅ *تم تفعيل إشعار الإغلاق*`)
    }
    
    if (args === 'ايقاف' || args === 'off') {
        group.notifCloseGroup = false
        db.setGroup(m.chat, group)
        return m.reply(`❌ *تم تعطيل إشعار الإغلاق*`)
    }
}

export { pluginConfig as config, handler }