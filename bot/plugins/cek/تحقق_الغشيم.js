const pluginConfig = {
    name: 'تحقق_الغشيم',
    alias: ['cekcupu'],
    category: 'cek',
    description: 'تحقق من مستوى الغشامة لديك',
    usage: '.تحقق_الغشيم <اسم>',
    example: '.تحقق_الغشيم أحمد',
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
    if (percent >= 90) desc = 'غشيم جداً! تم اكتشاف مبتدئ! 🤡'
    else if (percent >= 70) desc = 'ما زلت مبتدئاً~ 😅'
    else if (percent >= 50) desc = 'عادي 🤔'
    else if (percent >= 30) desc = 'ماهر نوعاً ما! 💪'
    else desc = 'لاعب محترف! أحسنت! 🏆'
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى الغشامة لديك *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى الغشامة لدى @${mentioned.split('@')[0]}؟
    
مستوى الغشامة لديه *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }