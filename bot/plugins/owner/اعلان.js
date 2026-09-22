import { createErrorMessage } from '../../src/lib/maro-formatter.js';
import config from '../../config.js';
import fs from 'fs';

const pluginConfig = {
    name: 'اعلان',
    alias: ['announce', 'إعلان'],
    category: 'owner',
    description: '📢 إعلان تفاعلي',
    usage: '.اعلان <النص>',
    example: '.اعلان مرحبا بالجميع',
    isOwner: true,
    isPremium: false,
    isGroup: true,
    isPrivate: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

// ✅ Meta AI الرسمي
const botMeta = {
    isForwarded: true,
    forwardingScore: 1,
    forwardedAiBotMessageInfo: {
        botJid: "867051314767696@bot"
    },
    forwardOrigin: 4
};

async function handler(m, { sock }) {
    const text = m.text?.trim();
    if (!text) return m.reply('📢 .اعلان مرحبا بالجميع');

    try {
        const sharp = (await import('sharp')).default;
        let thumbBuffer = Buffer.alloc(0);
        try {
            const imgPath = config.assets.maro2 || config.assets.maro;
            if (fs.existsSync(imgPath)) {
                thumbBuffer = await sharp(fs.readFileSync(imgPath)).resize(300, 300).jpeg().toBuffer();
            }
        } catch {}

        await sock.relayMessage(m.chat, {
            senderKeyDistributionMessage: { groupId: m.chat, axolotlSenderKeyDistributionMessage: Buffer.from(Date.now().toString()) },
            extendedTextMessage: {
                endCardTiles: [],
                text: text,
                contextInfo: {
                    ...botMeta,
                    externalAdReply: {
                        thumbnailUrl: 'https://i.imgur.com/TuItj4L.png',
                        thumbnail: thumbBuffer,
                        sourceUrl: config.saluran?.id || 'https://whatsapp.com/channel/0029VbDjKQADeOMyA4jOPk2u',
                        automatedGreetingMessageShown: true,
                        greetingMessageBody: config.bot?.name || 'Tarboo Bot',
                        ctaPayload: 'iniciar_chat',
                        automatedGreetingMessageCtaType: 'START_CHAT'
                    }
                }
            }
        }, { additionalNodes: [{ tag: 'biz', attrs: {}, content: [{ tag: 'interactive', attrs: { type: 'native_flow', v: '1' }, content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }] }] }] });

        await m.react('📢');
    } catch (e) {
        return m.reply(createErrorMessage(e.message));
    }
}

export { pluginConfig as config, handler };