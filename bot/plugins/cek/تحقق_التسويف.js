const pluginConfig = {
    name: 'تحقق_التسويف',
    alias: ['cekprocastinator'],
    category: 'cek',
    description: 'تحقق من مستوى التسويف لديك',
    usage: '.تحقق_التسويف <اسم>',
    example: '.تحقق_التسويف أحمد',
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
    if (percent >= 90) desc = 'الموعد النهائي؟ بكمل بكرا~ 😴'
    else if (percent >= 70) desc = 'سيد التسويف! 🦥'
    else if (percent >= 50) desc = 'أحياناً تؤجل، وأحياناً تجتهد 😅'
    else if (percent >= 30) desc = 'منتج نوعاً ما! 💪'
    else desc = 'منضبط للغاية! تحية لك! 🏆'
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى التسويف لديك *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى التسويف لدى @${mentioned.split('@')[0]}؟
    
مستوى التسويف لديه *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }