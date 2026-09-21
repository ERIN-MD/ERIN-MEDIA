import config from '../../config.js'
import { getDatabase } from '../../src/lib/maro-database.js'

const pluginConfig = {
    name: 'بوت_مود',
    alias: ['botmode'],
    category: 'owner',
    description: 'ضبط وضع البوت (md/cpanel/store/pushkontak/all)',
    usage: '.بوت_مود <الوضع>',
    example: '.بوت_مود store',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

const VALID_MODES = ['md', 'cpanel', 'store', 'pushkontak', 'otp', 'all']

const MODE_DESCRIPTIONS = {
    md: 'الوضع الافتراضي، جميع الميزات ما عدا panel/store/pushkontak',
    cpanel: 'وضع اللوحة، main + group + sticker + owner + tools + panel',
    store: 'وضع المتجر اليدوي، main + group + sticker + owner + store',
    pushkontak: 'وضع pushkontak، main + group + sticker + owner + pushkontak',
    otp: 'وضع خدمة OTP، main + group + sticker + owner + otp',
    all: 'الوضع الكامل، جميع الميزات من جميع الأوضاع متاحة'
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    
    let mode = (args[0] || '').toLowerCase()
    const flags = args.slice(1).map(f => f.toLowerCase())
    const globalMode = db.setting('botMode') || 'all'
    const groupData = m.isGroup ? (db.getGroup(m.chat) || {}) : {}
    const groupMode = groupData.botMode || null
    
    if (!mode) {
        let txt = `╭┈┈⬡「 🤖 *بوت مود* 」\n`
        txt += `┃ ㊗ شامل: *${globalMode.toUpperCase()}*\n`
        
        if (m.isGroup) {
            txt += `┃ ㊗ المجموعة: *${(groupMode || 'موروث').toUpperCase()}*\n`
        }
        txt += `╰┈┈⬡\n\n`
        
        txt += `╭┈┈⬡「 📋 *الأوضاع المتاحة* 」\n`
        
        const currentMode = m.isGroup ? (groupMode || globalMode) : globalMode
        
        for (const [key, desc] of Object.entries(MODE_DESCRIPTIONS)) {
            const isActive = key === currentMode ? ' ✅' : ''
            txt += `┃ ㊗ *${key.toUpperCase()}*${isActive}\n`
            txt += `┃   ${desc}\n`
        }
        txt += `╰┈┈⬡\n\n`
        
        txt += `*مثال:*\n`
        txt += `> \`${m.prefix}بوت_مود store\` - طلب يدوي\n`
        txt += `> \`${m.prefix}بوت_مود md\` → الوضع الافتراضي\n`
        txt += `> \`${m.prefix}بوت_مود all\` → جميع الميزات`
        
        await m.reply(txt)
        return
    }

    if (!VALID_MODES.includes(mode)) {
        return m.reply(
            `❌ *وضع غير صالح*\n\n` +
            `> الأوضاع المتاحة: \`${VALID_MODES.join(', ')}\``
        )
    }

    if (m.isGroup) {
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
    } else {
        db.setting('botMode', mode)
    }

    db.save()
    await m.react('✅')

    let extraInfo = ''
    if (mode === 'store' && m.isGroup) {
        extraInfo = `\n\n📋 *الوضع اليدوي*\n> المشرف يحتاج لتأكيد الطلب يدوياً`
    }

    await m.reply(
        `✅ *تم تغيير الوضع*\n\n` +
        `> الوضع: *${mode.toUpperCase()}*\n` +
        `> ${MODE_DESCRIPTIONS[mode]}\n` +
        extraInfo +
        `\n\n` +
        (m.isGroup ? `> _تم تغيير وضع هذه المجموعة._` : `> _تم تغيير الوضع الشامل._`)
    )

    console.log(`[BotMode] تم التغيير إلى ${mode.toUpperCase()} بواسطة ${m.pushName} (${m.sender})`)
}

export { pluginConfig as config, handler, VALID_MODES, MODE_DESCRIPTIONS }