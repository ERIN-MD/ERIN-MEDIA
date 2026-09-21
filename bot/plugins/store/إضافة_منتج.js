// إضافة_منتج - أمر لإضافة منتج جديد إلى المتجر (فقط في المحادثة الخاصة)

import { getDatabase } from '../../src/lib/maro-database.js'
import axios from 'axios'
import FormData from 'form-data'

const pluginConfig = {
    name: 'إضافة_منتج',
    alias: ['addproduk'],
    category: 'store',
    description: '➕ إضافة منتج جديد إلى المتجر (فقط في المحادثة الخاصة)',
    usage: '.إضافة_منتج <الاسم>|<السعر>|<النوع>|<المخزون>|<الوصف>',
    example: '.إضافة_منتج سبوتيفاي بريميوم|25000|رقمي|10|حساب بريميوم لمدة شهر',
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
            `للحفاظ على خصوصية وأمان بيانات المنتج 🛡️، يمكن إضافة المنتجات فقط في *المحادثة الخاصة*.\n\n` +
            `يرجى التحدث مع البوت مباشرة 📱، ثم اكتب:\n` +
            `\`${m.prefix}إضافة_منتج <الاسم>|<السعر>|<النوع>|<المخزون>|<الوصف>\``
        )
    }

    const db = getDatabase()
    const text = m.text?.trim() || ''
    const parts = text.split('|').map(p => p.trim())

    if (parts.length < 2) {
        return m.reply(
            `➕ *إضافة منتج جديد*\n\n` +
            `📋 الصيغة:\n` +
            `\`${m.prefix}إضافة_منتج <الاسم>|<السعر>|<النوع>|<المخزون>|<الوصف>\`\n\n` +
            `📌 *المعلمات:*\n` +
            `• *الاسم* — اسم المنتج (حد أدنى 2 حرف)\n` +
            `• *السعر* — السعر بالعملة (حد أدنى 1000)\n` +
            `• *النوع* — \`رقمي\` 🔑 أو \`مادي\` 📦 (اختياري، افتراضي: رقمي)\n` +
            `• *المخزون* — كمية المخزون أو \`غير محدود\` (اختياري، افتراضي: 999)\n` +
            `• *الوصف* — وصف مختصر (اختياري)\n\n` +
            `🔑 *رقمي* = منتج عبارة عن حساب/مفتاح/بيانات فريدة لكل عنصر\n` +
            `📦 *مادي* = منتج عبارة عن سلعة، المخزون يمثل الكمية\n\n` +
            `📝 *مثال:*\n` +
            `\`${m.prefix}إضافة_منتج سبوتيفاي بريميوم|25000|رقمي|10|حساب بريميوم لمدة شهر\`\n` +
            `\`${m.prefix}إضافة_منتج تيشيرت|65000|مادي|8|تيشيرت قطني\`\n` +
            `\`${m.prefix}إضافة_منتج نتفليكس|35000|رقمي|غير محدود|حساب مشاركة\`\n\n` +
            `🖼️ *نصيحة:*\n` +
            `• أرسل صورة/فيديو أولاً، ثم رد على تلك الوسائط مع الأمر لإضافة صورة مصغرة 📸\n` +
            `• للمنتجات *الرقمية*، استخدم \`.إضافة_مخزون\` بعد إنشاء المنتج لإضافة بيانات الحساب/المفتاح 🔑\n` +
            `• للمنتجات *المادية*، يتم ضبط المخزون تلقائياً من الرقم المدخل 📦\n` +
            `• يمكن ضبط سعر الخصم لاحقاً باستخدام \`.تعديل_منتج\` 🏷️`
        )
    }

    const name = parts[0]
    const price = parseInt(parts[1])
    const typeStr = (parts[2] || 'رقمي').toLowerCase()
    const stockStr = parts[3] || ''
    const description = (parts[4] || '').replace(/;;/g, '\n')

    if (!name || name.length < 2) {
        return m.reply(`❌ *اسم المنتج قصير جداً.*\n\nيلزم حرفان على الأقل لتسهيل التعرف على المنتج 📝`)
    }
    if (isNaN(price) || price < 1000) {
        return m.reply(`❌ *السعر غير صالح.*\n\nالحد الأدنى للسعر *1000* 💰 تأكد من إدخال رقم صحيح.`)
    }

    const type = typeStr === 'مادي' || typeStr === 'fisik' || typeStr === 'physical' ? 'مادي' : 'رقمي'
    const stock = stockStr.toLowerCase() === 'غير محدود' || stockStr.toLowerCase() === 'unlimited' ? -1 : (parseInt(stockStr) || 999)

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
            console.error('[AddProduk] Upload error:', e.message)
        }
    }

    const products = db.setting('storeProducts') || []
    const newProduct = {
        id: `P${Date.now()}`,
        name,
        price,
        originalPrice: null,
        type,
        stock,
        stockItems: [],
        description,
        detail: '',
        image: imageUrl,
        video: videoUrl,
        createdAt: new Date().toISOString()
    }

    products.push(newProduct)
    db.setting('storeProducts', products)

    await m.react('✅')

    const typeIcon = type === 'رقمي' ? '🔑' : '📦'
    const typeLabel = type === 'رقمي' ? 'رقمي' : 'مادي'

    let reply = `✅ *تم إضافة المنتج*\n\n`
    reply += `🏷️ الاسم: *${name}*\n`
    reply += `💰 السعر: *${price.toLocaleString('ar-EG')}* عملة\n`
    reply += `${typeIcon} النوع: *${typeLabel}*\n`
    reply += `📊 المخزون: *${stock === -1 ? 'غير محدود ♾️' : stock}*\n`
    if (description) reply += `📝 الوصف: _${description}_\n`
    if (imageUrl) reply += `🖼️ صورة مصغرة: ✅ صورة\n`
    if (videoUrl) reply += `🎬 صورة مصغرة: ✅ فيديو\n`
    reply += `\n📌 *الخطوات التالية:*\n`

    if (type === 'رقمي') {
        reply += `1️⃣ إضافة بيانات الحساب/المفتاح: \`${m.prefix}إضافة_مخزون ${products.length}|<التفاصيل>\`\n`
        reply += `2️⃣ أو استيراد من ملف .txt: \`${m.prefix}إضافة_مخزون ${products.length}\` (رد على ملف 📄)\n`
    } else {
        reply += `1️⃣ تم ضبط المخزون تلقائياً (${stock} قطعة) 📦\n`
        reply += `2️⃣ إضافة مخزون: \`${m.prefix}تعديل_منتج ${products.length} مخزون <الكمية>\`\n`
    }
    reply += `3️⃣ عرض المنتج: \`${m.prefix}قائمة_المنتجات\` 🛍️\n\n`
    reply += `_سيكون هذا المنتج مرئياً للعملاء عبر \`${m.prefix}قائمة_المنتجات\`_ 🎉`

    return m.reply(reply)
}

export { pluginConfig as config, handler }