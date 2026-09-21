import axios from 'axios';
import crypto from 'crypto';

const pluginConfig = {
    name: '2شات',
    alias: ['chatgpt', 'gpt', 'chat'],
    category: 'ai',
    description: 'ChatGPT Android API',
    usage: '.شات <سؤال>',
    example: '.شات من هو رئيس مصر؟',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: true,
    cooldown: 5,
    energi: 1,
    isEnabled: true
};

const BASE_URL = 'https://android.chat.openai.com';
const UA = 'ChatGPT/1.2026.195 (Android 15; RMX3834; build 2619512)';

class ChatGPT {
    constructor() {
        this.deviceId = crypto.randomUUID();
        this.conversationId = null;
        this.parentId = null;
        this.conduitToken = null;
        this.chatReqToken = null;
        this.sessionId = crypto.randomUUID();
    }

    getHeaders() {
        const traceId = crypto.randomUUID().replace(/-/g, '');
        return {
            'User-Agent': UA,
            'oai-device-id': this.deviceId,
            'oai-client-type': 'android',
            'accept-language': 'ar-EG,ar;q=0.9',
            'x-device-tier': 'lower_mid',
            'accept': 'text/event-stream,application/json',
            'Content-Type': 'application/json'
        };
    }

    async init() {
        try {
            // Prepare
            const prepRes = await axios.post(`${BASE_URL}/backend-anon/f/conversation/prepare`, {
                action: 'next',
                messages: [],
                model: 'auto',
                history_and_training_disabled: false,
                timezone: 'Africa/Cairo',
                timezone_offset_min: -180,
                no_auth_ad_preferences: { personalization_enabled: false, history_enabled: true }
            }, {
                headers: {
                    ...this.getHeaders(),
                    'x-oai-convo-session-id': this.sessionId,
                    'x-oai-turn-trace-id': crypto.randomUUID()
                },
                timeout: 15000
            });
            if (prepRes.data?.conduit_token) this.conduitToken = prepRes.data.conduit_token;

            // Sentinel
            const sentRes = await axios.post(`${BASE_URL}/backend-anon/sentinel/chat-requirements`, {}, {
                headers: this.getHeaders(),
                timeout: 15000
            });
            if (sentRes.data?.token) this.chatReqToken = sentRes.data.token;

            return true;
        } catch { return false; }
    }

    async sendMessage(text) {
        if (!this.chatReqToken) await this.init();

        const sentinelPayload = {
            bot_token: {
                play_integrity_token: '',
                chat_requirement_token: this.chatReqToken
            }
        };

        const payload = {
            action: 'next',
            messages: [{
                id: crypto.randomUUID(),
                author: { role: 'user' },
                content: { parts: [text], content_type: 'text' },
                status: 'finished_successfully',
                recipient: 'all',
                metadata: {
                    model_slug: 'auto',
                    default_model_slug: 'auto',
                    is_visually_hidden_from_conversation: false
                }
            }],
            model: 'auto',
            history_and_training_disabled: false,
            timezone: 'Africa/Cairo',
            timezone_offset_min: -180,
            no_auth_ad_preferences: { personalization_enabled: false, history_enabled: true },
            stream: true
        };

        if (this.conversationId) payload.conversation_id = this.conversationId;
        if (this.parentId) payload.parent_message_id = this.parentId;

        const headers = {
            ...this.getHeaders(),
            'x-sentinel-payload': JSON.stringify(sentinelPayload),
            'x-conduit-token': this.conduitToken || '',
            'x-oai-convo-session-id': this.sessionId,
            'x-oai-turn-trace-id': crypto.randomUUID()
        };

        const res = await axios.post(`${BASE_URL}/backend-anon/f/conversation`, payload, {
            headers,
            responseType: 'stream',
            timeout: 60000
        });

        return new Promise((resolve) => {
            let result = '';
            res.data.on('data', chunk => {
                const lines = chunk.toString().split('\n');
                for (const line of lines) {
                    if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
                    try {
                        const json = JSON.parse(line.slice(6));
                        if (json.message?.author?.role === 'assistant' && json.message?.content?.parts) {
                            result = json.message.content.parts.join('');
                            if (json.conversation_id) this.conversationId = json.conversation_id;
                            if (json.message.id) this.parentId = json.message.id;
                        }
                    } catch {}
                }
            });
            res.data.on('end', () => resolve(result));
            setTimeout(() => resolve(result), 30000);
        });
    }
}

const chatgpt = new ChatGPT();

async function handler(m, { sock, text }) {
    if (!text) return m.reply(`🤖 *ChatGPT Android*\n\n> \`${m.prefix}شات <سؤال>\`\n\n> مثال:\n> \`${m.prefix}شات من هو رئيس مصر؟\``);

    await m.react('🤖');

    try {
        const reply = await chatgpt.sendMessage(text);
        if (reply) {
            await m.reply(reply);
            await m.react('✅');
        } else {
            await m.react('❌');
            await m.reply('❌ لم يتم الحصول على رد');
        }
    } catch (e) {
        await m.react('❌');
        await m.reply(`❌ خطأ: ${e.message}`);
    }
}

export { pluginConfig as config, handler };