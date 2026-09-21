const pluginConfig = {
    name: 'تحقق_العزوبية',
    alias: ['cekjomblo'],
    category: 'cek',
    description: 'تحقق من مستوى عزوبيتك',
    usage: '.تحقق_العزوبية <اسم>',
    example: '.تحقق_العزوبية أحمد',
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
    if (percent >= 90) desc = 'أعزب أبدي! العزوبية سعادة~ 💔😎'
    else if (percent >= 70) desc = 'شخص مستقل قوي! 💪'
    else if (percent >= 50) desc = 'وضع التعارف مفعّل 😍'
    else if (percent >= 30) desc = 'يبدو أن هناك من معجب بك~ 👀'
    else desc = 'قريباً مرتبط! 💕'
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى عزوبيتك *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى العزوبية لدى @${mentioned.split('@')[0]}؟
    
مستوى عزوبيته *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }