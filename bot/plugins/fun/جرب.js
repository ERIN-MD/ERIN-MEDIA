const pluginConfig = {
    name: 'جرب',
    alias: ['coba'],
    category: 'fun',
    description: 'جرب أن تسأل البوت شيئاً',
    usage: '.جرب <سؤال>',
    example: '.جرب خمن ما أفكر فيه',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

const answers = [
    'همم، دعني أجرب... أنت تفكر في الطعام!',
    'أخمن... أنت فاضي!',
    'دعني أجرب... أعتقد أنك سعيد!',
    'همم، أعتقد أنك محتار.',
    'سأجرب التخمين... أنت مشتاق لشخص ما؟',
    'أعتقد أنك مسترخي.',
    'أخمن أنك تتصفح هاتفك باستمرار.',
    'همم، بالتأكيد أنت تشعر بالملل؟',
    'دعني أخمن... أنت تريد الخروج!',
    'أعتقد أنك بحاجة للتسلية.',
    'همم، أعتقد أنك سعيد!',
    'سأجرب... أنت بالتأكيد فضولي!',
    'تخميني: أنت مستلقٍ.',
    'همم، ربما تفكر في شخص مميز.',
    'سأجرب: أنت تريد أن تفضفض؟',
    'أعتقد أنك تريد لعب لعبة!',
    'همم، أخمن أنك تستمع للموسيقى.',
    'دعني أخمن... أنت في الغرفة!',
    'أعتقد أنك تنتظر شيئاً.',
    'همم، تخميني: أنت بحاجة لصديق تتحدث معه!'
];

async function handler(m) {
    const text = m.text?.trim();
    
    if (!text) {
        return m.reply(`🎯 *جرب*\n\n> أدخل شيئاً!\n\n*مثال:*\n> .جرب خمن ما أفكر فيه`);
    }
    
    const answer = answers[Math.floor(Math.random() * answers.length)];
    
    await m.reply(`${m.body.slice(1)}؟
*${answer}*`);
}

export { pluginConfig as config, handler }