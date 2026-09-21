const pluginConfig = {
    name: 'تحقق_الكارما',
    alias: ['cekkarma'],
    category: 'cek',
    description: 'تحقق من مستوى الكارما لديك',
    usage: '.تحقق_الكارما <اسم>',
    example: '.تحقق_الكارما أحمد',
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
    if (percent >= 80) desc = 'كارما جيدة! الجنة في انتظارك~ ✨'
    else if (percent >= 60) desc = 'جيدة نوعاً ما، واصل التحسين! 🙏'
    else if (percent >= 40) desc = 'محايد، أكثر من الخير~ ⚖️'
    else if (percent >= 20) desc = 'احذر من الكارما السيئة! ⚠️'
    else desc = 'واو تحتاج لتوبة كثيرة... 😱'
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى الكارما لديك *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى الكارما لدى @${mentioned.split('@')[0]}؟
    
مستوى الكارما لديه *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }