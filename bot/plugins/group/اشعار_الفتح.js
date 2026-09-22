const pluginConfig = {
    name: 'اشعار_الفتح',
    alias: ['notifopen'],
    category: 'group',
    description: 'تفعيل/تعطيل إشعار عند فتح المجموعة',
    usage: '.اشعار_الفتح تشغيل/إيقاف',
    example: '.اشعار_الفتح تشغيل',
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
        const status = group.notifOpenGroup === true ? '✅ مفعل' : '❌ معطل'
        return m.reply(`🔓 *إشعار الفتح*\n\n> الحالة: ${status}\n\n*الاستخدام:*\n\`${m.prefix}اشعار_الفتح تشغيل\` - تفعيل\n\`${m.prefix}اشعار_الفتح إيقاف\` - تعطيل`)
    }
    
    if (args === 'تشغيل' || args === 'on') {
        group.notifOpenGroup = true
        db.setGroup(m.chat, group)
        return m.reply(`✅ *تم تفعيل إشعار الفتح*`)
    }
    
    if (args === 'ايقاف' || args === 'off') {
        group.notifOpenGroup = false
        db.setGroup(m.chat, group)
        return m.reply(`❌ *تم تعطيل إشعار الفتح*`)
    }
}

export { pluginConfig as config, handler }