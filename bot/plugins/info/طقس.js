const pluginConfig = {
    name: 'طقس',
    alias: ['weather', 'جو', 'الطقس'],
    category: 'info',
    description: 'معرفة حالة الطقس لأي مدينة',
    usage: '.طقس <المدينة>',
    example: '.طقس الدار البيضاء',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };

// ✨ إيموجي حسب وصف الطقس
const WEATHER_EMOJI = {
    'sunny': '☀️', 'clear': '☀️',
    'cloudy': '☁️', 'overcast': '☁️',
    'rain': '🌧️', 'drizzle': '🌦️', 'showers': '🌧️',
    'thunder': '⛈️', 'storm': '⛈️',
    'snow': '❄️', 'fog': '🌫️', 'mist': '🌫️',
    'wind': '💨', 'partly cloudy': '⛅'
};

function getEmoji(desc) {
    if (!desc) return '🌈';
    const lower = desc.toLowerCase();
    for (const [key, emoji] of Object.entries(WEATHER_EMOJI)) {
        if (lower.includes(key)) return emoji;
    }
    return '🌈';
}

async function handler(m, { sock }) {
    const city = m.args?.join(' ')?.trim();
    
    if (!city) {
        return m.reply(`🌤️ *طقس*\n\n.طقس الدار البيضاء\n.طقس الرياض\n.طقس القاهرة`);
    }

    await m.react('🌤️');

    try {
        const res = await fetch(`https://virix-api.vercel.app/api/weather/weather?city=${encodeURIComponent(city)}`, { headers: HEADERS });
        const data = await res.json();

        if (!data?.status) {
            await m.react('❌');
            return m.reply(`❌ لم يتم العثور على: *${city}*`);
        }

        const l = data.location;
        const c = data.current;
        const f = data.forecast;
        const emoji = getEmoji(c.description);

        let text = `${emoji} *${l.city}, ${l.country}*\n\n`;
        text += `🌡️ *الحرارة:* ${c.tempC}°C\n`;
        text += `🤔 *الإحساس:* ${c.feelsLikeC}°C\n`;
        text += `💧 *الرطوبة:* ${c.humidity}\n`;
        text += `🌬️ *الرياح:* ${c.windSpeedKmph} كم/س\n`;
        text += `👁️ *الرؤية:* ${c.visibilityKm} كم\n`;
        text += `📝 *الوصف:* ${c.description}\n\n`;
        text += `📅 *التوقعات:*\n`;
        f.forEach(d => {
            const e = getEmoji(d.description);
            text += `  ${e} ${d.date}: ${d.minTempC}° / ${d.maxTempC}°\n`;
        });

        await m.reply(text);
        await m.react('✅');

    } catch (e) {
        await m.react('❌');
    }
}

export { pluginConfig as config, handler };