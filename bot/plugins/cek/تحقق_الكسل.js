const pluginConfig = {
    name: 'تحقق_الكسل',
    alias: ['cekmalas'],
    category: 'cek',
    description: 'تحقق من مدى كسلك',
    usage: '.تحقق_الكسل <اسم>',
    example: '.تحقق_الكسل أحمد',
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
        desc = 'كسول جداً! ملك التمدد! 🛏️'
    } else if (percent >= 70) {
        desc = 'كسول بقوة! 😴'
    } else if (percent >= 50) {
        desc = 'كسول نوعاً ما 🥱'
    } else if (percent >= 30) {
        desc = 'قليل من الكسل 😊'
    } else {
        desc = 'مجتهد جداً! 💪'
    }
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى كسلك *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى الكسل لدى @${mentioned.split('@')[0]}؟
    
مستوى كسله *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }