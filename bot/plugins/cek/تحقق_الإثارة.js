const pluginConfig = {
    name: 'تحقق_الإثارة',
    alias: ['ceksexy'],
    category: 'cek',
    description: 'تحقق من مدى إثارتك',
    usage: '.تحقق_الإثارة <اسم>',
    example: '.تحقق_الإثارة أحمد',
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
        desc = 'مثير جداً! 🔥🔥🔥'
    } else if (percent >= 70) {
        desc = 'جذاب بقوة! 😏'
    } else if (percent >= 50) {
        desc = 'مغري نوعاً ما~ 😊'
    } else if (percent >= 30) {
        desc = 'عادي 🙂'
    } else {
        desc = 'ربما ظريف ولست مثيراً 😅'
    }
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى إثارتك *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى الإثارة لدى @${mentioned.split('@')[0]}؟
    
مستوى إثارته *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }