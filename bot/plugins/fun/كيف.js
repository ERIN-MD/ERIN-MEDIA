const pluginConfig = {
    name: 'كيف',
    alias: ['bagaimana'],
    category: 'fun',
    description: 'اسأل البوت كيف تفعل شيئاً',
    usage: '.كيف <سؤال>',
    example: '.كيف أصبح ناجحاً؟',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

const answers = [
    'الطريقة سهلة، فقط افعلها!',
    'همم، صعب الشرح. جرب أولاً!',
    'بالجهد والدعاء طبعاً.',
    'هكذا تكون الطريقة.',
    'لا أعرف كثيراً، جرب مراجع أخرى.',
    'بهدوء، لاحقاً ستقدر.',
    'بالعمل الجاد وعدم الاستسلام!',
    'أولاً، ثق بنفسك.',
    'همم، كل شخص له طريقته.',
    'اتبع قلبك فقط.',
    'تعلم من ذوي الخبرة.',
    'خطوة بخطوة، لا تتعجل.',
    'بإرادة قوية!',
    'ابدأ من الأشياء الصغيرة.',
    'واظب فقط، لاحقاً ستقدر.',
    'لا تفكر كثيراً، تحرك مباشرة!',
    'سهل! فقط ابدأ!',
    'الطريقة؟ جرب أولاً!',
    'باستراتيجية مناسبة.',
    'همم، أنا أيضاً ما زلت أتعلم.'
];

async function handler(m) {
    const text = m.text?.trim();
    
    if (!text) {
        return m.reply(`📋 *كيف*\n\n> أدخل سؤالاً!\n\n*مثال:*\n> .كيف أصبح ناجحاً؟`);
    }
    
    const answer = answers[Math.floor(Math.random() * answers.length)];
    
    await m.reply(`${m.body.slice(1)}؟
*${answer}*`);
}

export { pluginConfig as config, handler }