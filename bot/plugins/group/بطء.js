import { getDatabase } from '../../src/lib/maro-database.js'
const pluginConfig = {
    name: 'بطء',
    alias: ['slowmode'],
    category: 'group',
    description: 'تفعيل وضع البطء — تحديد سرعة إرسال الرسائل',
    usage: '.بطء <تشغيل/إيقاف/اوامر_فقط> [ثواني]',
    example: '.بطء تشغيل 30',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const lastMessageTime = new Map()

const PRESETS = {
    هادئ: 10,
    عادي: 30,
    صارم: 60,
    صارم_جداً: 120,
    اقصى: 300,
}

const MODES = {
    all: 'جميع الرسائل والأوامر تُحذف',
    onlycommand: 'الأوامر فقط تٌكتم، الدردشة العادية حرة',
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const subCmd = args[0]?.toLowerCase()
    let groupData = db.getGroup(m.chat) || {}

    if (!subCmd || subCmd === 'حالة') {
        const sm = groupData.slowmode || {}
        const enabled = sm.enabled
        const delay = sm.delay || 30
        const mode = sm.mode || 'all'
        const presetList = Object.entries(PRESETS)
            .map(([name, sec]) => `  *.بطء ${name}* — ${sec}ث`)
            .join('\n')

        return m.reply(
            `🐢 *وضع البطء*\n\n` +
            `الحالة: ${enabled ? `✅ مفعل (${delay}ث)` : '❌ معطل'}\n` +
            `النمط: *${mode === 'all' ? 'الكل' : 'الأوامر فقط'}*\n\n` +
            `*الاستخدام:*\n` +
            `*.بطء تشغيل 30* — الكل\n` +
            `*.بطء اوامر_فقط 30* — أوامر فقط\n` +
            `*.بطء إيقاف* — تعطيل\n\n` +
            `*الإعدادات المسبقة:*\n${presetList}\n\n` +
            `_المشرفون والمالك لا يتأثرون_`
        )
    }

    if (subCmd === 'ايقاف' || subCmd === 'off') {
        db.setGroup(m.chat, { ...groupData, slowmode: { enabled: false } })
        return m.reply(`✅ تم *تعطيل* وضع البطء`)
    }

    let mode = 'all'
    let delay
    let delayArg

    if (subCmd === 'اوامر_فقط' || subCmd === 'onlycommand' || subCmd === 'oc') {
        mode = 'onlycommand'
        delayArg = args[1]
    } else if (subCmd === 'تشغيل' || subCmd === 'on') {
        delayArg = args[1]
    } else if (PRESETS[subCmd]) {
        delay = PRESETS[subCmd]
        mode = args[1]?.toLowerCase() === 'اوامر_فقط' || args[1]?.toLowerCase() === 'oc' ? 'onlycommand' : 'all'
    } else {
        delay = parseInt(subCmd)
        if (isNaN(delay)) return m.reply(`❌ استخدم *.بطء تشغيل 30* أو *.بطء اوامر_فقط 30*`)
    }

    if (!delay) {
        if (delayArg && PRESETS[delayArg]) { delay = PRESETS[delayArg] }
        else { delay = parseInt(delayArg) || 30 }
    }

    if (delay < 5 || delay > 600) return m.reply(`❌ يجب أن يكون الوقت بين 5–600 ثانية`)

    db.setGroup(m.chat, { ...groupData, slowmode: { enabled: true, delay, mode } })

    const presetName = Object.entries(PRESETS).find(([, v]) => v === delay)?.[0]
    const label = presetName ? ` (${presetName})` : ''
    const modeDesc = mode === 'all' ? 'جميع الرسائل والأوامر' : 'الأوامر فقط'

    await m.reply(
        `✅ تم *تفعيل* وضع البطء\n\n` +
        `الوقت: *${delay} ثانية*${label}\n` +
        `النمط: *${mode === 'all' ? 'الكل' : 'الأوامر فقط'}*\n` +
        `${modeDesc}\n\n` +
        `_المشرفون والمالك لا يتأثرون_`
    )
}

function checkSlowmode(m, sock, db) {
    if (!m.isGroup) return false
    const groupData = db.getGroup(m.chat) || {}
    if (!groupData.slowmode?.enabled) return false
    const sm = groupData.slowmode
    const mode = sm.mode || 'all'
    if (mode === 'onlycommand' && !m.isCommand) return false
    const delay = sm.delay || 30
    const key = `${m.chat}_${m.sender}`
    const now = Date.now()
    const lastTime = lastMessageTime.get(key) || 0
    const timePassed = (now - lastTime) / 1000
    if (timePassed < delay) return { remaining: Math.ceil(delay - timePassed), mode }
    lastMessageTime.set(key, now)
    if (lastMessageTime.size > 5000) {
        const cutoff = now - 600_000
        for (const [k, v] of lastMessageTime) { if (v < cutoff) lastMessageTime.delete(k) }
    }
    return false
}

export { pluginConfig as config, handler, checkSlowmode }