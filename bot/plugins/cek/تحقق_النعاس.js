const pluginConfig = {
    name: 'تحقق_النعاس',
    alias: ['cekngantuk'],
    category: 'cek',
    description: 'تحقق من مستوى نعاسك',
    usage: '.تحقق_النعاس <اسم>',
    example: '.تحقق_النعاس أحمد',
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
    if (percent >= 90) desc = 'ZZZZZ... اذهب للنوم! 😴💤'
    else if (percent >= 70) desc = 'عيونك نصف مفتوحة~ 😪'
    else if (percent >= 50) desc = 'نعسان قليلاً 🥱'
    else if (percent >= 30) desc = 'ما زلت منتعشاً! ☕'
    else desc = 'صاحي بقوة! أرق؟ 👀'
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى نعاسك *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى النعاس لدى @${mentioned.split('@')[0]}؟
    
مستوى نعاسه *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }