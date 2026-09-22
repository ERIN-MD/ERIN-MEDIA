const pluginConfig = {
    name: 'تحقق_الجمال',
    alias: ['cekcantik'],
    category: 'cek',
    description: 'تحقق من مدى جمالك',
    usage: '.تحقق_الجمال <اسم>',
    example: '.تحقق_الجمال ليلى',
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
        desc = 'جميلة جداً كالملاك! 👸✨'
    } else if (percent >= 70) {
        desc = 'جميلة جداً! 💕'
    } else if (percent >= 50) {
        desc = 'حلوة وجميلة~ 🌸'
    } else if (percent >= 30) {
        desc = 'لا بأس به من الجمال 😊'
    } else {
        desc = 'تظلين جميلة! 💖'
    }
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى جمالك *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى جمال @${mentioned.split('@')[0]}؟
    
مستوى جمالها *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }