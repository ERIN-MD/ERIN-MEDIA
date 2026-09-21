const pluginConfig = {
    name: 'تحقق_الأناقة',
    alias: ['cekkece'],
    category: 'cek',
    description: 'تحقق من مدى أناقتك',
    usage: '.تحقق_الأناقة <اسم>',
    example: '.تحقق_الأناقة أحمد',
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
        desc = 'أناقة عاصفة! 😎🔥'
    } else if (percent >= 70) {
        desc = 'أنيق جداً! ✨'
    } else if (percent >= 50) {
        desc = 'لا بأس به من الأناقة~ 👍'
    } else if (percent >= 30) {
        desc = 'قليل من الأناقة 😊'
    } else {
        desc = 'عادي، لكن تظل رائعاً! 🙂'
    }
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى أناقتك *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى الأناقة لدى @${mentioned.split('@')[0]}؟
    
مستوى أناقته *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }