const pluginConfig = {
    name: 'أين',
    alias: ['dimana'],
    category: 'fun',
    description: 'اسأل البوت أين يوجد شيء ما',
    usage: '.أين <سؤال>',
    example: '.أين شريك حياتي؟',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

const answers = [
    'بالقرب منك!',
    'بعيد هناك.',
    'في مكان لا تتوقعه.',
    'في قلبك.',
    'بالجوار هنا.',
    'همم، جرب البحث في الغرفة.',
    'في الخارج، بانتظارك.',
    'في نفس مكانك.',
    'في مكان جميل ما.',
    'خلف الباب.',
    'على يسارك.',
    'أمام عينيك!',
    'بعيد جداً، ربما في الخارج؟',
    'في مكان مليء بالذكريات.',
    'في كل مكان!',
    'في العالم الافتراضي.',
    'في عالم الأحلام.',
    'في مكان سري.',
    'همم، يصعب وصف المكان.',
    'في مكان سيجعلك سعيداً.'
];

async function handler(m) {
    const text = m.text?.trim();
    
    if (!text) {
        return m.reply(`📍 *أين*\n\n> أدخل سؤالاً!\n\n*مثال:*\n> .أين شريك حياتي؟`);
    }
    
    const answer = answers[Math.floor(Math.random() * answers.length)];
    
    await m.reply(`${m.body.slice(1)}؟
*${answer}*`);
}

export { pluginConfig as config, handler }