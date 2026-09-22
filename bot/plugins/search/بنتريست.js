import axios from 'axios';
import { prepareWAMessageMedia, generateWAMessageFromContent } from "maro";
import te from "../../src/lib/maro-error.js";

// ═══════════════════════════════════════════════
// 🌐 ترجمة النص العربي إلى إنجليزي
// ═══════════════════════════════════════════════
async function translateToEnglish(text) {
    if (/^[a-zA-Z\s]+$/.test(text)) return text;
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodeURIComponent(text)}`;
        const response = await axios.get(url, { timeout: 5000 });
        if (response.data && response.data[0]) {
            return response.data[0].map(item => item[0]).join('') || text;
        }
    } catch (e) {}
    return text;
}

// ═══════════════════════════════════════════════
// 🖼️ مصادر الصور
// ═══════════════════════════════════════════════
const imageSources = {
    unsplash: async (query, count = 8) => {
        const UNSPLASH_ACCESS_KEY = 'qDvFZJpNtE7FwG8xK3mL2cR5sT9yU1vA6bN4hJ7kM8p';
        const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&client_id=${UNSPLASH_ACCESS_KEY}`;
        const response = await axios.get(url, { timeout: 15000 });
        if (response.data && response.data.results) {
            return response.data.results.map(img => ({
                id: img.id, url: img.urls.regular, thumb: img.urls.thumb,
                alt: img.alt_description || query, photographer: img.user.name, source: 'Unsplash'
            }));
        }
        throw new Error('No results');
    },
    pexels: async (query, count = 8) => {
        const PEXELS_API_KEY = 'kZPkFqVrT8x2L5mN9wB4cD6eG7hJ3sT1vY';
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}`;
        const response = await axios.get(url, { headers: { 'Authorization': PEXELS_API_KEY }, timeout: 15000 });
        if (response.data && response.data.photos) {
            return response.data.photos.map(img => ({
                id: img.id.toString(), url: img.src.large, thumb: img.src.medium,
                alt: img.alt || query, photographer: img.photographer, source: 'Pexels'
            }));
        }
        throw new Error('No results');
    },
    pixabay: async (query, count = 8) => {
        const PIXABAY_API_KEY = '25540812-faf2b76d586c1787d2dd027b6';
        const url = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=${count}`;
        const response = await axios.get(url, { timeout: 15000 });
        if (response.data && response.data.hits) {
            return response.data.hits.map(img => ({
                id: img.id.toString(), url: img.largeImageURL, thumb: img.previewURL,
                alt: img.tags || query, photographer: img.user, source: 'Pixabay'
            }));
        }
        throw new Error('No results');
    }
};

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: "بنتريست",
    alias: ["pin"],
    category: "search",
    description: "بحث عن صور عالية الجودة",
    usage: ".بنتريست <بحث>",
    example: ".بنتريست قطط",
    isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
    cooldown: 10, energi: 2, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🔍 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
    let text = m.args.join(' ').trim();
    
    if (!text) {
        return m.reply(
            `🔍 *بنتريست*\n\n` +
            `📝 الاستخدام: \`${m.prefix}بنتريست [بحث]\`\n\n` +
            `💡 أمثلة:\n` +
            `• \`${m.prefix}بنتريست قطط\`\n` +
            `• \`${m.prefix}بنتريست sunset beach\``
        );
    }
    
    m.react('🔍');

    const originalText = text;
    if (!/^[a-zA-Z\s]+$/.test(text)) {
        text = await translateToEnglish(text);
    }

    let images = [];
    let sourceName = '';
    const sources = ['unsplash', 'pexels', 'pixabay'];
    
    for (const source of sources) {
        if (images.length > 0) break;
        try {
            const result = await imageSources[source](text, 6);
            if (result && result.length > 0) {
                images = result;
                sourceName = result[0].source;
            }
        } catch (e) {}
    }

    if (images.length === 0) {
        m.react('❌');
        return m.reply(`❌ لم يتم العثور على صور لـ: "${originalText}"`);
    }

    // إرسال الصور كألبوم
    try {
        const album = await Promise.all(
            images.map(async (img) => {
                try {
                    const res = await axios.get(img.url, { responseType: "arraybuffer", timeout: 10000 });
                    return { image: Buffer.from(res.data) };
                } catch { return null; }
            })
        );

        const validAlbum = album.filter(Boolean);
        if (validAlbum.length > 0) {
            await sock.sendMessage(m.chat, { albumMessage: validAlbum }, { quoted: m });
            m.react('✅');
        } else {
            throw new Error('No images');
        }
    } catch {
        // إرسال واحدة واحدة
        for (const img of images.slice(0, 3)) {
            try {
                await sock.sendMessage(m.chat, {
                    image: { url: img.url },
                    caption: `📸 ${img.photographer || ''}`
                }, { quoted: m });
            } catch {}
        }
        m.react('✅');
    }
}

export { pluginConfig as config, handler };