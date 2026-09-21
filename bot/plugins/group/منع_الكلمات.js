import { getDatabase } from '../../src/lib/maro-database.js'
import config from '../../config.js'
const pluginConfig = {
    name: 'منع_الكلمات',
    alias: ['antitoxic'],
    category: 'group',
    description: 'منع الكلمات البذيئة في المجموعة',
    usage: '.منع_الكلمات <تشغيل/إيقاف/تحذير/طريقة>',
    example: '.منع_الكلمات تشغيل',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const DEFAULT_TOXIC_WORDS = [
    'كلب', 'خنزير', 'غبي', 'أحمق', 'حقير', 'تافه',
    'سافل', 'منحط', 'وسخ', 'قذر', 'لعنة', 'شيطان',
    'تباً', 'سحقاً', 'لعين', 'ملعون'
]

function isToxic(text, toxicList) {
    if (!text || typeof text !== 'string') return { toxic: false, word: null }
    const lowerText = text.toLowerCase().trim()
    if (!lowerText) return { toxic: false, word: null }
    const words = (toxicList && toxicList.length > 0) ? toxicList : DEFAULT_TOXIC_WORDS
    for (const word of words) {
        if (!word) continue
        const lowerWord = word.toLowerCase().trim()
        if (!lowerWord) continue
        const escapedWord = lowerWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`(^|\\s|[^\\w])${escapedWord}($|\\s|[^\\w])`, 'i')
        if (regex.test(lowerText)) { return { toxic: true, word } }
    }
    return { toxic: false, word: null }
}

function gpMsg(key, replacements = {}) {
    const defaults = {
        antitoxicWarn: '⚠ @%user% تكلم بكلام بذيء.\nتحذير رقم %warn% من %max%، المخالفة التالية قد تؤدي إلى %method%.',
        antitoxicAction: '🚫 @%user% تم %method% بسبب الكلام البذيء. (%warn%/%max%)',
    }
    let text = config.groupProtection?.[key] || defaults[key] || ''
    for (const [k, v] of Object.entries(replacements)) {
        text = text.replace(new RegExp(`%${k}%`, 'g'), v)
    }
    return text
}

async function handleToxicMessage(m, sock, db, toxicWord) {
    const groupData = db.getGroup(m.chat) || {}
    const maxWarn = groupData.toxicMaxWarn || 3
    const method = groupData.toxicMethod || 'kick'
    const warnCount = (groupData.toxicWarns?.[m.sender] || 0) + 1
    if (!groupData.toxicWarns) groupData.toxicWarns = {}
    groupData.toxicWarns[m.sender] = warnCount
    db.setGroup(m.chat, groupData)

    try { await sock.sendMessage(m.chat, { delete: m.key }) } catch {}
    const senderTag = m.sender.split('@')[0]

    if (warnCount >= maxWarn) {
        if (method === 'kick') { try { await sock.groupParticipantsUpdate(m.chat, [m.sender], 'remove') } catch {} }
        groupData.toxicWarns[m.sender] = 0
        db.setGroup(m.chat, groupData)
        await sock.sendMessage(m.chat, { text: gpMsg('antitoxicAction', { user: senderTag, warn: String(warnCount), max: String(maxWarn), method: method === 'kick' ? 'طرد' : 'حذف' }), mentions: [m.sender] })
    } else {
        await sock.sendMessage(m.chat, { text: gpMsg('antitoxicWarn', { user: senderTag, warn: String(warnCount), max: String(maxWarn), method: method === 'kick' ? 'الطرد' : 'الحذف' }), mentions: [m.sender] })
    }
    return true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const subCommand = args[0]?.toLowerCase()
    const groupData = db.getGroup(m.chat) || {}

    if (!subCommand) {
        const status = groupData.antitoxic ? '✅ مفعل' : '❌ معطل'
        const toxicCount = groupData.toxicWords?.length || DEFAULT_TOXIC_WORDS.length
        const maxWarn = groupData.toxicMaxWarn || 3
        const method = groupData.toxicMethod || 'kick'

        let txt = `🛡️ *منع الكلمات*\n\n`
        txt += `> الحالة: *${status}*\n`
        txt += `> عدد الكلمات: *${toxicCount}*\n`
        txt += `> الحد الأقصى للتحذير: *${maxWarn}*\n`
        txt += `> الطريقة: *${method === 'kick' ? 'طرد' : 'حذف'}*\n\n`
        txt += `*الأوامر:*\n`
        txt += `> \`.منع_الكلمات تشغيل/إيقاف\`\n`
        txt += `> \`.منع_الكلمات تحذير <1-10>\`\n`
        txt += `> \`.منع_الكلمات طريقة طرد/حذف\`\n`
        txt += `> \`.اضافة_كلمة <كلمة>\`\n`
        txt += `> \`.حذف_كلمة <كلمة>\`\n`
        txt += `> \`.قائمة_الكلمات\``
        await m.reply(txt)
        return
    }

    if (subCommand === 'تشغيل' || subCommand === 'on') {
        db.setGroup(m.chat, { antitoxic: true })
        m.react('✅')
        await m.reply(`✅ *تم تفعيل منع الكلمات*`)
        return
    }

    if (subCommand === 'ايقاف' || subCommand === 'off') {
        db.setGroup(m.chat, { antitoxic: false })
        m.react('❌')
        await m.reply(`❌ *تم تعطيل منع الكلمات*`)
        return
    }

    if (subCommand === 'تحذير' || subCommand === 'warn') {
        const count = parseInt(args[1])
        if (!count || count < 1 || count > 10) {
            return m.reply(`❌ أدخل رقماً من 1-10\n> مثال: \`.منع_الكلمات تحذير 5\``)
        }
        db.setGroup(m.chat, { toxicMaxWarn: count })
        m.react('✅')
        await m.reply(`✅ تم تغيير الحد الأقصى للتحذير إلى *${count}*`)
        return
    }

    if (subCommand === 'طريقة' || subCommand === 'metode' || subCommand === 'method') {
        const method = args[1]?.toLowerCase()
        if (!method || !['طرد', 'حذف', 'kick', 'delete'].includes(method)) {
            return m.reply(`❌ اختر: *طرد* أو *حذف*\n> مثال: \`.منع_الكلمات طريقة طرد\``)
        }
        const finalMethod = method === 'طرد' ? 'kick' : 'delete'
        db.setGroup(m.chat, { toxicMethod: finalMethod })
        m.react('✅')
        await m.reply(`✅ تم تغيير الطريقة إلى *${method === 'طرد' ? 'طرد' : 'حذف'}*`)
        return
    }

    await m.reply(`❌ أمر غير معروف.\n> اكتب \`.منع_الكلمات\` للاطلاع على قائمة الأوامر.`)
}

export { pluginConfig as config, handler, isToxic, handleToxicMessage, DEFAULT_TOXIC_WORDS }