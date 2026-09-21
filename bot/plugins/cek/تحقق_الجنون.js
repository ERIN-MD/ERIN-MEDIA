const pluginConfig = {
    name: 'تحقق_الجنون',
    alias: ['cekgila'],
    category: 'cek',
    description: 'تحقق من مدى جنونك',
    usage: '.تحقق_الجنون <اسم>',
    example: '.تحقق_الجنون أحمد',
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
        desc = 'مجنون رسمي! إلى المصحة! 🤪'
    } else if (percent >= 70) {
        desc = 'شبه مجنون 😵'
    } else if (percent >= 50) {
        desc = 'عاقل نوعاً ما 😅'
    } else if (percent >= 30) {
        desc = 'طبيعي 🙂'
    } else {
        desc = 'عاقل جداً! 😇'
    }
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى جنونك *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى الجنون لدى @${mentioned.split('@')[0]}؟
    
مستوى جنونه *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }