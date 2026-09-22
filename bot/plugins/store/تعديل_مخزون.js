// تعديل_مخزون - أمر لتعديل عنصر مخزون المنتج (فقط في المحادثة الخاصة)

import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'تعديل_مخزون',
    alias: ['editstok'],
    category: 'store',
    description: '✏️ تعديل عنصر مخزون المنتج (فقط في المحادثة الخاصة)',
    usage: '.تعديل_مخزون <رقم_المنتج> <رقم_العنصر>|<التفاصيل_الجديدة>',
    example: '.تعديل_مخزون 1 3|البريد: جديد@mail.com;;كلمة_المرور: newpass',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: true,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    if (m.isGroup) {
        return m.reply(
            `🚫 *تم رفض الوصول*\n\n` +
            `للحفاظ على الخصوصية 🛡️، يمكن تعديل المخزون فقط في *المحادثة الخاصة*.\n\n` +
            `يرجى التحدث مع البوت مباشرة 📱`
        )
    }

    const db = getDatabase()
    const products = db.setting('storeProducts') || []

    if (products.length === 0) {
        return m.reply(`📭 *لا توجد منتجات.*\n\nأضف منتجاً أولاً: \`${m.prefix}إضافة_منتج\` ➕`)
    }

    const text = m.text?.trim() || ''
    const firstPipe = text.indexOf('|')

    if (firstPipe === -1) {
        return m.reply(
            `✏️ *تعديل المخزون*\n\n` +
            `📋 الصيغة: \`${m.prefix}تعديل_مخزون <رقم_المنتج> <رقم_العنصر>|<التفاصيل_الجديدة>\`\n\n` +
            `📝 *مثال:*\n` +
            `\`${m.prefix}تعديل_مخزون 1 3|البريد: جديد@mail.com;;كلمة_المرور: newpass\`\n\n` +
            `• استخدم \`;;\` لسطر جديد في التفاصيل 🔑\n` +
            `📋 عرض رقم العنصر: \`${m.prefix}قائمة_المخزون <رقم_المنتج>\`\n\n` +
            `⚠️ _لن تتغير العناصر التي تم إرسالها بالفعل إلى المشتري_ 🔒`
        )
    }

    const before = text.substring(0, firstPipe).trim()
    const newDetail = text.substring(firstPipe + 1).trim().replace(/;;/g, '\n')

    const parts = before.split(/\s+/)
    const productNo = parseInt(parts[0]) - 1
    const itemNo = parseInt(parts[1]) - 1

    if (isNaN(productNo) || productNo < 0 || productNo >= products.length) {
        return m.reply(`❌ *رقم المنتج غير صالح.*\n\nالنطاق: 1-${products.length} 📋`)
    }

    const product = products[productNo]

    if (product.type === 'مادي') {
        return m.reply(
            `📦 *منتج مادي*\n\n` +
            `المنتج المادي لا يحتوي على بيانات لكل عنصر 🔑\n` +
            `لتغيير المخزون، استخدم:\n` +
            `\`${m.prefix}تعديل_منتج ${productNo + 1} مخزون <الكمية>\``
        )
    }

    const stockItems = product.stockItems || []

    if (isNaN(itemNo) || itemNo < 0 || itemNo >= stockItems.length) {
        return m.reply(`❌ *رقم العنصر غير صالح.*\n\nالنطاق: 1-${stockItems.length}\n\n📋 عرض القائمة: \`${m.prefix}قائمة_المخزون ${productNo + 1}\``)
    }

    if (!newDetail || newDetail.length < 3) {
        return m.reply(`❌ *التفاصيل قصيرة جداً.*\n\nيلزم 3 أحرف على الأقل 🔑`)
    }

    const oldDetail = stockItems[itemNo].detail
    stockItems[itemNo].detail = newDetail
    stockItems[itemNo].updatedAt = new Date().toISOString()

    db.setting('storeProducts', products)
    await m.react('✅')

    return m.reply(
        `✅ *تم تحديث المخزون*\n\n` +
        `🏷️ المنتج: *${product.name}*\n` +
        `🔑 العنصر #${itemNo + 1}\n\n` +
        `❌ السابق:\n\`${oldDetail.replace(/\n/g, ' ').substring(0, 50)}\`\n\n` +
        `✅ الجديد:\n\`${newDetail.replace(/\n/g, ' ').substring(0, 50)}\`\n\n` +
        `⚠️ _التغييرات تنطبق فقط على العناصر التي لم ترسل بعد إلى المشتري_ 🔒`
    )
}

export { pluginConfig as config, handler }