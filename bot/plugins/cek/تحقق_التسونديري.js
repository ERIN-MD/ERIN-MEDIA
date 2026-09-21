const pluginConfig = {
    name: 'تحقق_التسونديري',
    alias: ['cektsundere'],
    category: 'cek',
    description: 'تحقق من مستوى تسونديري لديك',
    usage: '.تحقق_التسونديري <اسم>',
    example: '.تحقق_التسونديري أحمد',
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
    if (percent >= 90) desc = 'غبي! ل-لا يعني أني معجب بك! 😤💢'
    else if (percent >= 70) desc = 'همف! لا تفهمني خطأ! 😳'
    else if (percent >= 50) desc = 'ح-حسناً كما تريد... 👉👈'
    else if (percent >= 30) desc = 'تسونديري قليلاً~ 😊'
    else desc = 'لست تسونديري، أنا صريح 💕'
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى التسونديري لديك *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى التسونديري لدى @${mentioned.split('@')[0]}؟
    
مستوى التسونديري لديه *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }