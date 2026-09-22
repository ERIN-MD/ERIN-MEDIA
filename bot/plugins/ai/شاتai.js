// ═══════════════════════════════════════════════
// 📁 plugins/ai/شاتai.js
// 🤖 شات AI - GPT-4o مجاني
// ═══════════════════════════════════════════════

import { chat, createAnonymousSession } from '../../src/scraper/chatday.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'شاتai',
    alias: ['شات_ai', 'ذكاء'],
    category: 'ai',
    description: 'شات AI - GPT-4o مجاني',
    usage: '.شاتai <سؤال>',
    example: '.شاتai ما هو الذكاء الاصطناعي؟',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 2,
    isEnabled: true
}

const sessions = {}

async function handler(m, { sock, text }) {
    if (!text) {
        return m.reply(`🤖 *شات AI*\n\n📝 .شاتai <سؤال>\n💡 .شاتai اشرحلي الذكاء الاصطناعي`)
    }

    m.react('⏳')

    const jid = m.sender
    if (!sessions[jid]) {
        const session = await createAnonymousSession()
        sessions[jid] = { cookie: session.cookie, history: [] }
    }

    try {
        const result = await chat({
            content: text,
            model: 'openai/gpt-4o-mini',
            cookie: sessions[jid].cookie,
            history: sessions[jid].history
        })

        if (result.rotated) {
            sessions[jid].cookie = result.cookie
        }

        const reply = typeof result.data === 'string' ? result.data : JSON.stringify(result.data)

        sessions[jid].history.push(
            { role: 'user', content: text },
            { role: 'assistant', content: reply }
        )

        m.react('✅')
        await m.reply(reply.substring(0, 4000))

    } catch (e) {
        m.react('❌')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }