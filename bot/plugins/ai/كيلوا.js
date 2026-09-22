import axios from 'axios';

const pluginConfig = {
    name: 'كيلوا',
    alias: ['kilwa', 'grok', 'كيلو'],
    category: 'ai',
    description: 'دردشة مع Grok 4.3 | KILWA AI',
    usage: '.كيلوا <سؤال>',
    example: '.كيلوا من هو رئيس مصر؟',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: true,
    cooldown: 5,
    energi: 1,
    isEnabled: true
};

const API_URL = 'http://de3.bot-hosting.net:21007/kilwa-grok';

async function handler(m, { sock, text }) {
    if (!text) {
        return m.reply(
            `🤖 *KILWA GROK 4.3*\n\n` +
            `📌 *الاستخدام:* \`${m.prefix}كيلوا <سؤال>\`\n` +
            `📌 *مثال:* \`${m.prefix}كيلوا من هو رئيس مصر؟\``
        );
    }

    await m.react('🤖');

    try {
        const { data } = await axios.get(API_URL, {
            params: { text },
            timeout: 30000
        });

        if (data?.status === 'success' && data?.reply) {
            await m.reply(data.reply);
            await m.react('✅');
        } else {
            await m.react('❌');
            await m.reply('❌ لم يتم الحصول على رد');
        }
    } catch (e) {
        await m.react('❌');
        await m.reply(`❌ خطأ: ${e.message}`);
    }
}

export { pluginConfig as config, handler };