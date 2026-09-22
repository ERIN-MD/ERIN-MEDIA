const pluginConfig = {
    name: 'هل_صحيح',
    alias: ['apakah'],
    category: 'fun',
    description: 'اسأل البوت هل شيء ما صحيح',
    usage: '.هل_صحيح <سؤال>',
    example: '.هل_صحيح يمكنني أن أصبح غنياً؟',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

const answers = [
    'نعم، بالتأكيد!',
    'لا، لا أعتقد ذلك.',
    'ربما، جرب لاحقاً.',
    'همم... أعتقد نعم.',
    'أنا أشك، لكن ممكن.',
    'بالتأكيد! 100%!',
    'غير ممكن.',
    'ممكن، من يدري؟',
    'برأيي نعم.',
    'واو، لا أعتقد ذلك.',
    'طبعاً، لما لا؟',
    'لا أعلم، اسأل غيري.',
    'يا إلهي، بالتأكيد!',
    'همم... لا أعتقد.',
    'أنا واثق أنه نعم!',
    'مستحيل تماماً.',
    'ممكن، لكن لا ترفع سقف توقعاتك.',
    'نعم طبعاً!',
    'لا، آسف.',
    'ممكن! بالتوفيق!'
];

async function handler(m) {
    const text = m.text?.trim();
    
    if (!text) {
        return m.reply(`❓ *هل صحيح*\n\n> أدخل سؤالاً!\n\n*مثال:*\n> .هل_صحيح يمكنني أن أصبح غنياً؟`);
    }
    
    const answer = answers[Math.floor(Math.random() * answers.length)];
    
    await m.reply(`${m.body.slice(1)}؟
*${answer}*`);
}

export { pluginConfig as config, handler }