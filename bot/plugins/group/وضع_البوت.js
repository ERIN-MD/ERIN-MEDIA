import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'وضع_البوت',
    alias: ['botmode'],
    category: 'group',
    description: 'ضبط وضع البوت لهذه المجموعة',
    usage: '.وضع_البوت <md/cpanel/pushkontak/store/otp/all>',
    example: '.وضع_البوت store',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const MODES = {
    md: {
        name: 'متعدد الأجهزة',
        desc: 'الوضع الافتراضي مع جميع الميزات القياسية',
        allowedCategories: null,
        excludeCategories: ['cpanel', 'pushkontak', 'store']
    },
    all: {
        name: 'جميع الميزات',
        desc: 'جميع ميزات جميع الأوضاع متاحة',
        allowedCategories: null,
        excludeCategories: null
    },
    cpanel: {
        name: 'لوحة التحكم',
        desc: 'وضع مخصص للوحة السيرفر',
        allowedCategories: ['main', 'group', 'sticker', 'owner', 'tools', 'panel'],
        excludeCategories: null
    },
    pushkontak: {
        name: 'دفع جهات الاتصال',
        desc: 'وضع مخصص لدفع جهات الاتصال للأعضاء',
        allowedCategories: ['owner', 'main', 'group', 'sticker', 'pushkontak'],
        excludeCategories: null
    },
    store: {
        name: 'متجر',
        desc: 'وضع مخصص للمتجر اليدوي',
        allowedCategories: ['main', 'group', 'sticker', 'owner', 'store'],
        excludeCategories: null
    },
    otp: {
        name: 'خدمة OTP',
        desc: 'وضع خدمة OTP التلقائية',
        allowedCategories: ['main', 'group', 'sticker', 'owner', 'otp'],
        excludeCategories: null
    }
}

function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    let mode = (args[0] || '').toLowerCase()
    const flags = args.slice(1).map(f => f.toLowerCase())

    const groupData = db.getGroup(m.chat) || {}
    const currentMode = groupData.botMode || 'all'

    if (!mode) {
        let modeList = ''
        for (const [key, val] of Object.entries(MODES)) {
            const isCurrent = key === currentMode ? ' ⬅️' : ''
            modeList += `┃ \`${m.prefix}وضع_البوت ${key}\`${isCurrent}\n`
            modeList += `┃ └ ${val.desc}\n`
        }

        return m.reply(
            `🔧 *وضع البوت*\n\n` +
            `> الوضع الحالي: *${currentMode.toUpperCase()}* (${MODES[currentMode]?.name || 'غير معروف'})\n` +
            `\n╭─「 📋 *الخيارات* 」\n` +
            `${modeList}` +
            `╰───────────────\n\n` +
            `*مثال:*\n` +
            `> \`${m.prefix}وضع_البوت store\` - طلب يدوي\n\n` +
            `> _إعدادات لكل مجموعة_`
        )
    }

    if (!Object.keys(MODES).includes(mode)) {
        return m.reply(`❌ وضع غير صالح. الخيارات: \`${Object.keys(MODES).join(', ')}\``)
    }

    const newGroupData = {
        ...groupData,
        botMode: mode
    }

    if (mode === 'store') {
        newGroupData.storeConfig = {
            ...(groupData.storeConfig || {}),
            products: groupData.storeConfig?.products || []
        }
    }

    db.setGroup(m.chat, newGroupData)
    db.save()

    m.react('✅')

    let extraInfo = ''
    if (mode === 'store') {
        const products = newGroupData.storeConfig?.products || []
        extraInfo = `\n\n📋 *الوضع اليدوي*\n` +
            `> المشرف يحتاج لتأكيد الطلب يدوياً\n` +
            `> المنتجات: \`${products.length}\` عنصر\n\n` +
            `*الدليل:*\n` +
            `> \`${m.prefix}addprod <كود> <سعر> <اسم>\`\n` +
            `> \`${m.prefix}listprod\` - عرض المنتجات`
    }

    return m.reply(
        `✅ *تم تغيير الوضع*\n\n` +
        `> الوضع: *${mode.toUpperCase()}* (${MODES[mode].name})\n` +
        `> المجموعة: *${m.chat.split('@')[0]}*\n` +
        extraInfo +
        `\n\n> اكتب \`${m.prefix}menu\` لعرض القائمة.`
    )
}

function getGroupMode(chatJid, db) {
    const globalMode = db.setting('botMode') || 'all'
    if (!chatJid?.endsWith('@g.us')) return globalMode
    const groupData = db.getGroup(chatJid) || {}
    return groupData.botMode || globalMode
}

function getModeCategories(mode) {
    const modeConfig = MODES[mode] || MODES.md
    return {
        allowed: modeConfig.allowedCategories,
        excluded: modeConfig.excludeCategories
    }
}

function filterCategoriesByMode(categories, mode) {
    const modeConfig = MODES[mode] || MODES.md

    if (modeConfig.allowedCategories) {
        return categories.filter(cat => modeConfig.allowedCategories.includes(cat.toLowerCase()))
    }

    if (modeConfig.excludeCategories) {
        return categories.filter(cat => !modeConfig.excludeCategories.includes(cat.toLowerCase()))
    }

    return categories
}

export { pluginConfig as config, handler, getGroupMode, getModeCategories, filterCategoriesByMode, MODES }