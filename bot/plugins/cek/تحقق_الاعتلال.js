const pluginConfig = {
    name: 'تحقق_الاعتلال',
    alias: ['cekpsikopat'],
    category: 'cek',
    description: 'تحقق من مدى الاعتلال النفسي لديك',
    usage: '.تحقق_الاعتلال <اسم>',
    example: '.تحقق_الاعتلال أحمد',
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
        desc = 'مختل نفسياً! ابتعد عنه! 😈'
    } else if (percent >= 70) {
        desc = 'انتبه من هذا الشخص 👀'
    } else if (percent >= 50) {
        desc = 'لديه جانب مظلم 🌑'
    } else if (percent >= 30) {
        desc = 'غامض قليلاً 🤔'
    } else {
        desc = 'طبيعي وطيب القلب 😇'
    }
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى الاعتلال النفسي لديك *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى الاعتلال النفسي لدى @${mentioned.split('@')[0]}؟
    
مستوى الاعتلال النفسي لديه *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }