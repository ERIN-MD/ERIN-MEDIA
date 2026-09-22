const pluginConfig = {
    name: 'تحقق_اليانديري',
    alias: ['cekyandere'],
    category: 'cek',
    description: 'تحقق من مستوى يانديري لديك',
    usage: '.تحقق_اليانديري <اسم>',
    example: '.تحقق_اليانديري أحمد',
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
    if (percent >= 90) desc = 'أنت ملكي للأبد~ 🔪💕'
    else if (percent >= 70) desc = 'لا تقترب منه... 👁️'
    else if (percent >= 50) desc = 'حماية زائدة قليلاً~ 🫂'
    else if (percent >= 30) desc = 'تملكي نوعاً ما 😅'
    else desc = 'طبيعي، هادئ~ 😊'
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى اليانديري لديك *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى اليانديري لدى @${mentioned.split('@')[0]}؟
    
مستوى اليانديري لديه *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }