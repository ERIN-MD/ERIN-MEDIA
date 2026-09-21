const pluginConfig = {
    name: 'تحقق_الكيبوب',
    alias: ['cekkpopers'],
    category: 'cek',
    description: 'تحقق من مستوى حبك للكيبوب',
    usage: '.تحقق_الكيبوب <اسم>',
    example: '.تحقق_الكيبوب أحمد',
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
    if (percent >= 90) desc = 'أرمي/بلينك من الدرجة القصوى! 💜💗'
    else if (percent >= 70) desc = 'معجب متعصب! 🎤'
    else if (percent >= 50) desc = 'مستمع عادي~ 🎵'
    else if (percent >= 30) desc = 'تعرف القليل فقط 😅'
    else desc = 'لست من محبي الكيبوب 🤷'
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى حبك للكيبوب *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى حب الكيبوب لدى @${mentioned.split('@')[0]}؟
    
مستوى حبه للكيبوب *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }