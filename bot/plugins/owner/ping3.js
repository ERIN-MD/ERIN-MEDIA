import { createErrorMessage } from '../../src/lib/maro-formatter.js';

const pluginConfig = {
    name: 'ping3',
    alias: ['testmeta', 'metatest'],
    category: 'owner',
    description: '🧪 اختبار Meta AI Messages',
    usage: '.ping3',
    example: '.ping3',
    isOwner: true,
    isPremium: false,
    isGroup: true,
    isPrivate: true,
    cooldown: 10,
    energi: 0,
    isEnabled: true
};

const botMeta = {
    isForwarded: true,
    forwardingScore: 1,
    forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" },
    forwardOrigin: 4
};

async function handler(m, { sock }) {
    try {
        await sock.relayMessage(m.chat, {
            senderKeyDistributionMessage: { groupId: m.chat, axolotlSenderKeyDistributionMessage: Buffer.from(Date.now().toString()) },
            extendedTextMessage: {
                endCardTiles: [],
                text: '🧪 *PING3 - Meta AI*\n\n✅ تم بنجاح\n\n© Tarboo Bot',
                contextInfo: {
                    ...botMeta,
                    externalAdReply: {
                        thumbnailUrl: 'https://i.imgur.com/TuItj4L.png',
                        thumbnail: Buffer.alloc(0),
                        sourceUrl: 'https://whatsapp.com/channel/0029VbBh4ku8aKvPx1m0l822',
                        automatedGreetingMessageShown: true,
                        greetingMessageBody: 'Tarboo Bot BOT',
                        ctaPayload: 'iniciar_chat',
                        automatedGreetingMessageCtaType: 'START_CHAT'
                    }
                }
            }
        }, { additionalNodes: [{ tag: 'biz', attrs: {}, content: [{ tag: 'interactive', attrs: { type: 'native_flow', v: '1' }, content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }] }] }] });

        await sock.relayMessage(m.chat, {
            botForwardedMessage: {
                message: {
                    richResponseMessage: {
                        submessages: [{ messageType: 2, messageText: '✅ جميع الصيغ شغالة' }],
                        messageType: 1,
                        unifiedResponse: {
                            data: Buffer.from(JSON.stringify({
                                response_id: 'ping3-' + Date.now(),
                                sections: [
                                    { view_model: { primitive: { rows: [{ is_header: true, cells: ['الصيغة', 'الحالة'] }, { is_header: false, cells: ['Meta Card', '✅'] }], __typename: 'GenATableUXPrimitive' }, __typename: 'GenAISingleLayoutViewModel' } },
                                    { view_model: { primitives: [{ prompt_text: '✅ تم', prompt_type: 'SUGGESTED_PROMPT', __typename: 'GenAIFollowUpSuggestionPillPrimitive' }], __typename: 'GenAIActionRowLayoutViewModel' } }
                                ]
                            })).toString('base64')
                        },
                        contextInfo: botMeta
                    }
                }
            }
        }, {});

    } catch (e) {
        return m.reply(createErrorMessage(e.message));
    }
}

export { pluginConfig as config, handler };