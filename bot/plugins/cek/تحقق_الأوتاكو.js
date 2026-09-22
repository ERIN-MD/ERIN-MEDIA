const pluginConfig = {
    name: 'تحقق_الأوتاكو',
    alias: ['cekotaku'],
    category: 'cek',
    description: 'تحقق من مستوى أوتاكو لديك',
    usage: '.تحقق_الأوتاكو <اسم>',
    example: '.تحقق_الأوتاكو أحمد',
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
    if (percent >= 90) desc = 'سوغوي! أوتاكو حقيقي! 🎌✨'
    else if (percent >= 70) desc = 'عاشق أنمي من مستوى عالٍ~ 🇯🇵'
    else if (percent >= 50) desc = 'مشاهد أنمي عادي 📺'
    else if (percent >= 30) desc = 'تعرف القليل عن الأنمي 🤔'
    else desc = 'تم اكتشاف شخص عادي! 😂'
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى الأوتاكو لديك *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى الأوتاكو لدى @${mentioned.split('@')[0]}؟
    
مستوى الأوتاكو لديه *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }