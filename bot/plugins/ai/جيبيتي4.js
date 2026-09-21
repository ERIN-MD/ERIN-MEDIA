// ═══════════════════════════════════════════════
// 📁 plugins/ai/gpt4.js
// 🧠 GPT-4 - محادثة ذكاء اصطناعي
// ═══════════════════════════════════════════════

import { f } from '../../src/lib/maro-http.js'
import te from '../../src/lib/maro-error.js'
import axios from 'axios'
import config from '../../config.js'

const pluginConfig = {
    name: 'جيبيتي4',
    alias: ['شاتai', 'chatai', 'gpt', 'ai'],
    category: 'ai',
    description: 'محادثة مع GPT-4',
    usage: '.gpt4 <سؤال>',
    example: '.gpt4 ما هو الجافاسكريبت؟',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m) {
    const text = m.text
    if (!text) {
        return m.reply(
            `🧠 *GPT-4*\n\n` +
            `📝 .gpt4 <سؤال>\n` +
            `💡 .gpt4 ما هو الجافاسكريبت؟`
        )
    }
    m.react('⏳')
    try {
        const data = await axios.get(`https://firefly.maiku.my.id/api/deepaichat?apikey=${config.APIkey.firefly}&text=${encodeURIComponent(text)}`)
        m.react('✅')
        const reply = data.data.data || data.data.results
        await m.reply(`\`\`\`\n${reply}\n\`\`\``)
    } catch (error) {
        m.react('❌')
        console.log(error)
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }