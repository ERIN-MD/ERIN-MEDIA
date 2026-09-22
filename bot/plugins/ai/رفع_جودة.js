import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import te from '../../src/lib/maro-error.js';

// ═══════════════════════════════════════════════
// 🔧 إعدادات السكرابر
// ═══════════════════════════════════════════════
const COOKIE = "cf_clearance=24txQjIRrNFlQkG1Dw3385bpI1T9jhaUE4HgGDOODkc-1766044598-1.2.1.1-es78ywtWLJGPH2MHnSB0obbSe6QFLbQULaNndpJbFjs9z9H2TL2SRP4rxUFSFXh4m4_2K0o0Jz99kzEDfstdlWrsIMm21IfSXWte_oT7vC9EgJXzngKk9I36LeNnGzEk3UIS_qMrQZ1_T5zuXX43EAEAfdQSHB1IxPflwHmMkNe8dtHDauYf4RqQexmTzB_q6PdyuJfSGndlvQVtixfapxOLHwLxBM8qVSjZ2.q1Ybw; _ga=GA1.1.361816903.1766044600;";
const USER_AGENT = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36";

const COMMON_HEADERS = {
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cookie': COOKIE,
    'Origin': 'https://imgupscaler.com',
    'Referer': 'https://imgupscaler.com/',
    'Sec-Ch-Ua': '"Chromium";v="137", "Not/A)Brand";v="24"',
    'Sec-Ch-Ua-Mobile': '?1',
    'Sec-Ch-Ua-Platform': '"Android"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'User-Agent': USER_AGENT
};

// ═══════════════════════════════════════════════
// 📤 رفع الصورة
// ═══════════════════════════════════════════════
async function uploadImage(buffer, filename = 'image.jpg') {
    const form = new FormData();
    form.append('tool', 'upscaler');
    form.append('mode', 'batch');
    form.append('scaleRadio', '2');
    form.append('file', buffer, { filename });

    const response = await axios.post('https://imgupscaler.com/api/legacy/upload', form, {
        headers: { ...COMMON_HEADERS, ...form.getHeaders() }
    });

    const taskId = response.data?.data?.code || response.data?.taskId;
    if (!taskId) throw new Error("فشل الحصول على taskId");
    return taskId;
}

// ═══════════════════════════════════════════════
// 🔄 التحقق من حالة المعالجة
// ═══════════════════════════════════════════════
async function checkStatus(taskId) {
    const payload = { tool: "upscaler", taskId, scaleRadio: "2" };
    let attempts = 0;
    const maxAttempts = 15;

    while (attempts < maxAttempts) {
        attempts++;
        try {
            const response = await axios.post('https://imgupscaler.com/api/legacy/status', payload, {
                headers: { ...COMMON_HEADERS, 'Content-Type': 'application/json' }
            });

            const status = response.data?.status || response.data?.raw?.data?.status;

            if (status === 'success') {
                const urls = response.data?.downloadUrls || response.data?.raw?.data?.downloadUrls;
                if (urls && urls.length > 0) return urls[0];
            }
            await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (error) {
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
    throw new Error("انتهت المهلة. فشل الحصول على رابط التحميل.");
}

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: 'رفع_جودة',
    alias: ['upscale'],
    category: 'ai',
    description: 'تحسين جودة الصورة (Upscale)',
    usage: '.رفع_جودة (رد على صورة)',
    example: '.رفع_جودة',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 20,
    energi: 3,
    isEnabled: true
};

// ═══════════════════════════════════════════════
// 🎯 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && (m.quoted.isImage || m.quoted.type === 'imageMessage'));

    if (!isImage) {
        return m.reply(
            `🖼️ *تحسين الجودة*\n\n` +
            `• رد على صورة ثم اكتب: \`${m.prefix}رفع_جودة\`\n\n` +
            `💡 *مثال:* رد على صورة واكتب \`${m.prefix}رفع_جودة\``
        );
    }

    m.react('⏳');
    await m.reply('🔄 جاري تحسين جودة الصورة...');

    try {
        let mediaBuffer;
        if (m.quoted && m.quoted.isMedia) {
            mediaBuffer = await m.quoted.download();
        } else if (m.isMedia) {
            mediaBuffer = await m.download();
        }

        if (!mediaBuffer || mediaBuffer.length === 0) {
            throw new Error('فشل تحميل الصورة');
        }

        const taskId = await uploadImage(mediaBuffer);
        const downloadUrl = await checkStatus(taskId);

        const response = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
        const enhancedBuffer = Buffer.from(response.data);

        await sock.sendMessage(m.chat, {
            image: enhancedBuffer,
            caption: '✅ *تم تحسين الجودة بنجاح!*'
        }, { quoted: m });

        m.react('✅');

    } catch (error) {
        console.error('خطأ في تحسين الصورة:', error);
        m.react('❌');
        m.reply(`❌ فشل تحسين الصورة: ${error.message}`);
    }
}

export { pluginConfig as config, handler };