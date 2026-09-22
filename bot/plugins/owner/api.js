// ═══════════════════════════════════════════════
// 📁 plugins/owner/api.js
// 🔧 API Tester - عرض الرد في جدول
// ═══════════════════════════════════════════════

import { AIRich } from '../../src/lib/maro-builder.js'

const pluginConfig = {
    name: 'api',
    alias: ['fetch', 'http', 'curl'],
    category: 'owner',
    description: 'فحص API وعرض الرد في جدول',
    usage: '.api <رابط>',
    example: '.api https://api.example.com/data',
    isOwner: true,
    cooldown: 3,
    isEnabled: true
}

async function handler(m, { sock, text }) {
    if (!text) {
        return m.reply(`🔧 *API*\n\n.api <رابط>`)
    }

    m.react('⏳')

    try {
        const res = await fetch(text)
        const contentType = res.headers.get('content-type') || ''
        let data

        if (contentType.includes('json')) {
            data = await res.json()
        } else {
            data = await res.text()
        }

        const result = typeof data === 'object' ? JSON.stringify(data, null, 2) : data

        const msg = new AIRich(sock)
        msg.setTitle(`🔧 API - ${res.status}`)
        msg.addText(`📡 *الرابط:* ${text}`)
        msg.addCode("python", result.substring(0, 4000))
        msg.addTable([["📡 الرابط", text], ["📊 الحالة", String(res.status)], ["📝 النوع", contentType || "غير معروف"]])
        await msg.send(m.chat, { quoted: m })
        m.react('✅')

    } catch (e) {
        m.react('❌')
        await m.reply(`❌\n\`\`\`\n${e.message}\n\`\`\``)
    }
}

export { pluginConfig as config, handler }