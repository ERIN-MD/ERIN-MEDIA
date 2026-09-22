import axios from 'axios';
import { createErrorMessage } from '../../src/lib/maro-formatter.js';

const API_BASE = 'https://engez.a7a.online/api/v1';

async function downloadInstagram(url) {
    const sources = ['yt5s', 'indown', 'saveig'];
    let lastError = null;

    for (const source of sources) {
        try {
            const params = new URLSearchParams();
            params.append('url', url);
            params.append('source', source);

            const response = await axios.get(`${API_BASE}/download/instagram?${params.toString()}`, {
                timeout: 30000
            });

            if (response.data?.success) {
                const result = response.data.result || response.data.response || response.data.data;
                if (result && Array.isArray(result)) {
                    const video = result.find(item => item.type === 'video' || item.url?.includes('.mp4'));
                    if (video?.url) {
                        return { success: true, source, videoUrl: video.url };
                    }
                }
                if (typeof result === 'object' && result.url) {
                    return { success: true, source, videoUrl: result.url };
                }
            }
        } catch (error) {
            lastError = error.message;
            continue;
        }
    }

    throw new Error(`فشل التحميل: ${lastError || 'جميع المصادر فشلت'}`);
}

const pluginConfig = {
    name: 'انستا',
    alias: ['insta', 'instagram', 'ig'],
    category: 'downloader',
    description: '📥 تحميل فيديو انستغرام',
    usage: '.انستا <رابط>',
    example: '.انستا https://www.instagram.com/reel/xxx/',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 2,
    isEnabled: true
};

async function handler(m, { sock }) {
    const url = m.text?.trim();

    if (!url) return m.reply('❌ .انستا https://www.instagram.com/reel/xxx/');
    if (!url.includes('instagram.com')) return m.reply('❌ *رابط غير صحيح*');

    await m.react('⏳');

    try {
        const result = await downloadInstagram(url);

        await sock.sendMessage(m.chat, {
            video: { url: result.videoUrl },
            caption: `✅ *تم التحميل*\n📥 المصدر: ${result.source}`
        }, { quoted: m });

        await m.react('✅');

    } catch (error) {
        await m.react('❌');
        return m.reply(createErrorMessage(error.message));
    }
}

export { pluginConfig as config, handler };