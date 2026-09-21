const pluginConfig = {
    name: 'تحقق_الصبر',
    alias: ['ceksabar'],
    category: 'cek',
    description: 'تحقق من مستوى صبرك',
    usage: '.تحقق_الصبر <اسم>',
    example: '.تحقق_الصبر أحمد',
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
    if (percent >= 90) desc = 'صبر إلهي! سيد الزِن~ 🧘'
    else if (percent >= 70) desc = 'صبور جداً! محمود 👏'
    else if (percent >= 50) desc = 'صبور نوعاً ما 😊'
    else if (percent >= 30) desc = 'أحياناً تغضب قليلاً 😅'
    else desc = 'سريع الغضب... 😤'
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى صبرك *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى الصبر لدى @${mentioned.split('@')[0]}؟
    
مستوى صبره *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }