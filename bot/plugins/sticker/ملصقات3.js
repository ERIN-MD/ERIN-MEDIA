import axios from 'axios';

const pluginConfig = {
    name: 'ملصقات3',
    alias: ['stickercloud', 'سحابة', 'ملصقات_كلود', 'sp3'],
    category: 'sticker',
    description: 'بحث عن حزم ملصقات من StickerCloud وإرسالها كحزمة',
    usage: '.ملصقات3 <بحث>',
    example: '.ملصقات3 cat',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: true,
    cooldown: 10,
    energi: 2,
    isEnabled: true,
};

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };

async function handler(m, { sock }) {
    const query = m.args?.join(' ')?.trim();
    
    if (!query) {
        return m.reply(`🎨 *ملصقات3*\n\n.ملصقات3 cat\n.ملصقات3 love`);
    }

    await m.react('🎨');

    try {
        const res = await fetch(`https://virix-api.vercel.app/api/stickercloud/search?q=${encodeURIComponent(query)}`, { headers: HEADERS });
        const data = await res.json();

        if (!data?.status || !data?.result?.data?.length) {
            await m.react('❌');
            return m.reply(`❌ لا توجد ملصقات`);
        }

        const pack = data.result.data[0];
        const stickers = pack.stickers?.slice(0, 22) || [];
        const buffers = [];

        for (const s of stickers) {
            try {
                const r = await axios.get(s.sticker_src, { responseType: 'arraybuffer', timeout: 15000, headers: HEADERS });
                buffers.push(Buffer.from(r.data));
            } catch (e) {}
        }

        if (!buffers.length) {
            await m.react('❌');
            return m.reply('❌ فشل التحميل');
        }

        await sock.sendStickerPack(m.chat, buffers, m, {
            name: pack.name || query,
            packname: pack.name || query,
            publisher: pack.author?.username || 'StickerCloud',
            author: pack.author?.username || 'StickerCloud'
        });

        await m.react('✅');

    } catch (e) {
        await m.react('❌');
    }
}

export { pluginConfig as config, handler };