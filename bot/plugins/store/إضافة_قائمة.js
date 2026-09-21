// إضافة_قائمة - أمر لإضافة معلومات متجر جديدة (فقط في المحادثة الخاصة)

import { getDatabase } from '../../src/lib/maro-database.js'
import axios from 'axios'
import FormData from 'form-data'

const pluginConfig = {
    name: 'إضافة_قائمة',
    alias: ['addlist'],
    category: 'store',
    description: '➕ إضافة معلومات متجر جديدة (فقط في المحادثة الخاصة)',
    usage: '.إضافة_قائمة <الاسم>|<المحتوى>',
    example: '.إضافة_قائمة الشروط والأحكام|1. لا يمكن إلغاء الشراء;;2. ضمان 7 أيام',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: true,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

async function uploadToCatbox(buffer, filename = 'file.jpg') {
    try {
        const form = new FormData()
        form.append('fileToUpload', buffer, { filename })
        form.append('reqtype', 'fileupload')
        const res = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: form.getHeaders(),
            timeout: 30000
        })
        return res.data?.startsWith('http') ? res.data : null
    } catch {
        return null
    }
}

async function handler(m, { sock }) {
    if (m.isGroup) {
        return m.reply(
            `🚫 *تم رفض الوصول*\n\n` +
            `للحفاظ على أمان البيانات 🛡️، يمكن إضافة المعلومات فقط في *المحادثة الخاصة*.\n\n` +
            `يرجى التحدث مع البوت مباشرة 📱، ثم اكتب:\n` +
            `\`${m.prefix}إضافة_قائمة <الاسم>|<المحتوى>\``
        )
    }

    const db = getDatabase()
    const text = m.text?.trim() || ''
    const pipeIdx = text.indexOf('|')

    if (pipeIdx === -1) {
        return m.reply(
            `➕ *إضافة معلومات المتجر*\n\n` +
            `📋 الصيغة:\n` +
            `\`${m.prefix}إضافة_قائمة <الاسم>|<المحتوى>\`\n\n` +
            `📌 *المعلمات:*\n` +
            `• *الاسم* — عنوان المعلومات (حد أدنى 2 حرف)\n` +
            `• *المحتوى* — محتوى المعلومات (استخدم \`;;\` لسطر جديد)\n\n` +
            `📝 *مثال:*\n` +
            `\`${m.prefix}إضافة_قائمة الشروط والأحكام|1. لا يمكن إلغاء الشراء;;2. ضمان 7 أيام;;3. تواصل مع المدير للمطالبة\`\n` +
            `\`${m.prefix}إضافة_قائمة طريقة الطلب|1. اكتب .قائمة_المنتجات;;2. اختر المنتج;;3. اكتب .شراء <الرقم>\`\n\n` +
            `🖼️ *نصيحة:*\n` +
            `• أرسل صورة/فيديو أولاً، ثم رد على تلك الوسائط مع الأمر لإضافة وسائط 📸\n` +
            `• استخدم \`;;\` لإنشاء سطر جديد في المحتوى ✍️\n` +
            `• يمكن للجميع مشاهدة هذه المعلومات عبر \`.قائمة\` 👥`
        )
    }

    const name = text.substring(0, pipeIdx).trim()
    const content = text.substring(pipeIdx + 1).trim().replace(/;;/g, '\n')

    if (!name || name.length < 2) {
        return m.reply(`❌ *الاسم قصير جداً.*\n\nيلزم حرفان على الأقل لتسهيل التعرف 📝`)
    }
    if (!content || content.length < 3) {
        return m.reply(`❌ *محتوى المعلومات قصير جداً.*\n\nيلزم 3 أحرف على الأقل ✍️`)
    }

    let imageUrl = null
    let videoUrl = null

    const hasQuotedMedia = m.quoted?.isMedia
    const isDirectMedia = m.isMedia && (m.isImage || m.isVideo)

    if (hasQuotedMedia || isDirectMedia) {
        await m.reply(`⏳ _جاري رفع الوسائط..._`)
        try {
            const buffer = hasQuotedMedia ? await m.quoted.download() : await m.download()
            if (buffer) {
                const isImage = m.quoted?.isImage || m.quoted?.type === 'imageMessage' || m.isImage
                const isVideo = m.quoted?.isVideo || m.quoted?.type === 'videoMessage' || m.isVideo
                const url = await uploadToCatbox(buffer, isVideo ? 'video.mp4' : 'image.jpg')
                if (url) {
                    if (isVideo) videoUrl = url
                    else imageUrl = url
                }
            }
        } catch (e) {
            console.error('[AddList] Upload error:', e.message)
        }
    }

    const lists = db.setting('storeLists') || []
    const newList = {
        id: `L${Date.now()}`,
        name,
        content,
        description: content.substring(0, 80).replace(/\n/g, ' '),
        image: imageUrl,
        video: videoUrl,
        createdAt: new Date().toISOString()
    }

    lists.push(newList)
    db.setting('storeLists', lists)

    await m.react('✅')

    let reply = `✅ *تمت إضافة المعلومات*\n\n`
    reply += `🏷️ الاسم: *${name}*\n`
    if (imageUrl) reply += `🖼️ وسائط: ✅ صورة\n`
    if (videoUrl) reply += `🎬 وسائط: ✅ فيديو\n`
    reply += `📝 المحتوى:\n${content}\n\n`
    reply += `📋 _عرض القائمة: \`${m.prefix}قائمة\`_\n`
    reply += `✏️ _تعديل: \`${m.prefix}تعديل_قائمة ${lists.length}\`_`

    return m.reply(reply)
}

export { pluginConfig as config, handler }