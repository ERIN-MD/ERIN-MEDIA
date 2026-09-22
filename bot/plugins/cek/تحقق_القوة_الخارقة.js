const pluginConfig = {
    name: 'تحقق_القوة_الخارقة',
    alias: ['cekoverpower'],
    category: 'cek',
    description: 'تحقق من مستوى قوتك الخارقة',
    usage: '.تحقق_القوة_الخارقة <اسم>',
    example: '.تحقق_القوة_الخارقة أحمد',
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
    if (percent >= 90) desc = 'قوة خارقة هائلة! أسطورة! 👑🔥'
    else if (percent >= 70) desc = 'قوي جداً! 💪'
    else if (percent >= 50) desc = 'لا بأس به من القوة~ 😎'
    else if (percent >= 30) desc = 'عادي 🤔'
    else desc = 'ما زلت بحاجة للتدريب 📝'
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى قوتك الخارقة *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى القوة الخارقة لدى @${mentioned.split('@')[0]}؟
    
مستوى قوته الخارقة *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }