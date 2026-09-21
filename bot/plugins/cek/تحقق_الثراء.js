const pluginConfig = {
    name: 'تحقق_الثراء',
    alias: ['cekkaya'],
    category: 'cek',
    description: 'تحقق من مدى ثرائك',
    usage: '.تحقق_الثراء <اسم>',
    example: '.تحقق_الثراء أحمد',
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
    let emoji = ''
    if (percent >= 90) {
        desc = 'سلطان! ثري بجنون! 💎'
        emoji = '👑'
    } else if (percent >= 70) {
        desc = 'ثري جداً! 💰'
        emoji = '💎'
    } else if (percent >= 50) {
        desc = 'ميسور الحال 💵'
        emoji = '💰'
    } else if (percent >= 30) {
        desc = 'يكفي للعيش 😊'
        emoji = '💵'
    } else {
        desc = 'واصل الادخار! 🙏'
        emoji = '🪙'
    }
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى ثرائك *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى الثراء لدى @${mentioned.split('@')[0]}؟
    
مستوى ثرائه *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }