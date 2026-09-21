import axios from 'axios';
import { generateWAMessageFromContent } from 'maro';
import { createErrorMessage } from '../../src/lib/maro-formatter.js';
import config from '../../config.js';
import fs from 'fs';

const API_BASE = 'https://engez.a7a.online/api/v1';

const MODELS = [
    { id: '1', label: 'Flux عام' },
    { id: '2', label: 'Flux Anime' },
    { id: '3', label: 'Flux Painting' },
    { id: '4', label: 'Flux Cartoon' },
    { id: '5', label: 'FLUX 3D' },
    { id: '6', label: 'FLUX 3D Mini' },
    { id: '7', label: 'Flux Fantasy' },
    { id: '8', label: 'Flux Sci-Fi' },
    { id: '9', label: 'Flux Realism' },
    { id: '10', label: 'Flux Nature' },
    { id: '11', label: 'Flux Impression' },
    { id: '12', label: 'Flux Surreal' },
    { id: '13', label: 'FLUX PRO' },
    { id: '14', label: 'Turbo' },
    { id: '15', label: 'Gemini Flash' },
    { id: '16', label: 'DaVinci2' },
    { id: '17', label: 'Z Turbo' },
    { id: '18', label: 'FreeGen' },
    { id: '19', label: 'Upsampler FLUX' },
    { id: '20', label: 'TextPet' }
];

async function generateImage(prompt, model) {
    const response = await axios.get(`${API_BASE}/ai/imageai`, {
        params: { prompt, model },
        timeout: 60000
    });

    if (!response.data?.success || !response.data?.response?.url) {
        throw new Error(response.data?.error || 'فشل توليد الصورة');
    }

    return response.data.response.url;
}

const pluginConfig = {
    name: 'توليد',
    alias: ['generate', 'aiimg'],
    category: 'ai',
    description: '🤖 توليد صور بالذكاء الاصطناعي بـ 20 موديل',
    usage: '.توليد [الوصف]\n.توليد [رقم] [الوصف]',
    example: '.توليد Black cat\n.توليد 15 Black cat',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 2,
    isEnabled: true
};

async function handler(m, { sock }) {
    const args = m.args || [];
    const command = m.command || '';

    // توليد 15 وصف الصورة → اختار نموذج مباشر
    if (command === 'توليد' && args.length >= 2 && /^\d+$/.test(args[0])) {
        const modelId = args[0];
        const promptText = args.slice(1).join(' ');

        await m.react('⏳');

        try {
            const imageUrl = await generateImage(promptText, modelId);

            await sock.sendMessage(m.chat, {
                image: { url: imageUrl },
                caption: `🖼️ *تم التوليد*\n📝 *الوصف:* ${promptText}`
            }, { quoted: m });

            await m.react('✅');

        } catch (error) {
            await m.react('❌');
            return m.reply(createErrorMessage(error.message));
        }
        return;
    }

    // توليد وصف الصورة → عرض القائمة
    const text = m.text || '';
    if (!text) {
        return m.reply(createErrorMessage('يرجى إدخال وصف الصورة\nمثال: .توليد Black cat\nأو: .توليد 15 Black cat'));
    }

    await m.react('⏳');

    try {
        const prefix = m.prefix || '.';
        const sharp = (await import('sharp')).default;
        const thumbBuffer = fs.existsSync(config.assets["maro2"]) 
            ? await sharp(fs.readFileSync(config.assets["maro2"])).resize(300, 170).toBuffer()
            : null;

        const modelRows = MODELS.map(model => ({
            title: model.label,
            description: `🆔 ${model.id}`,
            id: `${prefix}توليد ${model.id} ${text}`
        }));

        const content = {
            buttonsMessage: {
                buttons: [
                    {
                        buttonText: { displayText: '📋 اختر النموذج' },
                        buttonId: 'select_model',
                        type: 1,
                        nativeFlowInfo: {
                            name: 'single_select',
                            paramsJson: JSON.stringify({
                                title: '♞ النماذج المتاحة',
                                sections: [{
                                    title: `♞ ${text}`,
                                    rows: modelRows
                                }]
                            })
                        }
                    }
                ],
                locationMessage: {
                    jpegThumbnail: thumbBuffer || Buffer.alloc(0),
                    name: config.bot?.name || 'AI Generator',
                    address: '20 نموذج مختلف'
                },
                contentText: `♘ *توليد صورة*\n\n♞ *الوصف:* ${text}\n\nاختر النموذج المناسب للتوليد من الزر أدناه`,
                footerText: '♕ | Tarboo Bot',
                headerType: 6
            }
        };

        const msg = generateWAMessageFromContent(m.chat, content, { userJid: sock.user.jid, quoted: m });
        await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
        await m.react('✅');

    } catch (error) {
        await m.react('❌');
        return m.reply(createErrorMessage(error.message));
    }
}

export { pluginConfig as config, handler };