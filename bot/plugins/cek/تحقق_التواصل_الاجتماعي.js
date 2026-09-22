const pluginConfig = {
    name: 'تحقق_التواصل_الاجتماعي',
    alias: ['ceksocmed'],
    category: 'cek',
    description: 'تحقق من مستوى إدمان التواصل الاجتماعي',
    usage: '.تحقق_التواصل_الاجتماعي <اسم>',
    example: '.تحقق_التواصل_الاجتماعي أحمد',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
        const percent = Math.floor(Math.random() * 101)
    const mentioned = m.mentionedJid[0] || m.sender
                    
    let desc = ''
    if (percent >= 90) desc = 'إدمان شديد! تحتاج لعلاج! 📱💀'
    else if (percent >= 70) desc = 'تصفح مستمر بلا توقف~ 📲'
    else if (percent >= 50) desc = 'استخدام عادي 👍'
    else if (percent >= 30) desc = 'صحي نوعاً ما 🌿'
    else desc = 'سيد التخلص من السموم الرقمية! 🧘'
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى إدمانك للتواصل الاجتماعي *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى الإدمان لدى @${mentioned.split('@')[0]}؟
    
مستوى إدمانه للتواصل الاجتماعي *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }