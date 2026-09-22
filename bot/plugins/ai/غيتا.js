import axios from 'axios'
import { f } from '../../src/lib/maro-http.js'
import te from '../../src/lib/maro-error.js'
import config from '../../config.js'

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: 'غيتا',
    alias: ['gita'],
    category: 'ai',
    description: 'محادثة مع Gita GPT',
    usage: '.غيتا <سؤال>',
    example: '.غيتا ما هي الدارما؟',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

// ═══════════════════════════════════════════════
// 📿 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
    const text = m.args.join(' ')
    if (!text) {
        return m.reply(`📿 *Gita GPT*\n\n> اكتب سؤالك\n\n📌 *مثال:* \`${m.prefix}غيتا ما هي الدارما؟\``)
    }

    m.react('⏳')

    try {
        const url = `https://api.cuki.biz.id/api/ai/gita?apikey=${config.APIkey.cuki}&q=${encodeURIComponent(text)}`
        const data = await f(url)
        const content = data.results

        m.react('✅')
        await m.reply(`${content?.trim()}`)

    } catch (error) {
        m.react('❌')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }