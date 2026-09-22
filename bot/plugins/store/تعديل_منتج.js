// تعديل_منتج - أمر لتعديل منتج المتجر (فقط في المحادثة الخاصة)

import { getDatabase } from '../../src/lib/maro-database.js'
import axios from 'axios'
import FormData from 'form-data'

const pluginConfig = {
    name: 'تعديل_منتج',
    alias: ['editproduk'],
    category: 'store',
    description: '✏️ تعديل منتج المتجر (فقط في المحادثة الخاصة)',
    usage: '.تعديل_منتج <الرقم> <الحقل> <القيمة>',
    example: '.تعديل_منتج 1 سعر 30000',
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
            `للحفاظ على الخصوصية 🛡️، يمكن تعديل المنتجات فقط في *المحادثة الخاصة*.\n\n` +
            `يرجى التحدث مع البوت مباشرة 📱`
        )
    }

    const db = getDatabase()
    const products = db.setting('storeProducts') || []

    if (products.length === 0) {
        return m.reply(`📭 *لا توجد منتجات.*\n\nأضف منتجاً أولاً: \`${m.prefix}إضافة_منتج\` ➕`)
    }

    const text = m.text?.trim() || ''
    const match = text.match(/^(\d+)\s+(اسم|سعر|خصم|مخزون|نوع|وصف|تفاصيل|صورة|فيديو)\s*(.*)/i)

    if (!match) {
        return m.reply(
            `✏️ *تعديل المنتج*\n\n` +
            `📋 الصيغة: \`${m.prefix}تعديل_منتج <الرقم> <الحقل> <القيمة>\`\n\n` +
            `📌 *الحقول القابلة للتعديل:*\n` +
            `• *الاسم* 🏷️ — اسم المنتج\n` +
            `• *السعر* 💰 — سعر البيع (رقم)\n` +
            `• *الخصم* 🏷️ — السعر الأصلي المشطوب (رقم، 0 للحذف)\n` +
            `• *المخزون* 📊 — كمية المخزون أو \`غير محدود\`\n` +
            `• *النوع* 🔑📦 — \`رقمي\` أو \`مادي\`\n` +
            `• *الوصف* 📝 — وصف المنتج\n` +
            `• *التفاصيل* 🔒 — معلومات سرية (ترسل بعد الشراء)\n` +
            `• *الصورة* 🖼️ — رفع صورة جديدة (رد على صورة)\n` +
            `• *الفيديو* 🎬 — رفع فيديو جديد (رد على فيديو)\n\n` +
            `📝 *مثال:*\n` +
            `\`${m.prefix}تعديل_منتج 1 سعر 30000\`\n` +
            `\`${m.prefix}تعديل_منتج 1 خصم 40000\`\n` +
            `\`${m.prefix}تعديل_منتج 1 نوع مادي\`\n` +
            `\`${m.prefix}تعديل_منتج 1 اسم نتفليكس بريميوم\`\n` +
            `\`${m.prefix}تعديل_منتج 1 وصف حساب مشاركة شهر واحد\`\n` +
            `\`${m.prefix}تعديل_منتج 1 صورة\` (رد على صورة 🖼️)\n\n` +
            `🏷️ _سيظهر سعر الخصم كـ ~~السعر الأصلي~~ في الكتالوج_`
        )
    }

    const idx = parseInt(match[1]) - 1
    const field = match[2].toLowerCase()
    let value = match[3]?.trim() || ''

    if (idx < 0 || idx >= products.length) {
        return m.reply(`❌ *رقم المنتج غير صالح.*\n\nالنطاق: 1-${products.length} 📋`)
    }

    const product = products[idx]

    switch (field) {
        case 'اسم': {
            if (!value || value.length < 2) return m.reply(`❌ *الاسم قصير جداً.* يلزم حرفان على الأقل 🏷️`)
            product.name = value
            break
        }
        case 'سعر': {
            const price = parseInt(value)
            if (isNaN(price) || price < 1000) return m.reply(`❌ *سعر غير صالح.* الحد الأدنى 1000 💰`)
            product.price = price
            break
        }
        case 'خصم': {
            const origPrice = parseInt(value)
            if (isNaN(origPrice) || origPrice === 0) {
                product.originalPrice = null
            } else {
                if (origPrice <= product.price) return m.reply(`❌ *سعر الخصم يجب أن يكون أكبر من سعر البيع.*\n\nسعر البيع الحالي: ${product.price.toLocaleString('ar-EG')} عملة 💰`)
                product.originalPrice = origPrice
            }
            break
        }
        case 'مخزون': {
            product.stock = value.toLowerCase() === 'غير محدود' || value.toLowerCase() === 'unlimited' ? -1 : parseInt(value)
            if (isNaN(product.stock)) return m.reply(`❌ *المخزون غير صالح.* استخدم رقماً أو \`غير محدود\` 📊`)
            break
        }
        case 'نوع': {
            const newType = value.toLowerCase()
            if (newType !== 'رقمي' && newType !== 'مادي' && newType !== 'digital' && newType !== 'fisik') {
                return m.reply(`❌ *نوع غير صالح.* استخدم \`رقمي\` 🔑 أو \`مادي\` 📦`)
            }
            const type = (newType === 'مادي' || newType === 'fisik' || newType === 'physical') ? 'مادي' : 'رقمي'
            if (type === 'مادي' && product.type === 'رقمي' && product.stockItems?.length > 0) {
                return m.reply(
                    `⚠️ *لا يمكن التحويل إلى مادي*\n\n` +
                    `يحتوي هذا المنتج على *${product.stockItems.length}* بيانات حساب 🔑\n` +
                    `احذف جميع عناصر المخزون أولاً قبل التحويل إلى مادي.\n\n` +
                    `🗑️ حذف الكل: \`${m.prefix}تعديل_منتج ${idx + 1} مخزون 0\``
                )
            }
            product.type = type
            if (type === 'مادي' && !product.stock) product.stock = 0
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
            return m.reply(`❌ *حقل غير معروف.*\n\nاستخدم: اسم, سعر, خصم, مخزون, نوع, وصف, تفاصيل, صورة, فيديو 📋`)
    }

    db.setting('storeProducts', products)
    await m.react('✅')

    const typeIcon = product.type === 'مادي' ? '📦' : '🔑'
    const typeLabel = product.type === 'مادي' ? 'مادي' : 'رقمي'

    let reply = `✅ *تم تحديث المنتج*\n\n`
    reply += `🏷️ الاسم: *${product.name}*\n`
    reply += `💰 السعر: *${product.price.toLocaleString('ar-EG')}* عملة`
    if (product.originalPrice) reply += ` ~~${product.originalPrice.toLocaleString('ar-EG')}* عملة~~`
    reply += `\n`
    reply += `${typeIcon} النوع: *${typeLabel}*\n`
    reply += `📊 المخزون: *${product.stock === -1 ? '♾️ غير محدود' : product.stock}*\n`
    if (field === 'صورة') reply += `🖼️ الصورة: ✅\n`
    if (field === 'فيديو') reply += `🎬 الفيديو: ✅\n`
    reply += `\n👀 _عرض التغييرات: \`${m.prefix}قائمة_المنتجات\`_`

    return m.reply(reply)
}

export { pluginConfig as config, handler }