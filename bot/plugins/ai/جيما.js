import axios from 'axios';

const pluginConfig = {
    name: 'جيما',
    alias: ['gemma', 'gptanon'],
    category: 'ai',
    description: 'دردشة مع Google Gemma 3 27B | GPTAnon',
    usage: '.جيما <سؤال>',
    example: '.جيما من هو رئيس مصر؟',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: true,
    cooldown: 5,
    energi: 1,
    isEnabled: true
};

const BASE_URL = 'https://gptanon.com';

async function chatGemma(prompt) {
    const session = axios.create({
        headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
        }
    });

    await session.get(`${BASE_URL}/chat`, { timeout: 15000 });

    const res = await session.post(`${BASE_URL}/api/chat/stream`, {
        message: prompt,
        modelIds: ['google/gemma-3-27b-it']
    }, {
        headers: {
            'Accept': '*/*',
            'Content-Type': 'application/json',
            'Origin': BASE_URL,
            'Referer': `${BASE_URL}/chat`
        },
        responseType: 'text',
        timeout: 30000
    });

    const lines = res.data.split('\n').filter(l => l.startsWith('data: '));
    let reply = '';

    for (const line of lines) {
        try {
            const json = JSON.parse(line.slice(6));
            if (json.type === 'token') reply += json.token;
            if (json.type === 'complete') reply = json.content;
        } catch {}
    }

    return reply;
}

async function handler(m, { sock, text }) {
    if (!text) {
        return m.reply(
            `🧠 *Google Gemma 3 27B*\n\n` +
            `📌 \`${m.prefix}جيما <سؤال>\`\n` +
            `📌 \`${m.prefix}جيما من هو رئيس مصر؟\``
        );
    }

    await m.react('🧠');

    try {
        const reply = await chatGemma(text);
        if (reply) {
            await m.reply(reply);
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