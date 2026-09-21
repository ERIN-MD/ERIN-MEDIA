const pluginConfig = {
    name: 'لايف',
    alias: ['live', 'photolive', 'livephoto'],
    category: 'tools',
    description: 'إنشاء صورة حية من فيديو وصورة',
    usage: '.لايف (أرسل صورة ورد على فيديو - أو العكس)',
    example: '.لايف',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: true,
    cooldown: 10,
    energi: 2,
    isEnabled: true
}

async function handler(m, { sock }) {
    const quoted = m.quoted || null;
    const mimeQuoted = quoted ? (quoted.message?.[quoted.type]?.mimetype || '') : '';
    const mimeMedia = m.message?.[m.type]?.mimetype || '';

    let imageBuffer, videoBuffer;

    if (/image/.test(mimeMedia) && /video/.test(mimeQuoted)) {
        imageBuffer = await m.download();
        videoBuffer = await quoted.download();
    } else if (/video/.test(mimeMedia) && /image/.test(mimeQuoted)) {
        videoBuffer = await m.download();
        imageBuffer = await quoted.download();
    } else {
        return m.reply(`📸 *Live Photo*\n\n> أرسل فيديو ورد على صورة (أو العكس)\n> مع الأمر: \`${m.prefix}لايف\``);
    }

    await m.react('⏱️');

    try {
        const { prepareWAMessageMedia, generateWAMessageFromContent } = await import('maro');

        const [imageMedia, videoMedia] = await Promise.all([
            prepareWAMessageMedia({ image: imageBuffer }, { upload: sock.waUploadToServer }),
            prepareWAMessageMedia({ video: videoBuffer }, { upload: sock.waUploadToServer })
        ]);

        const imgMsg = generateWAMessageFromContent(m.chat, {
            imageMessage: {
                ...imageMedia.imageMessage,
                contextInfo: {
                    pairedMediaType: 5,
                    statusSourceType: 0
                }
            }
        }, {});

        await sock.relayMessage(m.chat, imgMsg.message, { messageId: imgMsg.key.id });

        await sock.relayMessage(m.chat, {
            videoMessage: {
                ...videoMedia.videoMessage,
                contextInfo: {
                    pairedMediaType: 6,
                    statusSourceType: 0
                }
            },
            messageContextInfo: {
                messageAssociation: {
                    associationType: 12,
                    parentMessageKey: imgMsg.key
                }
            }
        }, {});

        await m.react('🟢');

    } catch (e) {
        console.error(e);
        await m.reply('🔴 فشل معالجة الصورة الحية');
        await m.react('🔴');
    }
}

export { pluginConfig as config, handler };