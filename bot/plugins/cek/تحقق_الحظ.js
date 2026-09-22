const pluginConfig = {
    name: 'تحقق_الحظ',
    alias: ['cekgacha'],
    category: 'cek',
    description: 'تحقق من حظك في القاتشا',
    usage: '.تحقق_الحظ <اسم>',
    example: '.تحقق_الحظ أحمد',
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
    if (percent >= 90) desc = 'حظ خرافي! نادر مضمون! ✨💎'
    else if (percent >= 70) desc = 'محظوظ! ستحصل على ممتاز فما فوق! 🍀'
    else if (percent >= 50) desc = 'قليل من الحظ 😊'
    else if (percent >= 30) desc = 'همم... ادعُ أكثر! 🙏'
    else desc = 'نحس! أجّل السحب لوقت لاحق! 💔'
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
مستوى حظك في القاتشا *${percent}%*
\`\`\`${desc}\`\`\`` : `تريد التحقق من مستوى حظ القاتشا لدى @${mentioned.split('@')[0]}؟
    
مستوى حظه في القاتشا *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }