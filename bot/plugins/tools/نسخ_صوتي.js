import FormData from 'form-data'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import config from '../../config.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'نسخ_صوتي',
    alias: ['stt'],
    category: 'tools',
    description: 'تحويل الملاحظة الصوتية إلى نص',
    usage: '.نسخ_صوتي (رد على ملاحظة صوتية)',
    example: '.نسخ_صوتي',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 2,
    isEnabled: true
};

function convertToWav(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        exec(
            `ffmpeg -y -i "${inputPath}" -ar 16000 -ac 1 -f wav "${outputPath}"`,
            { timeout: 30000 },
            (err) => err ? reject(err) : resolve()
        );
    });
}

async function transcribeWithGroq(audioBuffer, apiKey) {
    const form = new FormData();
    form.append('file', audioBuffer, { filename: 'audio.wav', contentType: 'audio/wav' });
    form.append('model', 'whisper-large-v3');
    form.append('language', 'ar');
    form.append('response_format', 'json');
    
    const { data } = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', form, {
        headers: {
            ...form.getHeaders(),
            'Authorization': `Bearer ${apiKey}`
        },
        timeout: 60000,
        maxContentLength: Infinity
    });
    return data.text || '';
}

async function handler(m, { sock }) {
    const quoted = m.quoted || m;
    const isAudio = quoted.type === 'audioMessage' || /audio/.test(quoted.mimetype || '');
    
    if (!isAudio) {
        return m.reply(
            `🎤 *النسخ الصوتي*\n\n` +
            `> قم بالرد على ملاحظة صوتية أو ملف صوتي لتحويله إلى نص\n` +
            `> مثال: رد على VN → اكتب \`${m.prefix}نسخ_صوتي\``
        );
    }

    const groqKey = config.APIkey?.groq;
    if (!groqKey) {
        return m.reply(
            `❌ *فشل*\n\n` +
            `> مفتاح API لـ Groq غير مضبوط\n` +
            `> ضعه في config.js → APIkey.groq\n` +
            `> مجاني على https://console.groq.com`
        );
    }

    m.react('🎤');
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const inputFile = path.join(tmpDir, `stt_${Date.now()}.ogg`);
    const wavFile = path.join(tmpDir, `stt_${Date.now()}.wav`);

    try {
        const buffer = await quoted.download();
        if (!buffer || buffer.length < 1000) {
            m.react('❌');
            return m.reply('❌ الملف الصوتي صغير جداً أو فشل التحميل');
        }

        fs.writeFileSync(inputFile, buffer);
        await convertToWav(inputFile, wavFile);
        const wavBuffer = fs.readFileSync(wavFile);
        const text = await transcribeWithGroq(wavBuffer, groqKey);

        if (!text || text.trim() === '') {
            m.react('❌');
            return m.reply('❌ لم يتم التعرف على الصوت. تأكد من أن الصوت واضح وليس قصيراً جداً.');
        }

        await m.reply(
            `🎤 *النسخ الصوتي*\n\n` +
            `╭┈┈⬡「 📝 *النتيجة* 」\n` +
            `┃\n` +
            `┃ ${text}\n` +
            `┃\n` +
            `╰┈┈⬡\n\n` +
            `> 🤖 النموذج: Whisper Large V3\n` +
            `> 🌐 اللغة: العربية\n` +
            `> 📊 الحجم: ~${(buffer.length / 1024).toFixed(1)} كيلوبايت`
        );
        m.react('✅');

    } catch (error) {
        m.react('❌');
        if (error.response?.status === 401) {
            return m.reply('❌ مفتاح API لـ Groq غير صالح. تحقق من config.js → APIkey.groq');
        }
        if (error.response?.status === 429) {
            return m.reply('❌ تم تجاوز حد الاستخدام لـ Groq. حاول مرة أخرى لاحقاً.');
        }
        m.reply(te(m.prefix, m.command, m.pushName));
    } finally {
        [inputFile, wavFile].forEach(f => { try { fs.unlinkSync(f); } catch {} });
    }
}

export { pluginConfig as config, handler }