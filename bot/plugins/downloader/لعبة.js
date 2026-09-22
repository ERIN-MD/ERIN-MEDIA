import axios from 'axios';

const pluginConfig = {
    name: 'لعبة',
    alias: ['game', 'games', 'ppsspp', 'تحميل_لعبة', 'psp'],
    category: 'downloader',
    description: 'تحميل ألعاب PPSSPP للأندرويد',
    usage: '.لعبة <id>',
    example: '.لعبة gta-san-andreas-ppsspp',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: true,
    cooldown: 10,
    energi: 2,
    isEnabled: true,
};

const MAX_SIZE_MB = 100;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function parseSizeToBytes(sizeStr) {
    if (!sizeStr) return Infinity;
    const match = sizeStr.toLowerCase().match(/([\d.]+)\s*(mb|gb|kb)/);
    if (!match) return Infinity;
    const num = parseFloat(match[1]);
    const unit = match[2];
    if (unit === 'gb') return num * 1024 * 1024 * 1024;
    if (unit === 'mb') return num * 1024 * 1024;
    if (unit === 'kb') return num * 1024;
    return Infinity;
}

async function handler(m, { sock }) {
    const id = m.args?.[0]?.trim();
    
    if (!id) {
        return m.reply(
            `🎮 *تحميل ألعاب PPSSPP*\n\n` +
            `.لعبة gta-san-andreas-ppsspp\n` +
            `.لعبة god-of-war-ghost-of-sparta-ppsspp`
        );
    }

    await m.react('🔍');

    try {
        const url = `https://virix-api.vercel.app/api/akonami/download?id=${encodeURIComponent(id)}`;
        const { data } = await axios.get(url, {
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        if (!data?.status) {
            await m.react('❌');
            return m.reply(`❌ لم يتم العثور على: *${id}*`);
        }

        const dl = data.downloads?.[0];
        const fileSize = parseSizeToBytes(dl?.size);

        if (fileSize <= MAX_SIZE_BYTES && fileSize > 0) {
            // ✅ الملف صغير - نرسله مباشرة
            await sock.sendMessage(m.chat, {
                document: { url: dl.url },
                fileName: `${data.title}.apk`,
                mimetype: 'application/vnd.android.package-archive',
                caption: `🎮 *${data.title}*\n📦 ${dl.size}`
            }, { quoted: m });
        } else {
            // ❌ الملف كبير - نرسل الصورة + الرابط
            await sock.sendMessage(m.chat, {
                image: { url: data.image },
                caption: 
                    `🎮 *${data.title}*\n\n` +
                    `📱 ${data.android}\n` +
                    `⭐ ${data.rating}/5\n` +
                    `📦 ${dl.size}\n\n` +
                    `⚠️ الملف كبير (>${MAX_SIZE_MB}MB)\n` +
                    `🔗 *رابط التحميل:*\n${dl.url}`,
                mimetype: 'image/jpeg'
            }, { quoted: m });
        }

        await m.react('✅');

    } catch (e) {
        await m.react('❌');
        await m.reply(`❌ فشل التحميل`);
    }
}

export { pluginConfig as config, handler };