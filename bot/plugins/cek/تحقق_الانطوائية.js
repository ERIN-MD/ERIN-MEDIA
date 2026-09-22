const pluginConfig = {
    name: 'تحقق_الانطوائية',
    alias: ['cekintrovert'],
    category: 'cek',
    description: 'تحقق من مستوى انطوائيتك',
    usage: '.تحقق_الانطوائية <اسم>',
    example: '.تحقق_الانطوائية أحمد',
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
    if (percent >= 90) desc = 'البيت هو الجنة! ابقَ في المنزل~ 🏠'
    else if (percent >= 70) desc = 'طاقتك الاجتماعية محدودة 🔋'
    else if (percent >= 50) desc = 'اجتماعي-انطوائي، متوازن~ ⚖️'
    else if (percent >= 30) desc = 'فراشة اجتماعية 🦋'
    else desc = 'الوضع انبساطي مفعّل! 🎉'
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى انطوائيتك *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى الانطوائية لدى @${mentioned.split('@')[0]}؟
    
مستوى انطوائيته *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }