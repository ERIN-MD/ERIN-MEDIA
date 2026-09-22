import axios from "axios";
import fs from "fs";
import path from "path";

const TEMP_DIR = path.join(process.cwd(), "tmp");
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

let savedMedia = {
    lastVideo: null,
    lastImage: null,
    lastAudio: null,
    lastSticker: null,
    lastDocument: null,
    lastGif: null
};

let mediaHistory = [];

function getMediaTypeName(mediaType) {
    const types = { 'image': '🖼️ صورة', 'video': '🎥 فيديو', 'audio': '🎵 صوت', 'sticker': '✨ ملصق', 'gif': '🔄 GIF', 'document': '📄 ملف' };
    return types[mediaType] || '📎 ملف';
}

function getMediaTypeFromKey(key) {
    const types = { 'lastImage': '🖼️ صورة', 'lastVideo': '🎥 فيديو', 'lastAudio': '🎵 صوت', 'lastSticker': '✨ ملصق', 'lastGif': '🔄 GIF', 'lastDocument': '📄 ملف' };
    return types[key] || '📎 ملف';
}

async function sendMedia(sock, chatId, m, mediaData, mediaKey) {
    const sizeMB = (mediaData.size / (1024 * 1024)).toFixed(2);
    const caption = `📥 *${getMediaTypeFromKey(mediaKey)}*\n💾 الحجم: ${sizeMB} MB`;

    if (mediaKey === 'lastImage') await sock.sendMessage(chatId, { image: mediaData.buffer, caption }, { quoted: m });
    else if (mediaKey === 'lastVideo') await sock.sendMessage(chatId, { video: mediaData.buffer, caption }, { quoted: m });
    else if (mediaKey === 'lastAudio') await sock.sendMessage(chatId, { audio: mediaData.buffer, mimetype: 'audio/mpeg', ptt: false }, { quoted: m });
    else if (mediaKey === 'lastSticker') await sock.sendMessage(chatId, { sticker: mediaData.buffer }, { quoted: m });
    else if (mediaKey === 'lastGif') await sock.sendMessage(chatId, { video: mediaData.buffer, gifPlayback: true, caption }, { quoted: m });
    else await sock.sendMessage(chatId, { document: mediaData.buffer, fileName: mediaData.name || 'ملف', mimetype: mediaData.mimeType, caption }, { quoted: m });
}

const pluginConfig = {
    name: "حفظ",
    alias: ["drr"],
    category: "owner",
    description: "📥 حفظ وإرسال الوسائط (صور، فيديو، صوت، ملصقات) - للمطور فقط",
    usage: ".حفظ أو .حفظ قائمة أو .حفظ [رابط]",
    example: ".حفظ",
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

async function handler(m, { sock }) {
    try {
        const quoted = m.quoted;
        const text = m.text?.trim();

        await m.react("📥");

        if (!quoted && !text) {
            const historyCount = mediaHistory.length;
            return m.reply(
                `📥 *حفظ وإرسال الوسائط*\n\n` +
                `*الاستخدام:*\n` +
                `• رد على وسائط + .حفظ → حفظ\n` +
                `• .حفظ [رابط] → حفظ من رابط\n` +
                `• .حفظ → إرسال آخر وسائط\n` +
                `• .حفظ قائمة → عرض القائمة\n` +
                `• .حفظ 1 → إرسال رقم 1\n\n` +
                `📊 الوسائط المحفوظة: ${historyCount}`
            );
        }

        if (text === "قائمة" || text === "list") {
            if (mediaHistory.length === 0) return m.reply("📭 *لا توجد وسائط محفوظة*");
            let listMessage = `📋 *قائمة الوسائط*\n`;
            for (let i = 0; i < Math.min(mediaHistory.length, 10); i++) {
                const item = mediaHistory[i];
                listMessage += `${i + 1}. ${item.type} - ${new Date(item.timestamp).toLocaleString()}\n`;
            }
            return m.reply(listMessage);
        }

        if (text && /^\d+$/.test(text)) {
            const index = parseInt(text) - 1;
            if (index < 0 || index >= mediaHistory.length) return m.reply(`❌ يوجد ${mediaHistory.length} وسائط فقط`);
            const mediaItem = mediaHistory[index];
            const mediaData = savedMedia[mediaItem.key];
            if (!mediaData) return m.reply("❌ الوسائط غير موجودة");
            await sendMedia(sock, m.chat, m, mediaData, mediaItem.key);
            return;
        }

        if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
            await m.reply(`⏳ *جاري تحميل الوسائط...*`);
            try {
                const response = await axios({ method: 'GET', url: text, responseType: 'arraybuffer', timeout: 60000, maxContentLength: 100 * 1024 * 1024 });
                const contentType = response.headers['content-type'];
                const fileBuffer = Buffer.from(response.data);
                const timestamp = Date.now();
                let mediaKey = 'lastDocument', mediaType = 'ملف';
                if (contentType.startsWith('video/')) { mediaKey = 'lastVideo'; mediaType = 'فيديو'; }
                else if (contentType.startsWith('image/')) { mediaKey = 'lastImage'; mediaType = 'صورة'; }
                else if (contentType.startsWith('audio/')) { mediaKey = 'lastAudio'; mediaType = 'صوت'; }
                savedMedia[mediaKey] = { buffer: fileBuffer, mimeType: contentType, timestamp, name: path.basename(text) || 'ملف', size: fileBuffer.length };
                mediaHistory.unshift({ key: mediaKey, type: mediaType, timestamp, name: path.basename(text), size: fileBuffer.length });
                if (mediaHistory.length > 10) mediaHistory.pop();
                await m.reply(`✅ *تم الحفظ*\n📎 ${mediaType}\n💾 ${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB`);
                await m.react("✅");
            } catch (error) { await m.reply(`❌ *فشل التحميل*\n📝 ${error.message}`); }
            return;
        }

        if (quoted) {
            const qMsg = quoted.message || {};
            const type = Object.keys(qMsg)[0];
            let buffer, mediaKey, mediaType, mediaName;

            if (type === 'imageMessage') { buffer = await quoted.download(); mediaKey = 'lastImage'; mediaType = 'صورة'; mediaName = qMsg.imageMessage?.caption || 'صورة'; }
            else if (type === 'videoMessage') { buffer = await quoted.download(); mediaKey = 'lastVideo'; mediaType = 'فيديو'; mediaName = qMsg.videoMessage?.caption || 'فيديو'; }
            else if (type === 'audioMessage') { buffer = await quoted.download(); mediaKey = 'lastAudio'; mediaType = 'صوت'; mediaName = 'صوت'; }
            else if (type === 'stickerMessage') { buffer = await quoted.download(); mediaKey = 'lastSticker'; mediaType = 'ملصق'; mediaName = 'ملصق'; }
            else if (type === 'documentMessage') { buffer = await quoted.download(); mediaKey = 'lastDocument'; mediaType = 'ملف'; mediaName = qMsg.documentMessage?.fileName || 'ملف'; }
            else { return m.reply("❌ *نوع الوسائط غير مدعوم*"); }

            if (!buffer) return m.reply("❌ فشل تحميل الوسائط");

            const timestamp = Date.now();
            const mimeType = qMsg[type]?.mimetype || 'application/octet-stream';
            savedMedia[mediaKey] = { buffer, mimeType, timestamp, name: mediaName, size: buffer.length };
            mediaHistory.unshift({ key: mediaKey, type: mediaType, timestamp, name: mediaName, size: buffer.length });
            if (mediaHistory.length > 10) mediaHistory.pop();

            await m.reply(`✅ *تم الحفظ*\n📎 ${mediaType}\n💾 ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
            await m.react("✅");
            return;
        }

        const mediaKeys = ['lastVideo', 'lastImage', 'lastAudio', 'lastSticker', 'lastGif', 'lastDocument'];
        let latestKey = null, latestTime = 0;
        for (const key of mediaKeys) { if (savedMedia[key] && savedMedia[key].timestamp > latestTime) { latestTime = savedMedia[key].timestamp; latestKey = key; } }
        if (!latestKey) return m.reply("📭 *لا توجد وسائط محفوظة*");
        await sendMedia(sock, m.chat, m, savedMedia[latestKey], latestKey);

    } catch (err) { console.error("❌ خطأ:", err); await m.reply(`❌ *حدث خطأ*\n📝 ${err.message}`); }
}

export { pluginConfig as config, handler };