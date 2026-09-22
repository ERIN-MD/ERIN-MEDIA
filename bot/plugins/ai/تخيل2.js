import axios from 'axios';
import { join } from 'path';
import { createWriteStream, unlinkSync, statSync, existsSync, mkdirSync } from 'fs';

// مجلد التحميلات
const DOWNLOAD_DIR = join(process.cwd(), 'downloads');
if (!existsSync(DOWNLOAD_DIR)) mkdirSync(DOWNLOAD_DIR, { recursive: true });

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: 'تخيل2',
    alias: ['imagine2'],
    category: 'ai',
    description: 'توليد صور بالذكاء الاصطناعي',
    usage: '.تخيل2 <وصف>',
    example: '.تخيل2 قطة لطيفة',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 2,
    isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🎯 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
    const prompt = m.args.join(' ').trim();

    if (!prompt) {
        return m.reply(
            `🎨 *تخيل2*\n\n` +
            `📝 الاستخدام: \`${m.prefix}تخيل2 [وصف]\`\n` +
            `💡 مثال: \`${m.prefix}تخيل2 قطة لطيفة\``
        );
    }

    m.react('🎨');

    try {
        let englishText = prompt;
        if (/[\u0600-\u06FF]/.test(prompt)) {
            try {
                const trRes = await axios.get(
                    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodeURIComponent(prompt)}`,
                    { timeout: 8000 }
                );
                const translated = trRes.data?.[0]?.map(x => x?.[0]).filter(Boolean).join('') || prompt;
                if (translated && translated !== prompt) englishText = translated;
            } catch (e) {}
        }

        const encoded = encodeURIComponent(englishText + ', high quality, detailed');
        const seed = Math.floor(Math.random() * 999999);
        
        const urls = [
            `https://gen.pollinations.ai/image/${encoded}?model=flux&width=1024&height=1024&seed=${seed}&nologo=true`,
            `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=720&height=720`,
            `https://source.unsplash.com/720x720/?${encodeURIComponent(englishText)}`
        ];

        let sent = false;

        for (const imageUrl of urls) {
            if (sent) break;
            try {
                const filePath = join(DOWNLOAD_DIR, `img_${Date.now()}.jpg`);
                
                const imgRes = await axios({
                    method: 'GET', url: imageUrl, responseType: 'stream',
                    timeout: 60000, headers: { 'User-Agent': 'Mozilla/5.0' }
                });

                const writer = createWriteStream(filePath);
                imgRes.data.pipe(writer);
                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                const size = statSync(filePath).size;
                if (size < 3000) {
                    try { unlinkSync(filePath); } catch (e) {}
                    continue;
                }

                await sock.sendMessage(m.chat, {
                    image: { url: filePath },
                    caption: `✅ *تم التوليد*\n📝 ${prompt}`
                }, { quoted: m });

                sent = true;
                try { unlinkSync(filePath); } catch (e) {}

            } catch (e) {}
        }

        if (sent) {
            m.react('✅');
        } else {
            throw new Error('فشلت جميع المحاولات');
        }

    } catch (error) {
        console.error('❌ خطأ:', error.message);
        m.react('❌');
        m.reply(`❌ *فشل توليد الصورة*\n💡 جرب وصف بالإنجليزي`);
    }
}

export { pluginConfig as config, handler };