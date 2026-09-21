import axios from 'axios';

function formatDecor(text) {
    if (!text) return '';
    const top = '╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮';
    const bottom = '╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯';
    const linePrefix = '┃ ✦ ';
    
    const lines = text.split(/\r?\n/);
    const formattedLines = lines.map(line => {
        if (!line.trim()) return '┃';
        return `${linePrefix}${line}`;
    });

    return [top, ...formattedLines, bottom].join('\n');
}

const pluginConfig = {
    name: 'فضاء',
    alias: ['nasa'],
    category: 'search',
    description: '🚀 صورة اليوم الفلكية من NASA',
    usage: '.فضاء أو .فضاء 2024-01-01',
    example: '.فضاء',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
};

async function handler(m, { sock }) {
    const args = m.args || [];
    const date = args[0] || '';
    
    await m.react('🚀');
    
    try {
        const NASA_API_KEY = 'DEMO_KEY';
        let url = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`;
        
        if (date) {
            url += `&date=${date}`;
        }
        
        const response = await axios.get(url, { timeout: 15000 });
        const data = response.data;
        
        let caption = `🚀 *صورة اليوم الفلكية*\n`;
        caption += `━━━━━━━━━━━━━━━━━━\n\n`;
        caption += `📌 *العنوان:* ${data.title}\n`;
        caption += `📅 *التاريخ:* ${data.date}\n\n`;
        
        if (data.explanation) {
            const shortExplanation = data.explanation.length > 500 
                ? data.explanation.substring(0, 497) + '...' 
                : data.explanation;
            caption += `📖 *الشرح:*\n${shortExplanation}\n\n`;
        }
        
        if (data.copyright) {
            caption += `©️ *حقوق النشر:* ${data.copyright}\n`;
        }
        
        caption += `━━━━━━━━━━━━━━━━━━\n`;
        caption += `👤 *طلب:* ${m.pushName}\n`;
        caption += `💡 *للبحث بتاريخ:* .فضاء 2024-01-01`;
        
        if (data.media_type === 'image') {
            await sock.sendMessage(m.chat, {
                image: { url: data.hdurl || data.url },
                caption: formatDecor(caption)
            }, { quoted: m });
        } else if (data.media_type === 'video') {
            await m.reply(formatDecor(
                `🚀 *صورة اليوم الفلكية*\n━━━━━━━━━━━━━━━━━━\n\n` +
                `📌 *العنوان:* ${data.title}\n` +
                `🎥 *النوع:* فيديو\n` +
                `🔗 *الرابط:* ${data.url}\n\n` +
                `👤 *طلب:* ${m.pushName}`
            ));
        }
        
        await m.react('✅');
        
    } catch (error) {
        console.error('❌ خطأ في جلب صورة الفضاء:', error.message);
        await m.react('❌');
        await m.reply(formatDecor(
            `❌ *فشل جلب الصورة*\n\n` +
            `💡 *جرب:* .فضاء\n` +
            `أو بتاريخ: .فضاء 2024-01-01`
        ));
    }
}

export { pluginConfig as config, handler };