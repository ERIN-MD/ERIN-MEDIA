const pluginConfig = {
    name: 'تحقق_اللاعب',
    alias: ['cekgamer'],
    category: 'cek',
    description: 'تحقق من مدى احترافك في الألعاب',
    usage: '.تحقق_اللاعب <اسم>',
    example: '.تحقق_اللاعب أحمد',
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
    if (percent >= 90) {
        desc = 'لاعب محترف! مستوى رياضة إلكترونية! 🏆'
    } else if (percent >= 70) {
        desc = 'ماهر جداً! 🎮'
    } else if (percent >= 50) {
        desc = 'لا بأس به 👍'
    } else if (percent >= 30) {
        desc = 'ما زلت مبتدئاً 😅'
    } else {
        desc = 'الأفضل أن تلعب ألعاب الطبخ 🍳'
    }
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى احترافك في الألعاب *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى الاحتراف لدى @${mentioned.split('@')[0]}؟
    
مستوى احترافه في الألعاب *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }