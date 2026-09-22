import axios from 'axios';
import config from '../../config.js';
import te from '../../src/lib/maro-error.js';

async function searchWebtoon(query) {
    try {
        const { data } = await axios.get(
            "https://m.webtoons.com/undefined/search/result",
            {
                params: {
                    keyword: query,
                    searchType: "ALL",
                    start: 1
                },
                headers: {
                    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36",
                    "Accept": "application/json, text/plain, */*",
                    "Referer": "https://m.webtoons.com/id/search"
                }
            }
        );
        return data;
    } catch (err) {
        throw new Error(err.response?.data?.message || err.message);
    }
}

const pluginConfig = {
    name: 'ويبتون',
    alias: ['webtoon'],
    category: 'search',
    description: 'بحث عن مانجا ويبتون',
    usage: '.ويبتون <بحث>',
    example: '.ويبتون كوس ستان',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
};

async function handler(m, { sock }) {
    const query = m.args.join(' ')?.trim();

    if (!query) {
        return m.reply(`📚 *ويبتون*\n\n📌 مثال: \`${m.prefix}ويبتون كوس ستان\``);
    }

    m.react('🔍');

    try {
        const data = await searchWebtoon(query);
        
        // البحث بيرجع JSON - نعرض أول نتيجة
        const results = data?.result || data?.data || [];
        
        if (!results || results.length === 0) {
            m.react('❌');
            return m.reply('❌ لم يتم العثور على نتائج');
        }

        const first = Array.isArray(results) ? results[0] : results;
        const title = first.title || first.name || 'بدون عنوان';
        const author = first.author || first.writer || '?';
        const genre = first.genre || first.category || '?';
        const url = first.url || first.link || `https://m.webtoons.com/search?keyword=${encodeURIComponent(query)}`;

        const caption = `📚 *${title}*\n👤 *الكاتب:* ${author}\n🏷️ *التصنيف:* ${genre}\n🔗 ${url}`;

        await sock.sendMessage(m.chat, {
            image: { url: first.thumbnail || first.image || first.cover || '' },
            caption: caption,
            footer: '📚 ويبتون'
        }, { quoted: m });

        m.react('✅');
    } catch (error) {
        console.error('Webtoon Error:', error);
        m.react('❌');
        m.reply(te(m.prefix, m.command, m.pushName));
    }
}

export { pluginConfig as config, handler };