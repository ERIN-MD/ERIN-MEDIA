const pluginConfig = {
    name: 'تحقق_العمر_العقلي',
    alias: ['cekumur'],
    category: 'cek',
    description: 'تحقق من عمرك العقلي',
    usage: '.تحقق_العمر_العقلي <اسم>',
    example: '.تحقق_العمر_العقلي أحمد',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
        const percent = Math.floor(Math.random() * 80) + 5
    const mentioned = m.mentionedJid[0] || m.sender
                    
    let desc = ''
    if (percent >= 60) desc = 'حكيم كالمسنين! 🧓'
    else if (percent >= 40) desc = 'ناضج ومتزن~ 🧑'
    else if (percent >= 20) desc = 'روح شابة! 🧒'
    else desc = 'ما زلت كالطفل الصغير~ 👶'
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
عمرك العقلي *${percent} سنة*
\`\`\`${desc}\`\`\`` : `تريد التحقق من العمر العقلي لـ @${mentioned.split('@')[0]}؟
    
عمره العقلي *${percent} سنة*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }