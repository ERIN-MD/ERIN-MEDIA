const pluginConfig = {
    name: 'لماذا',
    alias: ['mengapa'],
    category: 'fun',
    description: 'اسأل البوت لماذا يحدث شيء ما',
    usage: '.لماذا <سؤال>',
    example: '.لماذا السماء زرقاء؟',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

const answers = [
    'لأن هذا قدره.',
    'همم، سؤال جيد! أنا أيضاً محتار.',
    'لأن هذه هي طريقة عمله.',
    'لأن الله أراد ذلك.',
    'لا أعرف، ابحث في جوجل.',
    'لأنه هكذا فحسب.',
    'ربما صدفة؟',
    'لأن العالم مليء بالأسرار.',
    'همم، يصعب شرحه.',
    'لأن الكون يعمل بطرق غامضة.',
    'أنا أيضاً فضولي، لماذا يا ترى؟',
    'لأن هذا الشيء كان يجب أن يحدث.',
    'سؤال رائع! للأسف لا أملك الإجابة.',
    'لأن هذا هو تفرد الحياة.',
    'لأن كل شيء له أسبابه.',
    'همم... أحتاج وقتاً للتفكير.',
    'لأن هذا هو المنطق.',
    'أعتقد لأنه يجب أن يكون هكذا.',
    'لأن كل شيء مترابط.',
    'نعم، أنا أيضاً أفكر في ذلك!'
];

async function handler(m) {
    const text = m.text?.trim();
    
    if (!text) {
        return m.reply(`🤔 *لماذا*\n\n> أدخل سؤالاً!\n\n*مثال:*\n> .لماذا السماء زرقاء؟`);
    }
    
    const answer = answers[Math.floor(Math.random() * answers.length)];
    
    await m.reply(`${m.body.slice(1)}?\n*${answer}*`);
}

export { pluginConfig as config, handler }