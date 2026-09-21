import axios from 'axios';

function getCountryFlag(countryCode) {
    if (!countryCode) return '🌍';
    const code = countryCode.toUpperCase();
    const flag = String.fromCodePoint(...[...code].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
    return flag || '🌍';
}

function isValidIP(ip) {
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    if (ipv4Pattern.test(ip)) { const parts = ip.split('.'); return parts.every(part => parseInt(part) <= 255); }
    return ipv6Pattern.test(ip);
}

async function fetchIPInfo(ip) {
    const sources = [
        async () => {
            const url = ip ? `https://ipwho.is/${ip}` : 'https://ipwho.is/';
            const res = await axios.get(url, { timeout: 8000 });
            if (res.data?.success) {
                return {
                    ip: res.data.ip, city: res.data.city, region: res.data.region,
                    country: res.data.country, countryCode: res.data.country_code,
                    continent: res.data.continent, postal: res.data.postal,
                    timezone: res.data.timezone?.id, callingCode: res.data.calling_code,
                    currency: res.data.currency, currencyCode: res.data.currency_code,
                    isp: res.data.connection?.isp, latitude: res.data.latitude, longitude: res.data.longitude,
                    isProxy: res.data.security?.proxy, isVpn: res.data.security?.vpn, isTor: res.data.security?.tor,
                    source: 'ipwho.is'
                };
            }
            return null;
        },
        async () => {
            const url = ip ? `https://ipapi.co/${ip}/json/` : 'https://ipapi.co/json/';
            const res = await axios.get(url, { timeout: 8000 });
            if (res.data && !res.data.error) {
                return {
                    ip: res.data.ip, city: res.data.city, region: res.data.region,
                    country: res.data.country_name, countryCode: res.data.country_code,
                    continent: res.data.continent_code, postal: res.data.postal,
                    timezone: res.data.timezone, callingCode: res.data.country_calling_code,
                    currency: res.data.currency_name, currencyCode: res.data.currency,
                    isp: res.data.org, latitude: res.data.latitude, longitude: res.data.longitude,
                    asn: res.data.asn, source: 'ipapi.co'
                };
            }
            return null;
        }
    ];

    for (const fetcher of sources) {
        try { const data = await fetcher(); if (data) return data; } catch (e) {}
    }
    return null;
}

const pluginConfig = {
    name: 'ايبي',
    alias: ['ip'],
    category: 'tools',
    description: '🌍 معلومات شاملة عن عناوين IP',
    usage: '.ايبي أو .ايبي [عنوان IP]',
    example: '.ايبي 8.8.8.8',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
};

async function handler(m) {
    let ip = m.args[0] || '';

    if (ip === 'مساعدة') {
        return m.reply(
            `🌍 *فحص IP*\n\n` +
            `• .ايبي - لعرض IP الخاص بك\n` +
            `• .ايبي [عنوان IP] - لفحص IP محدد\n\n` +
            `💡 مثال: .ايبي 8.8.8.8`
        );
    }

    if (ip && !isValidIP(ip)) {
        return m.reply(`❌ *IP غير صالح*\n💡 مثال: .ايبي 8.8.8.8`);
    }

    await m.react("🌍");
    await m.reply(`🌍 *جاري فحص IP...*`);

    const data = await fetchIPInfo(ip);

    if (!data) {
        await m.react("❌");
        return m.reply('❌ *فشل جلب المعلومات*');
    }

    const flag = getCountryFlag(data.countryCode);

    let reportText = `🌍 *معلومات IP*\n\n`;
    reportText += `📍 *IP:* ${data.ip}\n`;
    reportText += `🏳️ *الدولة:* ${flag} ${data.country || 'غير معروف'} (${data.countryCode || '??'})\n`;
    if (data.city) reportText += `🏙️ *المدينة:* ${data.city}\n`;
    if (data.region) reportText += `🗺️ *المنطقة:* ${data.region}\n`;
    if (data.continent) reportText += `🌐 *القارة:* ${data.continent}\n`;
    if (data.timezone) reportText += `⏰ *التوقيت:* ${data.timezone}\n`;
    if (data.callingCode) reportText += `📞 *رمز الاتصال:* +${data.callingCode}\n`;
    if (data.currency) reportText += `💶 *العملة:* ${data.currency} (${data.currencyCode || ''})\n`;
    reportText += `📡 *المزود:* ${data.isp || 'غير معروف'}\n`;
    if (data.asn) reportText += `🔢 *ASN:* ${data.asn}\n`;

    if (data.isProxy !== undefined || data.isVpn !== undefined || data.isTor !== undefined) {
        reportText += `\n🛡️ *الأمان:*\n`;
        if (data.isProxy !== undefined) reportText += `  ${data.isProxy ? '⚠️' : '✅'} Proxy: ${data.isProxy ? 'نعم' : 'لا'}\n`;
        if (data.isVpn !== undefined) reportText += `  ${data.isVpn ? '⚠️' : '✅'} VPN: ${data.isVpn ? 'نعم' : 'لا'}\n`;
        if (data.isTor !== undefined) reportText += `  ${data.isTor ? '⚠️' : '✅'} Tor: ${data.isTor ? 'نعم' : 'لا'}\n`;
    }

    if (data.latitude && data.longitude) reportText += `\n🗺️ *الإحداثيات:* ${data.latitude}, ${data.longitude}\n`;
    reportText += `\n📡 *المصدر:* ${data.source}\n👤 *طلب:* ${m.pushName}`;

    await m.reply(reportText);
    await m.react("✅");

    // محاولة إرسال الخريطة
    if (data.latitude && data.longitude) {
        try {
            const mapUrl = `https://staticmap.maptiler.com/map?center=${data.longitude},${data.latitude}&zoom=8&size=600x300&markers=${data.longitude},${data.latitude},red`;
            await m.reply(`📍 *موقع ${data.ip}*\n${flag} ${data.city || ''}, ${data.country || ''}`, { image: { url: mapUrl } });
        } catch (e) {}
    }
}

export { pluginConfig as config, handler };