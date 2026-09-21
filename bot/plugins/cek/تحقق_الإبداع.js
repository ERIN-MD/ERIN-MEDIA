const pluginConfig = {
    name: 'تحقق_الإبداع',
    alias: ['cekcreative'],
    category: 'cek',
    description: 'تحقق من مستوى إبداعك',
    usage: '.تحقق_الإبداع <اسم>',
    example: '.تحقق_الإبداع أحمد',
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
    if (percent >= 90) desc = 'مُبدع خارق! فنان حقيقي! 🎨✨'
    else if (percent >= 70) desc = 'خيالك واسع جداً! 💡'
    else if (percent >= 50) desc = 'مُبدع نوعاً ما 😊'
    else if (percent >= 30) desc = 'عادي 🤔'
    else desc = 'ينقصك الخيال 😅'
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى إبداعك *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى إبداع @${mentioned.split('@')[0]}؟
    
مستوى إبداعه *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }