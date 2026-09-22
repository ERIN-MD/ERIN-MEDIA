const pluginConfig = {
    name: 'تحقق_الشخصية',
    alias: ['cekkepribadian'],
    category: 'cek',
    description: 'تحقق من شخصيتك',
    usage: '.تحقق_الشخصية <اسم>',
    example: '.تحقق_الشخصية أحمد',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const personalities = [
    { type: 'INTJ', title: 'المهندس', desc: 'صاحب رؤية، استراتيجي، ومستقل' },
    { type: 'INTP', title: 'المنطقي', desc: 'تحليلي، مبتكر، وفضولي' },
    { type: 'ENTJ', title: 'القائد', desc: 'حازم، طموح، وقائد بالفطرة' },
    { type: 'ENTP', title: 'المناظر', desc: 'ذكي، فضولي، ومحب للتحديات' },
    { type: 'INFJ', title: 'الداعية', desc: 'مثالي، حكيم، ومليء بالتعاطف' },
    { type: 'INFP', title: 'الوسيط', desc: 'مبدع، مثالي، ومخلص' },
    { type: 'ENFJ', title: 'البطل', desc: 'كاريزمي، ملهم، ومهتم' },
    { type: 'ENFP', title: 'الحملة', desc: 'متحمس، مبدع، واجتماعي' },
    { type: 'ISTJ', title: 'اللوجستي', desc: 'مسؤول، عملي، ودقيق' },
    { type: 'ISFJ', title: 'المدافع', desc: 'مخلص، داعم، وموثوق' },
    { type: 'ESTJ', title: 'التنفيذي', desc: 'منظم، حازم، وتقليدي' },
    { type: 'ESFJ', title: 'القنصل', desc: 'مهتم، اجتماعي، ووفي' },
    { type: 'ISTP', title: 'البارع', desc: 'مرن، ملاحظ، وعملي' },
    { type: 'ISFP', title: 'المغامر', desc: 'فني، حساس، وعفوي' },
    { type: 'ESTP', title: 'رائد الأعمال', desc: 'نشيط، ثاقب البصيرة، وجريء' },
    { type: 'ESFP', title: 'المسلي', desc: 'عفوي، نشيط، ومرح' }
]

async function handler(m) {
        const mentioned = m.mentionedJid[0] || m.sender

        const p = personalities[Math.floor(Math.random() * personalities.length)]
    
    let txt = mentioned === m.sender ? `مرحباً @${mentioned.split('@')[0]}
    
نوع شخصيتك *${p.type} - ${p.title}*
\`\`\`${p.desc}\`\`\`` : `تريد التحقق من شخصية @${mentioned.split('@')[0]}؟
    
شخصيته هي *${p.type} - ${p.title}*
\`\`\`${p.desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }