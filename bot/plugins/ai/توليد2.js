import axios from 'axios';
import { createErrorMessage } from '../../src/lib/maro-formatter.js';

const API_BASE = 'https://johan-vex-apis.vercel.app/api/ai/ai-image';

async function generateImage(prompt) {
    const response = await axios.get(API_BASE, {
        params: { prompt, model: 'nano_banana', aspect_ratio: '1:1', output_format: 'png' },
        timeout: 120000
    });

    if (!response.data?.success) {
        throw new Error(response.data?.error || 'فشل توليد الصورة');
    }

    return response.data.result;
}

const pluginConfig = {
    name: 'توليد2',
    alias: ['ai2', 'flux2', 'نانو'],
    category: 'ai',
    description: '🎨 توليد صور بـ Nano Banana',
    usage: '.توليد2 [الوصف]',
    example: '.توليد2 قطة في حديقة',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 20,
    energi: 2,
    isEnabled: true
};

async function handler(m, { sock }) {
    const text = m.text || '';

    if (!text) {
        return m.reply(createErrorMessage('يرجى إدخال وصف الصورة\nمثال: .توليد2 قطة في حديقة'));
    }

    await m.react('⏳');

    try {
        const imageUrl = await generateImage(text);

        await sock.sendMessage(m.chat, {
            image: { url: imageUrl },
            caption: `\`\`\`${text}\`\`\``
        }, { quoted: m });

        await m.react('✅');

    } catch (error) {
        await m.react('❌');
        return m.reply(createErrorMessage(error.message));
    }
}

export { pluginConfig as config, handler };