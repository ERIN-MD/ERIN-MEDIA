const pluginConfig = {
    name: 'تحقق_النحس',
    alias: ['ceksial'],
    category: 'cek',
    description: 'تحقق من مدى نحسك',
    usage: '.تحقق_النحس <اسم>',
    example: '.تحقق_النحس أحمد',
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
        desc = 'نحس جداً! الأفضل تبقى بالبيت! 😭'
    } else if (percent >= 70) {
        desc = 'حظك سيء اليوم~ 😢'
    } else if (percent >= 50) {
        desc = 'نحس نوعاً ما 😓'
    } else if (percent >= 30) {
        desc = 'قليل من النحس 😕'
    } else {
        desc = 'لست منحوساً، أنت محظوظ! 🍀'
    }
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى نحسك *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى النحس لدى @${mentioned.split('@')[0]}؟
    
مستوى نحسه *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }