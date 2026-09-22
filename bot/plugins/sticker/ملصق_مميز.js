import config from '../../config.js';

function writeExif(webpBuffer, metadata) {
    const json = {
        "sticker-pack-id": metadata.stickerPackId || "",
        "sticker-pack-name": metadata.packname || "",
        "sticker-pack-publisher": metadata.author || "",
        "emojis": metadata.categories || [""],
        "premium": metadata.premium ?? 1
    };

    const exifAttr = Buffer.from([
        0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00,
        0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00
    ]);

    const jsonBuff = Buffer.from(JSON.stringify(json));
    const exifRaw = Buffer.concat([exifAttr, jsonBuff]);
    exifRaw.writeUInt32LE(jsonBuff.length, 14);

    const exifHeader = Buffer.alloc(8);
    exifHeader.write("EXIF", 0);
    exifHeader.writeUInt32LE(exifRaw.length, 4);

    const exifChunk = Buffer.concat([exifHeader, exifRaw, (exifRaw.length % 2 ? Buffer.from([0]) : Buffer.alloc(0))]);

    let offset = 12;
    let chunks = [];

    while (offset < webpBuffer.length - 8) {
        const chunkFourCC = webpBuffer.toString("ascii", offset, offset + 4);
        const chunkSize = webpBuffer.readUInt32LE(offset + 4);
        const totalSize = 8 + chunkSize + (chunkSize % 2);
        chunks.push({ fourCC: chunkFourCC, data: webpBuffer.subarray(offset, offset + totalSize) });
        offset += totalSize;
    }

    let vp8x = chunks.find(c => c.fourCC === "VP8X");
    if (vp8x) {
        vp8x.data = Buffer.from(vp8x.data);
        vp8x.data[8] |= 0b00001000;
    } else {
        let width = 0, height = 0, hasAlpha = false, hasAnim = false;
        for (const c of chunks) {
            if (c.fourCC === "VP8 ") {
                const data = c.data.subarray(8);
                width = ((data[7] << 8) | data[6]) & 0x3FFF;
                height = ((data[9] << 8) | data[8]) & 0x3FFF;
            } else if (c.fourCC === "VP8L") {
                const data = c.data.subarray(8);
                width = (((data[2] & 0x3F) << 8) | data[1]) + 1;
                height = ((((data[4] << 16) | (data[3] << 8) | data[2]) >> 6) & 0x3FFF) + 1;
                hasAlpha = !!(data[4] & 0x10);
            } else if (c.fourCC === "ALPH") {
                hasAlpha = true;
            } else if (c.fourCC === "ANIM") {
                hasAnim = true;
            }
        }

        const vp8xBuf = Buffer.alloc(18);
        vp8xBuf.write("VP8X", 0);
        vp8xBuf.writeUInt32LE(10, 4);
        let flags = 0b00001000;
        if (hasAlpha) flags |= 0x10;
        if (hasAnim) flags |= 0x02;
        vp8xBuf[8] = flags;
        vp8xBuf.writeUIntLE((width || 512) - 1, 12, 3);
        vp8xBuf.writeUIntLE((height || 512) - 1, 15, 3);
        vp8x = { fourCC: "VP8X", data: vp8xBuf };
    }

    const otherChunks = chunks.filter(c => c.fourCC !== "VP8X" && c.fourCC !== "EXIF");
    const out = Buffer.concat([webpBuffer.subarray(0, 12), vp8x.data, exifChunk, ...otherChunks.map(c => c.data)]);
    out.writeUInt32LE(out.length - 8, 4);
    return out;
}

const pluginConfig = {
    name: 'ملصق_مميز',
    alias: ['premiumsticker', 'ps'],
    category: 'sticker',
    description: 'تحويل الملصق إلى ملصق مميز (Premium)',
    usage: '.ملصق_مميز (رد على ملصق)',
    example: '.ملصق_مميز',
    isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
    cooldown: 5, energi: 1, isEnabled: true
};

async function handler(m, { sock }) {
    if (!m.quoted?.message?.stickerMessage) {
        return m.reply(`🌟 *ملصق_مميز*\n\n📌 رد على أي ملصق لتحويله إلى ملصق مميز Premium`);
    }

    m.react('🌟');

    try {
        const buffer = await m.quoted.download();
        const exifBuffer = writeExif(buffer, {
            packname: config.sticker?.packname || config.bot?.name || 'Maro',
            author: config.sticker?.author || config.owner?.name || 'Developer',
            categories: ["🌟"],
            premium: "1"
        });

        await sock.sendMessage(m.chat, { sticker: exifBuffer }, { quoted: m });
        m.react('✅');
    } catch (error) {
        console.error('PremiumSticker Error:', error);
        m.react('❌');
        m.reply(`❌ فشل: ${error.message}`);
    }
}

export { pluginConfig as config, handler };