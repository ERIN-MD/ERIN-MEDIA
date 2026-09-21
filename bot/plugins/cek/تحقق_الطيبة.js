const pluginConfig = {
    name: 'تحقق_الطيبة',
    alias: ['cekbaik'],
    category: 'cek',
    description: 'تحقق من مدى طيبتك',
    usage: '.تحقق_الطيبة <اسم>',
    example: '.تحقق_الطيبة أحمد',
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
        desc = 'رائع! أنت أطيب شخص في هذا العالم! 😇✨'
    } else if (percent >= 70) {
        desc = 'طيب القلب ومتواضع! 💝'
    } else if (percent >= 50) {
        desc = 'لا بأس به من الطيبة 😊'
    } else if (percent >= 30) {
        desc = 'قليل من الطيبة 🙂'
    } else {
        desc = 'همم، تحتاج إلى مراجعة نفسك؟ 🤔'
    }
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى طيبتك *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى طيبة @${mentioned.split('@')[0]}؟
    
مستوى طيبته *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }