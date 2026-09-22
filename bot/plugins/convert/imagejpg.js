import axios from "axios";
import crypto from "crypto";
import te from "../../src/lib/maro-error.js";

const imageCache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

function cacheKey(data) { return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex'); }
function getCache(key) { const c = imageCache.get(key); if (!c) return null; if (Date.now() - c.time > CACHE_TTL) { imageCache.delete(key); return null; } return c.buffer; }
function setCache(key, buffer) { if (imageCache.size > 50) { const oldestKey = [...imageCache.entries()].sort((a, b) => a[1].time - b[1].time)[0][0]; imageCache.delete(oldestKey); } imageCache.set(key, { buffer, time: Date.now() }); }

async function uploadToTemp(buffer) {
    try {
        const FormData = (await import('form-data')).default;
        const form = new FormData();
        form.append('file', buffer, { filename: 'image.jpg' });
        const res = await axios.post('https://telegra.ph/upload', form, { headers: form.getHeaders(), timeout: 30000 });
        if (res.data && res.data[0] && res.data[0].src) return 'https://telegra.ph' + res.data[0].src;
    } catch (e) {}
    try {
        const FormData = (await import('form-data')).default;
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', buffer, { filename: 'image.jpg' });
        const res = await axios.post('https://catbox.moe/user/api.php', form, { headers: form.getHeaders(), timeout: 30000 });
        if (res.data && typeof res.data === 'string') return res.data;
    } catch (e) {}
    return null;
}

async function getImage(m, sock) {
    if (m.quoted?.message?.imageMessage) { try { const buffer = await m.quoted.download(); const url = await uploadToTemp(buffer); if (url) return url; } catch (e) {} }
    if (m.message?.imageMessage) { try { const buffer = await m.download(); const url = await uploadToTemp(buffer); if (url) return url; } catch (e) {} }
    if (m.mentionedJid?.length) { try { return await sock.profilePictureUrl(m.mentionedJid[0], 'image'); } catch {} }
    try { return await sock.profilePictureUrl(m.sender, 'image'); } catch {}
    return 'https://files.catbox.moe/mqhy9t.png';
}

const pluginConfig = {
    name: 'مؤثرات',
    alias: ['effects'],
    category: 'convert',
    description: '🎨 تطبيق مؤثرات على الصور',
    usage: '.مؤثرات <نوع>',
    example: '.مؤثرات قلب',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true,
};

async function handler(m, { sock }) {
    const args = m.args || [];
    const sub = (args[0] || '').toLowerCase();
    const rest = args.slice(1);

    async function effect(endpoint, params = {}) {
        try {
            const avatar = await getImage(m, sock);
            if (!avatar) return m.reply('❌ لم أتمكن من الحصول على صورة.');

            const key = cacheKey({ endpoint, avatar, params });
            const cached = getCache(key);
            if (cached) {
                await sock.sendMessage(m.chat, { image: cached, caption: `🎨 *${sub}*` }, { quoted: m });
                return;
            }

            await m.react("🎨");
            const url = new URL(`https://api.some-random-api.com/canvas/${endpoint}`);
            url.search = new URLSearchParams({ avatar, ...params }).toString();
            const res = await axios.get(url.toString(), { responseType: 'arraybuffer', timeout: 30000 });
            const buffer = Buffer.from(res.data);
            setCache(key, buffer);

            await sock.sendMessage(m.chat, { image: buffer, caption: `🎨 *${sub}*` }, { quoted: m });
            await m.react("✅");
        } catch (e) {
            await m.react("❌");
            if (e.response?.status === 404) await m.reply('❌ هذا المؤثر غير متوفر حالياً.');
            else await m.reply('❌ حدث خطأ أثناء تطبيق المؤثر.');
        }
    }

    try {
        switch (sub) {
            case 'قلب': return effect('misc/heart');
            case 'سجن': return effect('jail');
            case 'يوتيوب': {
                const parts = rest.join(' ').split('|').map(s => s?.trim());
                if (!parts[0] || !parts[1]) return m.reply(`❗ ${m.prefix}مؤثرات يوتيوب اسم|تعليق`);
                return effect('misc/youtube-comment', { username: parts[0], comment: parts[1] });
            }
            case 'تويت': {
                const parts = rest.join(' ').split('|').map(s => s?.trim());
                if (!parts[0] || !parts[1] || !parts[2]) return m.reply(`❗ ${m.prefix}مؤثرات تويت اسم|معرف|تعليق`);
                return effect('misc/tweet', { displayname: parts[0], username: parts[1], comment: parts[2], theme: parts[3] || 'light' });
            }
            case 'وانتد': return effect('wanted');
            case 'ضباب': return effect('blur');
            case 'تلوين': return effect('color');
            case 'رمادي': return effect('greyscale');
            case 'عكس': return effect('invert');
            case 'سيبيا': return effect('sepia');
            case 'حذف_احمر': return effect('red');
            case 'حذف_اخضر': return effect('green');
            case 'حذف_ازرق': return effect('blue');
            case 'مشطوب': return effect('overlay/hitler');
            case 'محروق': return effect('overlay/burn');
            case 'مبتل': return effect('overlay/wet');
            case 'مخدش': return effect('overlay/scratched');
            case 'مشوه': return effect('overlay/distort');
            default:
                return m.reply(
                    `🎨 *مؤثرات الصور*\n\n` +
                    `🎨 أساسية: قلب، سجن، وانتد، ضباب\n` +
                    `🌈 ألوان: تلوين، رمادي، عكس، سيبيا\n` +
                    `🎭 تأثيرات: مشطوب، محروق، مبتل، مشوه\n` +
                    `💬 نصوص: يوتيوب اسم|تعليق، تويت اسم|معرف|تعليق\n\n` +
                    `📌 مثال: ${m.prefix}مؤثرات قلب`
                );
        }
    } catch (e) {
        await m.reply('❌ حدث خطأ.');
    }
}

export { pluginConfig as config, handler };