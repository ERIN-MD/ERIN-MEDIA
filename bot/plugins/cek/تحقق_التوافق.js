const pluginConfig = {
    name: 'تحقق_التوافق',
    alias: ['cekjodoh'],
    category: 'cek',
    description: 'تحقق من توافق الحبيبين',
    usage: '.تحقق_التوافق <اسم1> & <اسم2>',
    example: '.تحقق_التوافق أحمد & ليلى',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
    const input = m.text?.trim() || ''
    const parts = input.split(/[&,]/).map(s => s.trim()).filter(s => s)
    
    if (parts.length < 2) {
        return m.reply(`💕 *تحقق التوافق*\n\n> أدخل اسمين!\n\n> مثال: ${m.prefix}تحقق_التوافق أحمد & ليلى`)
    }
    
    const percent = Math.floor(Math.random() * 101)
    const mentioned = m.mentionedJid[0] || m.sender
                    
    let desc = ''
    if (percent >= 90) {
        desc = 'متوافقان جداً! تزوجا فوراً! 💍'
    } else if (percent >= 70) {
        desc = 'مناسبان جداً! 💕'
    } else if (percent >= 50) {
        desc = 'مناسبان نوعاً ما~ 😊'
    } else if (percent >= 30) {
        desc = 'همم، يحتاج لجهد أكبر 🤔'
    } else {
        desc = 'ربما تبحث عن شخص آخر؟ 😅'
    }
    
    let txt = `💕 *تحقق التوافق*\n\n> التوافق بين *${parts[0]}* و *${parts[1]}*:\n\n*${percent}%*\n\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }