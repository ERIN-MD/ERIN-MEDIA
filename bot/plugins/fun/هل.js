const pluginConfig = {
    name: 'هل',
    alias: ['akankah'],
    category: 'fun',
    description: 'اسأل البوت هل سيحدث شيء ما',
    usage: '.هل <سؤال>',
    example: '.هل سأنجح؟',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

const answers = [
    'نعم، بالتأكيد سيحدث!',
    'لا، لا أعتقد ذلك.',
    'ربما سيحدث، ربما لا.',
    'إن شاء الله سيحدث!',
    'همم، صعب التوقع.',
    'بالتأكيد! ثق بنفسك!',
    'لا أعتقد ذلك.',
    'سيحدث إذا اجتهدت.',
    'يوماً ما، بالتأكيد.',
    'لن يحدث، آسف.',
    'طبعاً! انتظر فقط!',
    'همم، أنا أشك.',
    'سيحدث! ثق بالعملية!',
    'الاحتمالية ضئيلة.',
    'بالتأكيد سيحدث، أنا واثق!',
    'لن يحدث، ابحث عن شيء آخر.',
    'سيحدث، لكن يحتاج وقتاً.',
    'إن شاء الله!',
    'إذا كان نصيباً، سيحدث.',
    'سيحدث في الوقت المناسب!'
];

async function handler(m) {
    const text = m.text?.trim();
    
    if (!text) {
        return m.reply(`🔮 *هل*\n\n> أدخل سؤالاً!\n\n*مثال:*\n> .هل سأنجح؟`);
    }
    
    const answer = answers[Math.floor(Math.random() * answers.length)];
    
    await m.reply(`${m.body.slice(1)}؟
*${answer}*`);
}

export { pluginConfig as config, handler }