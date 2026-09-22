const pluginConfig = {
    name: 'اقرأ_المزيد',
    alias: ['readmore'],
    category: 'tools',
    description: 'إنشاء نص مع خيار "اقرأ المزيد" (مخفي)',
    usage: '.اقرأ_المزيد <النص_الظاهر>|<النص_المخفي>',
    example: '.اقرأ_المزيد مرحباً|هذه رسالة سرية',
    isGroup: false,
    isBotAdmin: false,
    isAdmin: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
};

function handler(m, { sock }) {
    const text = m.text;
    
    if (!text) {
        return m.reply(`⚠️ أدخل النص!\nمثال: \`${m.prefix}${m.command} مرحباً|هذا نص مخفي\``);
    }
    
    let [l, r] = text.split('|');
    if (!l) l = '';
    if (!r) r = '';
    
    const readmore = String.fromCharCode(8206).repeat(4001);
    
    m.reply(l + readmore + r);
}

export { pluginConfig as config, handler }