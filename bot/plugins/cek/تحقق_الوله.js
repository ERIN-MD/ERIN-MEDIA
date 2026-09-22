const pluginConfig = {
    name: 'تحقق_الوله',
    alias: ['cekbucin'],
    category: 'cek',
    description: 'تحقق من مدى ولهك بالحب',
    usage: '.تحقق_الوله <اسم>',
    example: '.تحقق_الوله أحمد',
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
        desc = 'وَله حاد! لم يعد بالإمكان إنقاذك 😭💔'
    } else if (percent >= 70) {
        desc = 'وَله شديد~ 🥺'
    } else if (percent >= 50) {
        desc = 'وَله لا بأس به 💕'
    } else if (percent >= 30) {
        desc = 'قليل من الوَله 😊'
    } else {
        desc = 'هادئ الأعصاب، لا وله لديك 😎'
    }
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى الوَله لديك *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى الوَله لدى @${mentioned.split('@')[0]}؟
    
مستوى الوَله لديه *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }