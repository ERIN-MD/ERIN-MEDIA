import { downloadContentFromMessage } from 'maro'
const pluginConfig = {
    name: 'فضح',
    alias: ['rvo'],
    category: 'group',
    description: 'فضح رسالة المشاهدة مرة واحدة المردود عليها',
    usage: '.فضح (رد على رسالة مشاهدة مرة واحدة)',
    example: '.فضح',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const quoted = m.quoted

    if (!quoted) {
        await m.reply(
            `❌ *فشل*\n\n` +
            `> رد على رسالة المشاهدة مرة واحدة بهذا الأمر!\n` +
            `> استخدم: \`${m.prefix}فضح\` (رد على رسالة 👁️)`
        )
        return
    }

    const quotedMsg = quoted.message
    if (!quotedMsg) {
        await m.reply(`❌ *الرسالة غير موجودة*\n\n> لا يمكن قراءة الرسالة المردود عليها.`)
        return
    }

    const type = Object.keys(quotedMsg)[0]
    const content = quotedMsg[type]

    if (!content) {
        await m.reply(`❌ *المحتوى غير موجود*\n\n> محتوى الرسالة لا يمكن قراءته.`)
        return
    }

    if (!content.viewOnce) {
        await m.reply(
            `❌ *ليست رسالة مشاهدة مرة واحدة*\n\n` +
            `> الرسالة المردود عليها ليست رسالة مشاهدة مرة واحدة!\n` +
            `> رد على رسالة بجانبها أيقونة 👁️.`
        )
        return
    }

    await m.react('🕕')

    try {
        let mediaType = null
        if (type.includes('image')) { mediaType = 'image' }
        else if (type.includes('video')) { mediaType = 'video' }
        else if (type.includes('audio')) { mediaType = 'audio' }

        if (!mediaType) {
            await m.reply(`النوع غير مدعوم، يدعم فقط: صورة، فيديو، صوت`)
            return
        }

        const stream = await downloadContentFromMessage(content, mediaType)
        
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }

        if (!buffer || buffer.length < 100) {
            await m.reply(`❌ *فشل التحميل*\n\n> لا يمكن تحميل الوسائط.\n> ربما انتهت صلاحيتها.`)
            return
        }

        if (mediaType === 'image') {
            await sock.sendMedia(m.chat, buffer, null, m, { type: 'image' })
        } else if (mediaType === 'video') {
            await sock.sendMedia(m.chat, buffer, null, m, { type: 'video' })
        } else if (mediaType === 'audio') {
            await sock.sendMedia(m.chat, buffer, null, m, { type: 'audio', mimetype: 'audio/mpeg', ptt: true })
        }

    } catch (error) {
        await m.reply(`❌ *خطأ*\n\n> فشل فضح رسالة المشاهدة مرة واحدة.\n> _${error.message}_`)
    }
}

export { pluginConfig as config, handler }