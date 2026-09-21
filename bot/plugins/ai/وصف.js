import axios from 'axios';
import FormData from 'form-data';
import { createErrorMessage } from '../../src/lib/maro-formatter.js';

const pluginConfig = {
    name: 'وصف',
    alias: ['تحليل', 'img2prompt'],
    category: 'ai',
    description: 'تحليل الصورة وتحويلها لوصف نصي بالذكاء الاصطناعي',
    usage: '.وصف (رد على صورة)',
    example: '.وصف',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 3,
    isEnabled: true
};

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && (m.quoted.isImage || m.quoted.type === 'imageMessage'));
    
    if (!isImage) {
        return m.reply(`📌 *تحليل الصور*\n\n• رد على صورة ثم اكتب: \`${m.prefix}وصف\``);
    }

    m.react('⏳');

    try {
        let mediaBuffer;
        if (m.quoted && m.quoted.isMedia) {
            mediaBuffer = await m.quoted.download();
        } else if (m.isMedia) {
            mediaBuffer = await m.download();
        }

        if (!mediaBuffer || mediaBuffer.length === 0) throw new Error('فشل تحميل الصورة');

        const formData = new FormData();
        formData.append('source', mediaBuffer, { filename: `image-${Date.now()}.jpg` });
        formData.append('type', 'file');
        formData.append('action', 'upload');

        const uploadResponse = await axios({
            method: 'POST',
            url: 'https://imgbb.com/json',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
                'Referer': 'https://imgbb.com/',
                'Origin': 'https://imgbb.com',
                ...formData.getHeaders()
            },
            data: formData,
            timeout: 30000
        });

        const imageUrl = uploadResponse.data?.image?.url;
        if (!imageUrl) throw new Error('فشل رفع الصورة');

        const params = new URLSearchParams();
        params.append('imageUrl', imageUrl);

        const apiResponse = await axios.get(`https://engez.a7a.online/api/v1/tools/img2prompt?${params.toString()}`, {
            timeout: 60000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        if (!apiResponse.data?.success) throw new Error(apiResponse.data?.error || 'فشل توليد الوصف');

        const result = apiResponse.data.response;
        const promptAr = result.arabic || result.prompt || 'لم يتم العثور على وصف';

        await m.reply(`📝 *وصف الصورة*\n\n${promptAr}\n\n✅ تم التحليل بنجاح`);
        m.react('✅');

    } catch (error) {
        m.react('❌');
        return m.reply(createErrorMessage(error.message));
    }
}

export { pluginConfig as config, handler };