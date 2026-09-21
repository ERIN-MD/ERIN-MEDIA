import axios from 'axios';
import { createStickerFromImage, createStickerFromVideo } from '../../src/lib/maro-exif.js';

const pluginConfig = {
    name: 'صفع',
    alias: ['slap'],
    category: 'fun',
    description: 'صفع شخص بملصق أنمي متحرك (حجم كبير)',
    usage: '.صفع @شخص',
    example: '.صفع @شخص',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
};

async function handler(m, { sock }) {
    const senderId = m.sender;
    let targetId, targetName, senderName;

    if (m.isGroup) {
        if (m.mentionedJid?.length) {
            targetId = m.mentionedJid[0];
        } else if (m.quoted?.sender) {
            targetId = m.quoted.sender;
        } else {
            await m.reply(`*[😡] اعمل منشن على الشخص اللي مدايقك*\n\n*مثال:*\n${m.prefix}صفع @منشن`);
            return;
        }
    } else {
        targetId = senderId;
    }

    targetName = targetId.split('@')[0];
    senderName = senderId.split('@')[0];

    let imageBuffer = null;
    let isVideo = false;

    const apis = [
        {
            name: 'nekos.best',
            url: 'https://nekos.best/api/v2/slap',
            parse: async (res) => {
                const result = res.data.results[0];
                const imgRes = await axios.get(result.url, { responseType: 'arraybuffer', timeout: 15000 });
                return { buffer: Buffer.from(imgRes.data), type: imgRes.headers['content-type'] };
            }
        }
    ];

    for (const api of apis) {
        try {
            const response = await axios.get(api.url, { timeout: 10000 });
            const { buffer, type } = await api.parse(response);
            imageBuffer = buffer;
            isVideo = type?.includes('gif') || type?.includes('video') || false;
            if (imageBuffer.length >= 20000) break;
        } catch (err) {
            console.warn(`فشل جلب الصورة من ${api.name}:`, err.message);
        }
    }

    if (!imageBuffer) {
        await m.reply('❌ فشل جلب صورة الصفع، حاول لاحقاً');
        return;
    }

    await m.react('😡');

    try {
        let stickerBuffer;
        
        if (isVideo) {
            stickerBuffer = await createStickerFromVideo(imageBuffer, {
                packname: `${senderName} صفع ${targetName}`,
                author: 'Tarboo Bot BOT',
                emojis: ['😡', '👋']
            });
        } else {
            stickerBuffer = await createStickerFromImage(imageBuffer, {
                packname: `${senderName} صفع ${targetName}`,
                author: 'Tarboo Bot BOT',
                emojis: ['😡', '👋']
            });
        }

        await sock.sendMessage(m.chat, {
            sticker: stickerBuffer
        }, { quoted: m });

    } catch (stickerError) {
        console.error('فشل إنشاء الملصق:', stickerError);
        try {
            if (isVideo) {
                await sock.sendMessage(m.chat, {
                    video: imageBuffer,
                    caption: `${senderName} صفع ${targetName}`,
                    gifPlayback: true
                }, { quoted: m });
            } else {
                await sock.sendMessage(m.chat, {
                    image: imageBuffer,
                    caption: `${senderName} صفع ${targetName}`
                }, { quoted: m });
            }
        } catch (e) {
            await m.reply('❌ فشل الإرسال');
        }
    }
}

export { pluginConfig as config, handler };
