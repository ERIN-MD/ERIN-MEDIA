import { generateWAMessageFromContent, prepareWAMessageMedia, proto } from 'maro';

const pluginConfig = {
    name: 'اطار',
    alias: ['twibbon', 'frame', 'twibbonize', 'إطار'],
    category: 'search',
    description: 'بحث عن إطارات Twibbonize مع كاروسل',
    usage: '.اطار <بحث>',
    example: '.اطار رمضان',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: true,
    cooldown: 10,
    energi: 1,
    isEnabled: true,
};

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };

async function handler(m, { sock }) {
    const query = m.args?.join(' ')?.trim();
    
    if (!query) {
        return m.reply(`🖼️ *إطارات*\n\n.اطار رمضان\n.اطار عيد\n.اطار حب`);
    }

    await m.react('🖼️');

    try {
        const res = await fetch(`https://virix-api.vercel.app/api/twibbonize/search?q=${encodeURIComponent(query)}`, { headers: HEADERS });
        const data = await res.json();

        if (!data?.status || !data?.campaigns?.length) {
            await m.react('❌');
            return m.reply(`❌ لا توجد إطارات لـ: *${query}*`);
        }

        const camps = data.campaigns.slice(0, 8);
        const cards = [];

        for (const c of camps) {
            try {
                const media = await prepareWAMessageMedia({ image: { url: c.thumbnail } }, { upload: sock.waUploadToServer });
                cards.push({
                    body: proto.Message.InteractiveMessage.Body.fromObject({ text: `*${c.name}*\n👁️ ${c.hit} مشاهد` }),
                    footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: 'اضغط للمشاهدة' }),
                    header: proto.Message.InteractiveMessage.Header.fromObject({
                        title: c.name,
                        hasMediaAttachment: true,
                        imageMessage: media.imageMessage
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                        buttons: [{
                            name: "cta_url",
                            buttonParamsJson: JSON.stringify({ display_text: "🔗 فتح", url: `https://twibbonize.com/${c.url}`, merchant_url: `https://twibbonize.com/${c.url}` })
                        }]
                    })
                });
            } catch (e) {}
        }

        if (!cards.length) throw new Error('فشل إنشاء البطاقات');

        const msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        body: proto.Message.InteractiveMessage.Body.create({ text: `🖼️ *إطارات: ${query}*\n📊 ${data.total} إطار\n👆 اسحب لليسار` }),
                        footer: proto.Message.InteractiveMessage.Footer.create({ text: 'Tarboo Bot BOT' }),
                        carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({ cards })
                    })
                }
            }
        }, { quoted: m });

        await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
        await m.react('✅');

    } catch (e) {
        await m.react('❌');
        console.error('[اطار]', e.message);
    }
}

export { pluginConfig as config, handler };