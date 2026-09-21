import { createErrorMessage } from '../../src/lib/maro-formatter.js';
import config from '../../config.js';
import fs from 'fs';

const pluginConfig = {
    name: 'اعلان',
    alias: ['announce', 'إعلان'],
    category: 'group',
    description: '📢 إرسال إعلان تفاعلي بصورة',
    usage: '.اعلان <النص>',
    example: '.اعلان مرحبا بالجميع',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

async function handler(m, { sock }) {
    const text = m.text?.trim();

    if (!text) {
        return m.reply('📢 *الإعلان*\n\nاكتب النص بعد الأمر\nمثال: .اعلان مرحبا بالجميع');
    }

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
            senderKeyDistributionMessage: {
                groupId: m.chat,
                axolotlSenderKeyDistributionMessage: Buffer.from(Date.now().toString())
            },
            extendedTextMessage: {
                endCardTiles: [],
                text: text + '\n\n© ' + (config.bot?.name || 'Tarboo Bot'),
                contextInfo: {
                    mentionedJid: [],
                    groupMentions: [],
                    statusAttributions: [],
                    externalAdReply: {
                        thumbnailUrl: 'https://i.imgur.com/TuItj4L.png',
                        thumbnail: thumbBuffer,
                        sourceId: Date.now().toString(),
                        sourceUrl: config.saluran?.id || 'https://whatsapp.com/channel/0029VbBh4ku8aKvPx1m0l822',
                        automatedGreetingMessageShown: true,
                        greetingMessageBody: config.bot?.name || 'Tarboo Bot',
                        ctaPayload: 'iniciar_chat',
                        automatedGreetingMessageCtaType: 'START_CHAT'
                    }
                }
            }
        }, {
            additionalNodes: [{
                tag: 'biz',
                attrs: {},
                content: [{
                    tag: 'interactive',
                    attrs: { type: 'native_flow', v: '1' },
                    content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
                }]
            }]
        });

        await m.react('📢');

    } catch (e) {
        return m.reply(createErrorMessage(e.message));
    }
}

export { pluginConfig as config, handler };