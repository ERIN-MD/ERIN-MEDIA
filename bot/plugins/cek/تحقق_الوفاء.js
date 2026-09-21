const pluginConfig = {
    name: 'تحقق_الوفاء',
    alias: ['ceksetia'],
    category: 'cek',
    description: 'تحقق من مستوى وفائك',
    usage: '.تحقق_الوفاء <اسم>',
    example: '.تحقق_الوفاء أحمد',
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
    if (percent >= 90) desc = 'وفي حتى الممات! 💍💕'
    else if (percent >= 70) desc = 'وفي جداً ومخلص! ❤️'
    else if (percent >= 50) desc = 'وفي نوعاً ما~ 😊'
    else if (percent >= 30) desc = 'همم... يتزعزع أحياناً 😅'
    else desc = 'وضع المستهتر مفعّل؟ 😏'
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى وفائك *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى الوفاء لدى @${mentioned.split('@')[0]}؟
    
مستوى وفائه *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }