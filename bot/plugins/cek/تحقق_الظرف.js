const pluginConfig = {
    name: 'تحقق_الظرف',
    alias: ['cekimut'],
    category: 'cek',
    description: 'تحقق من مدى ظرفك',
    usage: '.تحقق_الظرف <اسم>',
    example: '.تحقق_الظرف ليلى',
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
        desc = 'ظريف جداً! كاوايي~~ 🥺💕'
    } else if (percent >= 70) {
        desc = 'ظرافته لا تُطاق! 😍'
    } else if (percent >= 50) {
        desc = 'ظريف نوعاً ما~ 🌸'
    } else if (percent >= 30) {
        desc = 'فيه قليل من الظرف 😊'
    } else {
        desc = 'ربما أنت هادئ ولست ظريفاً؟ 😎'
    }
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى ظرفك *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى الظرف لدى @${mentioned.split('@')[0]}؟
    
مستوى ظرفه/ظرافتها *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }