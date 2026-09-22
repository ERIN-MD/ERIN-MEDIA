// ═══════════════════════════════════════════════
// 📁 plugins/tools/تشيك.js
// 🔍 فحص رقم واتساب
// ═══════════════════════════════════════════════

import axios from 'axios'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'تشيك',
    alias: ['check'],
    category: 'tools',
    description: 'فحص رقم واتساب (مسجل/محظور/غير مسجل)',
    usage: '.تشيك <رقم>',
    example: '.تشيك 201142324733',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock, text }) {
    if (!text) {
        return m.reply(`🔍 *فحص رقم*\n\n📝 .تشيك <رقم>\n💡 .تشيك 201142324733\n📌 *يفضل كتابة الرقم بمفتاح الدولة*`)
    }

    let num = text.replace(/[^0-9]/g, '')

    // لو الرقم بدون مفتاح الدولة (مثلاً 01xxxxxxxxx)
    if (num.startsWith('0') && num.length >= 10) {
        return m.reply(`⚠️ *الرقم ناقص*\n\nالرجاء كتابة الرقم مع *مفتاح الدولة*\n\n📌 مثال: بدلاً من \`${num}\` اكتب \`2${num.slice(1)}\` أو \`20${num.slice(1)}\``)
    }

    // لو الرقم أقصر من 10 أرقام
    if (num.length < 10) {
        return m.reply(`⚠️ *الرقم قصير جداً*\n\nالرقم يجب أن يكون 10 أرقام على الأقل مع مفتاح الدولة\n📌 مثال: \`201142324733\``)
    }

    // لو الرقم أطول من 15 رقم
    if (num.length > 15) {
        return m.reply(`⚠️ *الرقم طويل جداً*\n\nتأكد من الرقم وحاول مرة أخرى`)
    }

    m.react('⏳')

    try {
        const { data } = await axios.get(`https://engez.a7a.online/api/v1/tools/checknum?num=${num}`)

        if (!data?.success) {
            m.react('❌')
            return m.reply('❌ *فشل الفحص*\n\nتأكد من صحة الرقم')
        }

        const res = data.response || data
        const msg = res.message || ''
        const status = res.status || ''

        let emoji = '⚪'
        if (status === 'registered') emoji = '🟢'
        else if (status === 'banned') emoji = '🔴'
        else emoji = '⚪'

        let reply = `${emoji} *فحص الرقم*\n\n`
        reply += `📱 *الرقم:* +${num}\n`
        reply += `🌍 *الدولة:* ${res.country || 'غير معروف'}\n`
        reply += `🗣️ *اللغة:* ${res.language || 'غير معروف'}\n`
        reply += `📊 *الحالة:* ${msg || status || 'غير معروف'}\n`

        if (res.raw?.summary?.fallback_methods) {
            reply += `🔐 *طرق التحقق:* ${res.raw.summary.fallback_methods.join(', ')}\n`
        }

        m.react('✅')
        await m.reply(reply)

    } catch (e) {
        m.react('❌')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }