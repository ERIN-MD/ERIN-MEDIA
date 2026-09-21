import axios from 'axios';
import fs from 'fs';
import path from 'path';

const pluginConfig = {
    name: 'تخيل3',
    alias: ['imagen', 'flux', 'draw3'],
    category: 'ai',
    description: 'توليد صور بـ Flux AI (23 نمط)',
    usage: '.تخيل3 <نمط> <وصف>',
    example: '.تخيل3 realistic قطة في الفضاء\n.تخيل3 anime فتاة تنظر للقمر\n.تخيل3 قائمة',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 20,
    energi: 3,
    isEnabled: true
};

// ⚠️ أمان: كان معرّف الحساب ورمز Cloudflare مكتوبين هنا صراحةً.
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const API_URL = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`;
const TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';

const STYLES = {
    'realistic': {
        prompt: 'realistic photo {prompt}. highly detailed, high budget, epic, high quality',
        negative: 'anime, cartoon, graphic, text, glitch, deformed, mutated, ugly, disfigured',
        label: '✨ واقعي'
    },
    'anime': {
        prompt: 'High-quality anime style {prompt}, vibrant colors, detailed characters, dynamic poses, soft lighting',
        negative: 'blurry, pixelated, low detail, distorted anatomy, realistic textures',
        label: '🎌 أنمي'
    },
    'manga': {
        prompt: 'manga style {prompt}. vibrant, high-energy, detailed, Japanese comic style',
        negative: 'ugly, deformed, noisy, blurry, realism, photorealistic, Western comic',
        label: '📚 مانجا'
    },
    'cartoon': {
        prompt: 'cartoon style {prompt}. cartoon, vibrant, high-energy, detailed',
        negative: 'ugly, deformed, noisy, blurry, realism, photorealistic',
        label: '🎨 كرتون'
    },
    'digital': {
        prompt: 'digital art {prompt}, artstation trending, concept art, ultra detailed, cinematic lighting, masterpiece',
        negative: 'photo, photorealistic, realism, ugly',
        label: '💻 ديجيتال'
    },
    'cyberpunk': {
        prompt: 'cyberpunk style {prompt}. extremely detailed, photorealistic, 8k, neon ambiance, futuristic',
        negative: 'anime, cartoon, text, glitch, deformed, mutated, ugly',
        label: '🤖 سايبربانك'
    },
    'fantasy': {
        prompt: 'ethereal fantasy concept art of {prompt}. magnificent, magical, epic, majestic',
        negative: 'photographic, realistic, 35mm film, text, deformed, glitch, ugly',
        label: '🧙 فانتازيا'
    },
    'ghibli': {
        prompt: 'style of studio ghibli {prompt}, Hayao Miyazaki style',
        negative: '-',
        label: '🏯 غيبلي'
    },
    'disney': {
        prompt: 'disney style {prompt}. disney cartoon, vibrant, 3d, disney styles',
        negative: 'text, painting, crayon, abstract, glitch, deformed, ugly',
        label: '🏰 ديزني'
    },
    'cinematic': {
        prompt: 'cinematic still {prompt}. emotional, vignette, highly detailed, bokeh, moody, epic, film grain',
        negative: 'anime, cartoon, graphic, text, glitch, deformed, ugly',
        label: '🎬 سينمائي'
    },
    '3d': {
        prompt: 'professional 3d model {prompt}. octane render, highly detailed, volumetric, dramatic lighting',
        negative: 'ugly, deformed, noisy, low poly, blurry, painting',
        label: '🧊 3D'
    },
    'pixel': {
        prompt: 'pixel-art style {prompt}. low-res, blocky, 8-bit graphics, pixel',
        negative: 'blurry, highly detailed, ultra textured, photo, realistic',
        label: '👾 بكسل'
    },
    'oil': {
        prompt: 'oil painting {prompt}, classical art, textured brush strokes, renaissance style, masterpiece',
        negative: 'photorealistic, 3d render, cgi, anime, cartoon, low quality',
        label: '🎨 لوحة زيتية'
    },
    'horror': {
        prompt: 'cinematic horror scene of {prompt}, dark atmosphere, fog, shadows, psychological horror',
        negative: 'bright colors, cheerful, cartoon, anime, cute, low detail',
        label: '👻 رعب'
    },
    'gta': {
        prompt: 'GTA style {prompt}, cinematic urban city, bold outlines, vibrant colors, action scene',
        negative: 'blurry, low quality, deformed, bad anatomy, dull colors',
        label: '🎮 GTA'
    },
    'neonpunk': {
        prompt: 'neonpunk style {prompt}. vaporwave, neon, vibes, stunningly beautiful, ultra modern',
        negative: 'painting, drawing, illustration, glitch, deformed, ugly',
        label: '💜 نيونبانك'
    },
    'robot': {
        prompt: 'robotic style {prompt}. cyber, futuristic, vibrant, high-energy, detailed',
        negative: 'anime, cartoon, text, painting, crayon, glitch, deformed, ugly',
        label: '🤖 روبوت'
    },
    'colorful': {
        prompt: 'colorful style {prompt}. vibrant, high-energy, detailed, cover art, dreamy',
        negative: 'text, painting, crayon, graphite, glitch, deformed, ugly',
        label: '🌈 ملون'
    },
    'glow': {
        prompt: 'glowing aura {prompt}, neon lighting, vibrant colors, cinematic lighting, high detail',
        negative: 'blurry, low quality, deformed face, distorted features, extra limbs',
        label: '✨ متوهج'
    },
    'barbie': {
        prompt: 'barbiecore aesthetic {prompt}, ultra glamorous, pink luxury, high fashion, dreamy lighting',
        negative: 'dark, horror, dull colors, gritty, low quality',
        label: '💖 باربي'
    },
    'lego': {
        prompt: 'LEGO style {prompt}, LEGO minifigure, plastic toy texture, studded surfaces, cinematic lighting',
        negative: 'realistic human skin, low quality, blurry, deformed, bad proportions',
        label: '🧱 ليغو'
    },
    'animal': {
        prompt: 'half human half animal {prompt}, fusion, detailed fur, glowing eyes, cinematic',
        negative: 'blurry, low quality, distorted anatomy, extra limbs, deformed face',
        label: '🐺 روح الحيوان'
    }
};

async function handler(m, { sock, text, prefix }) {
    if (!text) {
        let txt = `🎨 *Imagen AI - Flux 1 Schnell*\n\n`;
        txt += `📌 *الاستخدام:*\n`;
        txt += `\`${prefix}تخيل3 <نمط> <وصف>\`\n\n`;
        txt += `📌 *مثال:*\n`;
        txt += `\`${prefix}تخيل3 realistic قطة في الفضاء\`\n\n`;
        txt += `📌 *الأنماط المتاحة:*\n`;
        Object.entries(STYLES).forEach(([key, val]) => {
            txt += `  ${val.label} - \`${key}\`\n`;
        });
        txt += `\n_اكتب \`${prefix}تخيل3 قائمة\` للأنماط الكاملة_`;
        return m.reply(txt);
    }

    if (text === 'قائمة' || text === 'list') {
        let txt = `🎨 *الأنماط المتاحة*\n\n`;
        Object.entries(STYLES).forEach(([key, val]) => {
            txt += `${val.label} - \`${key}\`\n`;
        });
        return m.reply(txt);
    }

    // استخراج النمط والوصف
    const parts = text.trim().split(' ');
    const firstWord = parts[0].toLowerCase();
    const style = STYLES[firstWord];

    if (!style) {
        let txt = `❌ نمط غير معروف: *${firstWord}*\n\n`;
        txt += `الأنماط المتاحة:\n`;
        Object.keys(STYLES).forEach(k => txt += `  \`${k}\`\n`);
        txt += `\nمثال: \`${prefix}تخيل3 realistic قطة\``;
        return m.reply(txt);
    }

    const promptText = parts.slice(1).join(' ') || 'beautiful landscape';

    await m.react('🎨');
    await m.reply(`⏳ *${style.label}* - جاري توليد الصورة...\n📝 ${promptText}`);

    try {
        const finalPrompt = style.prompt.replace('{prompt}', promptText);
        const globalNegative = ', nude, nudity, nsfw, sex, erotic, explicit';
        const finalNegative = style.negative + globalNegative;

        const res = await axios.post(API_URL, {
            prompt: finalPrompt,
            negative_prompt: finalNegative,
            width: 1024,
            height: 1024,
            steps: 4,
            seed: Math.floor(Math.random() * 2147483647)
        }, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            responseType: 'arraybuffer',
            timeout: 60000
        });

        // حفظ الصورة وإرسالها
        const tmpDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        const tmpFile = path.join(tmpDir, `imagen_${Date.now()}.jpg`);
        fs.writeFileSync(tmpFile, Buffer.from(res.data));

        await sock.sendMessage(m.chat, {
            image: fs.readFileSync(tmpFile),
            caption: `🎨 *${style.label}*\n📝 ${promptText}`
        }, { quoted: m });

        fs.unlinkSync(tmpFile);
        await m.react('✅');

    } catch (e) {
        await m.react('❌');
        await m.reply(`❌ خطأ: ${e.message}`);
    }
}

export { pluginConfig as config, handler };