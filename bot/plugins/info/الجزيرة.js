const pluginConfig = {
    name: 'الجزيرة',
    alias: ['aljazeera', 'اخبار', 'news'],
    category: 'info',
    description: 'آخر أخبار الجزيرة مباشر',
    usage: '.الجزيرة',
    example: '.الجزيرة',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };

async function handler(m, { sock }) {
    await m.react('📰');

    try {
        const res = await fetch('https://virix-api.vercel.app/api/aljazeera/news', { headers: HEADERS });
        const data = await res.json();

        if (!data?.status) {
            await m.react('❌');
            return m.reply('❌ فشل تحميل الأخبار');
        }

        let text = `📰 *الجزيرة مباشر*\n\n`;
        text += `🔴 *${data.mainHeadline}*\n\n`;
        
        if (data.liveUpdates?.length) {
            data.liveUpdates.slice(0, 10).forEach((u, i) => text += `• ${u}\n\n`);
        }
        
        text += `🔗 *للمزيد:* ${data.liveUrl || data.source}`;

        await m.reply(text);
        await m.react('✅');

    } catch (e) {
        await m.react('❌');
    }
}

export { pluginConfig as config, handler };