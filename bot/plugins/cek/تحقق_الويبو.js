const pluginConfig = {
    name: 'تحقق_الويبو',
    alias: ['cekwibu'],
    category: 'cek',
    description: 'تحقق من مدى حبك للأنمي',
    usage: '.تحقق_الويبو <اسم>',
    example: '.تحقق_الويبو أحمد',
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
        desc = 'ويبو حقيقي! آرا آرا~ 🎌'
    } else if (percent >= 70) {
        desc = 'ويبو بقوة! كيموتشي~ 😍'
    } else if (percent >= 50) {
        desc = 'ويبو نوعاً ما 🌸'
    } else if (percent >= 30) {
        desc = 'قليل من الويبو 😊'
    } else {
        desc = 'لست ويبو، طبيعي! 😎'
    }
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى الويبو لديك *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى الويبو لدى @${mentioned.split('@')[0]}؟
    
مستوى الويبو لديه *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }