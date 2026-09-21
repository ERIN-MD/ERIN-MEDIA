const pluginConfig = {
    name: 'تحقق_الحظ_العام',
    alias: ['cekhoki'],
    category: 'cek',
    description: 'تحقق من مدى حظك العام',
    usage: '.تحقق_الحظ_العام <اسم>',
    example: '.تحقق_الحظ_العام أحمد',
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
        desc = 'حظ إلهي! سحب القاتشا مضمون الفوز! 🍀✨'
    } else if (percent >= 70) {
        desc = 'محظوظ جداً! 🎰'
    } else if (percent >= 50) {
        desc = 'حظ لا بأس به 🍀'
    } else if (percent >= 30) {
        desc = 'قليل من الحظ 😊'
    } else {
        desc = 'اصبر، النحس مؤقت 😅'
    }
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى حظك العام *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى الحظ العام لدى @${mentioned.split('@')[0]}؟
    
مستوى حظه العام *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }