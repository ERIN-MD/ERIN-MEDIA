const pluginConfig = {
    name: 'تحقق_الطول',
    alias: ['cektinggi'],
    category: 'cek',
    description: 'تحقق من الطول بشكل عشوائي',
    usage: '.تحقق_الطول <اسم>',
    example: '.تحقق_الطول أحمد',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
        const mentioned = m.mentionedJid[0] || m.sender

        const tinggi = Math.floor(Math.random() * 50) + 150
    
    let desc = ''
    if (tinggi >= 190) {
        desc = 'طويل جداً! عارض كرة سلة! 🏀'
    } else if (tinggi >= 175) {
        desc = 'طول مثالي! 😎'
    } else if (tinggi >= 165) {
        desc = 'لا بأس به من الطول 👍'
    } else if (tinggi >= 155) {
        desc = 'قياسي 🙂'
    } else {
        desc = 'ظريف وصغير! 🥺'
    }
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
طولك *${tinggi} سم*
\`\`\`${desc}\`\`\`` : `تريد التحقق من طول @${mentioned.split('@')[0]}؟
    
طوله *${tinggi} سم*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }