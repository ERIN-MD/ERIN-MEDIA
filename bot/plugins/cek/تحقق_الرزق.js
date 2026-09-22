const pluginConfig = {
    name: 'تحقق_الرزق',
    alias: ['cekrezeki'],
    category: 'cek',
    description: 'تحقق من مستوى رزقك اليوم',
    usage: '.تحقق_الرزق <اسم>',
    example: '.تحقق_الرزق أحمد',
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
    if (percent >= 90) desc = 'رزق وفير! فوز كبير! 💰🎉'
    else if (percent >= 70) desc = 'الرزق سلس اليوم~ 💵'
    else if (percent >= 50) desc = 'رزق يكفي، احمد ربك 🙏'
    else if (percent >= 30) desc = 'رزق بالكاد 😅'
    else desc = 'اصبر، الرزق قادم~ 🫂'
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى رزقك *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى الرزق لدى @${mentioned.split('@')[0]}؟
    
مستوى رزقه *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }