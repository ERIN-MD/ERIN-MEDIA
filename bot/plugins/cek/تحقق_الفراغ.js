const pluginConfig = {
    name: 'تحقق_الفراغ',
    alias: ['cekgabut'],
    category: 'cek',
    description: 'تحقق من مستوى فراغك',
    usage: '.تحقق_الفراغ <اسم>',
    example: '.تحقق_الفراغ أحمد',
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
    if (percent >= 90) desc = 'فاضي لأقصى درجة! العب مع البوت~ 🥱'
    else if (percent >= 70) desc = 'فاضي بقوة! 😴'
    else if (percent >= 50) desc = 'فاضي نوعاً ما 😅'
    else if (percent >= 30) desc = 'مشغول قليلاً 📝'
    else desc = 'مشغول جداً! منتج! 💼'
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى فراغك *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى الفراغ لدى @${mentioned.split('@')[0]}؟
    
مستوى فراغه *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }