const pluginConfig = {
    name: 'تحقق_الوزن',
    alias: ['cekberat'],
    category: 'cek',
    description: 'تحقق من الوزن بشكل عشوائي',
    usage: '.تحقق_الوزن <اسم>',
    example: '.تحقق_الوزن أحمد',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
    const berat = Math.floor(Math.random() * 60) + 40
    const mentioned = m.mentionedJid?.[0] || m.sender
    
    let desc = ''
    if (berat >= 90) {
        desc = 'ضخم وقوي! 💪'
    } else if (berat >= 70) {
        desc = 'ممتلئ وصحي! 😊'
    } else if (berat >= 55) {
        desc = 'مثالي جداً! 👍'
    } else if (berat >= 45) {
        desc = 'رشيق وجميل~ 🌸'
    } else {
        desc = 'نحيف جداً، كُل أكثر! 🍔'
    }
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
وزنك *${berat} كغم*
\`\`\`${desc}\`\`\`` : `تريد التحقق من وزن @${mentioned.split('@')[0]}؟
    
وزنه *${berat} كغم*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }