// حذف_مخزون - أمر لحذف عنصر مخزون من المنتج

import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'حذف_مخزون',
    alias: ['hapusstok'],
    category: 'store',
    description: '🗑️ حذف عنصر مخزون من المنتج',
    usage: '.حذف_مخزون <رقم_المنتج> <رقم_العنصر>',
    example: '.حذف_مخزون 1 3',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const products = db.setting('storeProducts') || []

    if (products.length === 0) {
        return m.reply(`📭 *لا توجد منتجات.*\n\nأضف منتجاً أولاً: \`${m.prefix}إضافة_منتج\` ➕`)
    }

    const args = m.text?.trim().split(/\s+/) || []
    const productNo = parseInt(args[0]) - 1
    const itemNo = parseInt(args[1]) - 1

    if (args.length < 2 || isNaN(productNo) || isNaN(itemNo)) {
        return m.reply(
            `🗑️ *حذف المخزون*\n\n` +
            `الصيغة: \`${m.prefix}حذف_مخزون <رقم_المنتج> <رقم_العنصر>\`\n\n` +
            `📝 *مثال:*\n` +
            `\`${m.prefix}حذف_مخزون 1 3\` — حذف العنصر رقم 3 من المنتج رقم 1\n\n` +
            `📋 عرض رقم العنصر: \`${m.prefix}قائمة_المخزون <رقم_المنتج>\``
        )
    }

    if (productNo < 0 || productNo >= products.length) {
        return m.reply(`❌ *رقم المنتج غير صالح.*\n\nالنطاق: 1-${products.length} 📋`)
    }

    const product = products[productNo]

    if (product.type === 'مادي') {
        const reduceCount = parseInt(args[1])
        if (isNaN(reduceCount) || reduceCount <= 0) {
            return m.reply(
                `📦 *منتج مادي*\n\n` +
                `لتقليل المخزون المادي، استخدم:\n` +
                `\`${m.prefix}تعديل_منتج ${productNo + 1} مخزون <الكمية_الجديدة>\`\n\n` +
                `المخزون الحالي: *${product.stock === -1 ? '♾️ غير محدود' : product.stock + ' قطعة'}*`
            )
        }
        if (product.stock !== -1) {
            product.stock = Math.max(0, product.stock - reduceCount)
            db.setting('storeProducts', products)
            await m.react('✅')
            return m.reply(
                `📦 *تم تقليل المخزون المادي*\n\n` +
                `🏷️ المنتج: *${product.name}*\n` +
                `➖ تم الحذف: *${reduceCount} قطعة*\n` +
                `📊 المخزون المتبقي: *${product.stock} قطعة*`
            )
        }
        return m.reply(`♾️ *المخزون غير محدود لا يمكن تقليله.*\n\nقم بتغيير نوع المخزون أولاً: \`${m.prefix}تعديل_منتج ${productNo + 1} مخزون <الكمية>\``)
    }

    const stockItems = product.stockItems || []

    if (itemNo < 0 || itemNo >= stockItems.length) {
        return m.reply(`❌ *رقم العنصر غير صالح.*\n\nالنطاق: 1-${stockItems.length}\n\n📋 عرض القائمة: \`${m.prefix}قائمة_المخزون ${productNo + 1}\``)
    }

    const deleted = stockItems.splice(itemNo, 1)[0]
    product.stock = stockItems.length
    db.setting('storeProducts', products)

    await m.react('✅')
    return m.reply(
        `🗑️ *تم حذف المخزون*\n\n` +
        `🏷️ المنتج: *${product.name}*\n` +
        `🔑 العنصر: \`${deleted.detail.replace(/\n/g, ' ').substring(0, 50)}\`\n` +
        `📊 المخزون المتبقي: *${stockItems.length}* حساب`
    )
}

export { pluginConfig as config, handler }