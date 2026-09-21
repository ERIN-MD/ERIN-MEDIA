// تعديل_متجر - أمر لتعديل معلومات المتجر (فقط في المحادثة الخاصة)

import { getDatabase } from '../../src/lib/maro-database.js'
import axios from 'axios'
import FormData from 'form-data'

const pluginConfig = {
    name: 'تعديل_متجر',
    alias: ['editstore'],
    category: 'store',
    description: '✏️ تعديل معلومات المتجر (فقط في المحادثة الخاصة)',
    usage: '.تعديل_متجر <الرقم> <الحقل> <القيمة>',
    example: '.تعديل_متجر 1 محتوى محتوى جديد هنا',
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
            `للحفاظ على أمان البيانات 🛡️، يمكن تعديل المتجر فقط في *المحادثة الخاصة*.\n\n` +
            `يرجى التحدث مع البوت مباشرة 📱`
        )
    }

    const db = getDatabase()
    const products = db.setting('storeProducts') || []

    if (products.length === 0) {
        return m.reply(`📭 *لا توجد منتجات.*\n\nأضف منتجاً أولاً: \`${m.prefix}إضافة_منتج\` ➕`)
    }

    const text = m.text?.trim() || ''
    const match = text.match(/^(\d+)\s+(اسم|سعر|سعر_أصلي|نوع|مخزون|وصف|تفاصيل|صورة|فيديو|خصم)\s*(.*)/i)

    if (!match) {
        return m.reply(
            `✏️ *تعديل المتجر*\n\n` +
            `📋 الصيغة: \`${m.prefix}تعديل_متجر <الرقم> <الحقل> <القيمة>\`\n\n` +
            `📌 *الحقول القابلة للتعديل:*\n` +
            `• *الاسم* 🏷️ — اسم المنتج\n` +
            `• *السعر* 💰 — سعر المنتج\n` +
            `• *السعر_الأصلي* 🏷️ — السعر قبل الخصم\n` +
            `• *النوع* 🔑📦 — \`رقمي\` أو \`مادي\`\n` +
            `• *المخزون* 📊 — كمية المخزون أو \`غير محدود\`\n` +
            `• *الوصف* 📝 — وصف المنتج\n` +
            `• *التفاصيل* 📋 — تفاصيل إضافية\n` +
            `• *الصورة* 🖼️ — رفع صورة جديدة (رد على صورة)\n` +
            `• *الفيديو* 🎬 — رفع فيديو جديد (رد على فيديو)\n` +
            `• *الخصم* 🏷️ — نسبة الخصم (مثال: 20)\n\n` +
            `📝 *مثال:*\n` +
            `\`${m.prefix}تعديل_متجر 1 سعر 25000\`\n` +
            `\`${m.prefix}تعديل_متجر 1 اسم سبوتيفاي بريميوم\`\n` +
            `\`${m.prefix}تعديل_متجر 1 صورة\` (رد على صورة 🖼️)\n\n` +
            `_استخدم \`;;\` لسطر جديد في الوصف أو التفاصيل_ ✍️`
        )
    }

    const idx = parseInt(match[1]) - 1
    const field = match[2].toLowerCase()
    let value = match[3]?.trim() || ''

    if (idx < 0 || idx >= products.length) {
        return m.reply(`❌ *رقم غير صالح.*\n\nالنطاق: 1-${products.length} 📋`)
    }

    const product = products[idx]

    switch (field) {
        case 'اسم': {
            if (!value || value.length < 2) return m.reply(`❌ *الاسم قصير جداً.* يلزم حرفان على الأقل 🏷️`)
            product.name = value
            break
        }
        case 'سعر': {
            const newPrice = parseInt(value)
            if (isNaN(newPrice) || newPrice < 1000) return m.reply(`❌ *سعر غير صالح.* الحد الأدنى 1000 💰`)
            product.price = newPrice
            break
        }
        case 'سعر_أصلي': {
            if (!value) {
                product.originalPrice = null
                break
            }
            const newPrice = parseInt(value)
            if (isNaN(newPrice) || newPrice < 0) return m.reply(`❌ *سعر غير صالح.* أدخل رقماً صحيحاً 🏷️`)
            product.originalPrice = newPrice
            break
        }
        case 'نوع': {
            const type = value.toLowerCase()
            if (type !== 'رقمي' && type !== 'مادي' && type !== 'digital' && type !== 'fisik' && type !== 'physical') {
                return m.reply(`❌ *نوع غير صالح.* استخدم: \`رقمي\` أو \`مادي\` 🔑📦`)
            }
            product.type = (type === 'مادي' || type === 'fisik' || type === 'physical') ? 'مادي' : 'رقمي'
            break
        }
        case 'مخزون': {
            if (value.toLowerCase() === 'غير محدود' || value.toLowerCase() === 'unlimited') {
                product.stock = -1
            } else {
                const newStock = parseInt(value)
                if (isNaN(newStock) || newStock < 0) return m.reply(`❌ *مخزون غير صالح.* أدخل رقماً صحيحاً 📊`)
                product.stock = newStock
            }
            break
        }
        case 'وصف': {
            product.description = value.replace(/;;/g, '\n')
            break
        }
        case 'تفاصيل': {
            product.detail = value.replace(/;;/g, '\n')
            break
        }
        case 'خصم': {
            const discount = parseInt(value)
            if (isNaN(discount) || discount < 0 || discount > 100) return m.reply(`❌ *نسبة خصم غير صالحة.* بين 0-100 🏷️`)
            if (product.originalPrice) {
                const discountAmount = Math.floor(product.originalPrice * (discount / 100))
                product.price = product.originalPrice - discountAmount
                product.discount = discount
            } else {
                return m.reply(`❌ *لا يوجد سعر أصلي.* حدد السعر الأصلي أولاً 🏷️`)
            }
            break
        }
        case 'صورة': {
            const hasMedia = m.quoted?.isMedia && (m.quoted?.isImage || m.quoted?.type === 'imageMessage')
            const isDirectImage = m.isImage
            if (!hasMedia && !isDirectImage) return m.reply(`🖼️ *رد أو أرسل صورة جديدة.*\n\nأرسل صورة ثم رد بهذا الأمر.`)
            await m.reply(`⏳ _جاري رفع الصورة..._`)
            try {
                const buffer = hasMedia ? await m.quoted.download() : await m.download()
                if (buffer) {
                    const url = await uploadToCatbox(buffer, 'image.jpg')
                    if (url) product.image = url
                    else return m.reply(`❌ *فشل رفع الصورة.* حاول مرة أخرى 🖼️`)
                }
            } catch {
                return m.reply(`❌ *فشل رفع الصورة.* حاول مرة أخرى 🖼️`)
            }
            break
        }
        case 'فيديو': {
            const hasMedia = m.quoted?.isMedia && (m.quoted?.isVideo || m.quoted?.type === 'videoMessage')
            const isDirectVideo = m.isVideo
            if (!hasMedia && !isDirectVideo) return m.reply(`🎬 *رد أو أرسل فيديو جديد.*\n\nأرسل فيديو ثم رد بهذا الأمر.`)
            await m.reply(`⏳ _جاري رفع الفيديو..._`)
            try {
                const buffer = hasMedia ? await m.quoted.download() : await m.download()
                if (buffer) {
                    const url = await uploadToCatbox(buffer, 'video.mp4')
                    if (url) product.video = url
                    else return m.reply(`❌ *فشل رفع الفيديو.* حاول مرة أخرى 🎬`)
                }
            } catch {
                return m.reply(`❌ *فشل رفع الفيديو.* حاول مرة أخرى 🎬`)
            }
            break
        }
        default:
            return m.reply(`❌ *حقل غير معروف.*\n\nاستخدم: اسم, سعر, سعر_أصلي, نوع, مخزون, وصف, تفاصيل, صورة, فيديو, خصم 📋`)
    }

    db.setting('storeProducts', products)
    await m.react('✅')

    let reply = `✅ *تم تحديث المنتج*\n\n`
    reply += `🏷️ الاسم: *${product.name}*\n`
    reply += `💰 السعر: *${product.price.toLocaleString('ar-EG')}* عملة\n`
    if (product.originalPrice) reply += `🏷️ السعر الأصلي: *${product.originalPrice.toLocaleString('ar-EG')}* عملة\n`
    if (product.discount) reply += `🏷️ الخصم: *${product.discount}%*\n`
    reply += `📦 النوع: *${product.type === 'مادي' ? '📦 مادي' : '🔑 رقمي'}*\n`
    reply += `📊 المخزون: *${product.stock === -1 ? '♾️ غير محدود' : product.stock}*\n`
    if (field === 'وصف' && product.description) reply += `📝 الوصف:\n${product.description}\n\n`
    if (field === 'تفاصيل' && product.detail) reply += `📋 التفاصيل:\n${product.detail}\n\n`
    if (field === 'صورة') reply += `🖼️ الصورة: ✅\n`
    if (field === 'فيديو') reply += `🎬 الفيديو: ✅\n`
    reply += `\n👀 _عرض المنتجات: \`${m.prefix}قائمة_المنتجات\`_`

    return m.reply(reply)
}

export { pluginConfig as config, handler }