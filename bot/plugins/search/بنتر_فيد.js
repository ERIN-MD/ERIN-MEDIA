import { generateWAMessageFromContent, prepareWAMessageMedia, proto } from 'maro';

const pluginConfig = {
    name: 'بنتر_فيد',
    alias: ['pinvideo', 'pin4video', 'فيديو_بينترست', 'بينترست', 'pinter', 'بنتر'],
    category: 'search',
    description: 'بحث عن فيديوهات بينترست مع كاروسل',
    usage: '.بنتر_فيد <بحث>',
    example: '.بنتر_فيد killua',
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
        return m.reply(`🎬 *بنتر فيديو*\n\n.بنتر_فيد killua\n.بنتر_فيد anime`);
    }

    await m.react('🎬');

    try {
        const res = await fetch(`https://virix-api.vercel.app/api/pin4video/search?q=${encodeURIComponent(query)}`, { headers: HEADERS });
        const data = await res.json();

        if (!data?.status || !data?.results?.length) {
            await m.react('❌');
            return m.reply(`❌ لا توجد فيديوهات`);
        }

        const videos = data.results.slice(0, 8);
        const cards = [];

        for (const url of videos) {
            try {
                const media = await prepareWAMessageMedia({ video: { url } }, { upload: sock.waUploadToServer });
                cards.push({
                    body: proto.Message.InteractiveMessage.Body.fromObject({ text: '🎬 Pinterest' }),
                    footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: 'بنتر_فيد' }),
                    header: proto.Message.InteractiveMessage.Header.fromObject({
                        title: query,
                        hasMediaAttachment: true,
                        videoMessage: media.videoMessage
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                        buttons: [{
                            name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "🔗 فتح", url, merchant_url: url })
                        }]
                    })
                });
            } catch (e) {}
        }

        const msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: { message: { interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                body: proto.Message.InteractiveMessage.Body.create({ text: `🎬 *${query}*\n📊 ${data.total} فيديو\n👆 اسحب` }),
                footer: proto.Message.InteractiveMessage.Footer.create({ text: 'Pinterest' }),
                carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({ cards })
            })}}
        }, { quoted: m });

        await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
        await m.react('✅');

    } catch (e) {
        await m.react('❌');
    }
}

export { pluginConfig as config, handler };