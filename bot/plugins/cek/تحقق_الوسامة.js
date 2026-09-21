const pluginConfig = {
    name: 'تحقق_الوسامة',
    alias: ['cekganteng'],
    category: 'cek',
    description: 'تحقق من مدى وسامتك',
    usage: '.تحقق_الوسامة <اسم>',
    example: '.تحقق_الوسامة أحمد',
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
        desc = 'وسامة قصوى! 😍🔥'
    } else if (percent >= 70) {
        desc = 'وسيم جداً! 😎'
    } else if (percent >= 50) {
        desc = 'لا بأس به من الوسامة~ 👍'
    } else if (percent >= 30) {
        desc = 'عادي 😅'
    } else {
        desc = 'ربما الجمال الداخلي؟ 🤭'
    }
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى وسامتك *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى الوسامة لدى @${mentioned.split('@')[0]}؟
    
مستوى وسامته *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }