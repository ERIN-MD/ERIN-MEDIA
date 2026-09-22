const pluginConfig = {
    name: 'تحقق_العمر_المتبقي',
    alias: ['ceksisaumur'],
    category: 'cek',
    description: 'تحقق من عمرك المتبقي',
    usage: '.تحقق_العمر_المتبقي <اسم>',
    example: '.تحقق_العمر_المتبقي أحمد',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
        
    const mentioned = m.mentionedJid[0] || m.sender

        
    const tahun = Math.floor(Math.random() * 80) + 20
    const bulan = Math.floor(Math.random() * 12)
    const hari = Math.floor(Math.random() * 30)
    
    let desc = ''
    if (tahun > 80) {
        desc = 'عمر طويل جداً! 🎉'
    } else if (tahun > 60) {
        desc = 'طويل نوعاً ما~ ✨'
    } else if (tahun > 40) {
        desc = 'يكفي 😊'
    } else {
        desc = 'حافظ على صحتك! 🙏'
    }
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
عمرك المتبقي *${tahun} سنة ${bulan} شهر ${hari} يوم*
\`\`\`${desc}\`\`\`` : `تريد التحقق من العمر المتبقي لـ @${mentioned.split('@')[0]}؟
    
عمره المتبقي *${tahun} سنة ${bulan} شهر ${hari} يوم*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }