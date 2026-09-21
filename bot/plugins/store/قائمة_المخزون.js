// قائمة_المخزون - أمر لعرض قائمة عناصر مخزون المنتج

import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'قائمة_المخزون',
    alias: ['liststok'],
    category: 'store',
    description: '📋 عرض قائمة عناصر مخزون المنتج',
    usage: '.قائمة_المخزون <رقم_المنتج>',
    example: '.قائمة_المخزون 1',
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

    const idx = parseInt(m.text?.trim()) - 1

    if (isNaN(idx) || idx < 0 || idx >= products.length) {
        let txt = `📋 *قائمة مخزون المنتجات*\n\nاختر منتجاً لعرض المخزون:\n\n`
        for (let i = 0; i < products.length; i++) {
            const p = products[i]
            const typeIcon = p.type === 'مادي' ? '📦' : '🔑'
            const stockDisplay = p.type === 'مادي'
                ? (p.stock === -1 ? '♾️' : `${p.stock} قطعة`)
                : `${p.stockItems?.length || 0} حساب`
            const icon = (p.type === 'مادي' ? (p.stock > 0 || p.stock === -1) : (p.stockItems?.length > 0 || p.stock === -1)) ? '✅' : '⚠️'
            txt += `${typeIcon} *${i + 1}.* ${p.name} — ${stockDisplay} ${icon}\n`
        }
        txt += `\nاكتب \`${m.prefix}قائمة_المخزون <الرقم>\` لعرض تفاصيل المخزون 📊`
        return m.reply(txt)
    }

    const product = products[idx]
    const typeIcon = product.type === 'مادي' ? '📦' : '🔑'

    if (product.type === 'مادي') {
        return m.reply(
            `📦 *المخزون: ${product.name}*\n\n` +
            `📊 النوع: *مادي*\n` +
            `📦 الإجمالي: *${product.stock === -1 ? '♾️ غير محدود' : product.stock + ' قطعة'}*\n\n` +
            `*إدارة المخزون:*\n` +
            `• إضافة: \`${m.prefix}إضافة_مخزون ${idx + 1} <الكمية>\`\n` +
            `• تعديل: \`${m.prefix}تعديل_منتج ${idx + 1} مخزون <الكمية>\`\n\n` +
            `_يتم إدارة المخزون المادي حسب الكمية، وليس لكل عنصر_ 📦`
        )
    }

    const stockItems = product.stockItems || []

    if (stockItems.length === 0) {
        return m.reply(
            `🔑 *المخزون: ${product.name}*\n\n` +
            `📭 لا توجد عناصر مخزون مضافة.\n\n` +
            `*إضافة مخزون:*\n` +
            `• يدوياً: \`${m.prefix}إضافة_مخزون ${idx + 1}|<التفاصيل>\`\n` +
            `• استيراد: \`${m.prefix}إضافة_مخزון ${idx + 1}\` (رد على ملف .txt 📄)\n\n` +
            `_بيانات المخزون سرية 🔒 ولا ترسل إلا للمشتري بعد تأكيد الدفع_`
        )
    }

    let txt = `🔑 *المخزون: ${product.name}*\n\n`
    txt += `📊 الإجمالي: *${stockItems.length}* حساب\n\n`

    const showItems = stockItems.slice(0, 30)
    for (let i = 0; i < showItems.length; i++) {
        const preview = showItems[i].detail.replace(/\n/g, ' ').substring(0, 40)
        txt += `\`${i + 1}.\` ${preview}${showItems[i].detail.length > 40 ? '...' : ''}\n`
    }

    if (stockItems.length > 30) {
        txt += `\n_و ${stockItems.length - 30} عنصر آخر..._ 📋`
    }

    txt += `\n\n🛠️ *إدارة المخزون:*\n`
    txt += `🗑️ حذف: \`${m.prefix}حذف_مخزون ${idx + 1} <رقم_العنصر>\`\n`
    txt += `✏️ تعديل: \`${m.prefix}تعديل_مخزون ${idx + 1} <رقم_العنصر>|<التفاصيل_الجديدة>\`\n`
    txt += `➕ إضافة: \`${m.prefix}إضافة_مخزون ${idx + 1}|<التفاصيل>\``

    return m.reply(txt)
}

export { pluginConfig as config, handler }