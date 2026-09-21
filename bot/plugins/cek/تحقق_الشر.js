const pluginConfig = {
    name: 'تحقق_الشر',
    alias: ['cekjahat'],
    category: 'cek',
    description: 'تحقق من مدى شرّك',
    usage: '.تحقق_الشر <اسم>',
    example: '.تحقق_الشر أحمد',
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
        desc = 'مستوى شرير خارق! 😈👿'
    } else if (percent >= 70) {
        desc = 'شرير جداً! 💀'
    } else if (percent >= 50) {
        desc = 'لا بأس به من الشر 😏'
    } else if (percent >= 30) {
        desc = 'شقي قليلاً 😊'
    } else {
        desc = 'طيب، لست شريراً! 😇'
    }
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى شرّك *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى الشر لدى @${mentioned.split('@')[0]}؟
    
مستوى شرّه *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }