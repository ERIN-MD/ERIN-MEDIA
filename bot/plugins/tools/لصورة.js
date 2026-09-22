const pluginConfig = {
    name: 'لصورة',
    alias: ['toimg'],
    category: 'tools',
    description: 'تحويل الملصق إلى صورة',
    usage: '.لصورة (رد على ملصق)',
    example: '.لصورة',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    let mediaSource = null
    let downloadFn = null
    const selfIsSticker = m.isSticker || 
                          m.type === 'stickerMessage' || 
                          m.message?.stickerMessage
    const quotedIsSticker = m.quoted && (
        m.quoted.isSticker || 
        m.quoted.type === 'stickerMessage' || 
        m.quoted.mtype === 'stickerMessage' ||
        m.quoted.message?.stickerMessage
    )
    
    if (selfIsSticker) {
        mediaSource = 'self'
        downloadFn = m.download
    } else if (quotedIsSticker) {
        mediaSource = 'quoted'
        downloadFn = m.quoted.download
    }
    
    if (!mediaSource) {
        await m.reply(
            `❌ *فشل*\n\n` +
            `> لم يتم اكتشاف ملصق!\n\n` +
            `*طريقة الاستخدام:*\n` +
            `> 1. أرسل ملصق مع الأمر \`${m.prefix}لصورة\`\n` +
            `> 2. رد على ملصق بـ \`${m.prefix}لصورة\``
        )
        return
    }

    const stickerMsg = mediaSource === 'self' 
        ? m.message?.stickerMessage 
        : m.quoted?.message?.stickerMessage
    const isAnimated = stickerMsg?.isAnimated

    if (isAnimated) {
        await m.reply(
            `⚠️ *ملصق متحرك*\n\n` +
            `> هذا الملصق متحرك (GIF).\n` +
            `> استخدم \`${m.prefix}لفيديو\` لتحويله.`
        )
        return
    }

    await m.react('🕕')

    try {
        const buffer = await downloadFn()

        if (!buffer || buffer.length === 0) {
            await m.reply(
                `❌ *فشل*\n\n` +
                `> لا يمكن تحميل الملصق.\n` +
                `> ربما الملصق غير متوفر حالياً.`
            )
            return
        }

        if (buffer.length < 100) {
            await m.reply(
                `❌ *ملف تالف*\n\n` +
                `> ملف الملصق غير صالح أو تالف.\n` +
                `> حاول إرسال الملصق مرة أخرى.`
            )
            return
        }

        await sock.sendMedia(m.chat, buffer, null, m, {
            type: 'image'
        })

    } catch (error) {
        await m.reply(
            `❌ *خطأ*\n\n` +
            `> حدث خطأ أثناء المعالجة.\n` +
            `> _${error.message}_`
        )
    }
}

export { pluginConfig as config, handler }