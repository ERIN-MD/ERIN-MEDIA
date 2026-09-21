import te from '../../src/lib/maro-error.js'
import axios from 'axios'
import config from '../../config.js'

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: 'رياضيات',
    alias: ['math'],
    category: 'ai',
    description: 'حل المسائل الرياضية',
    usage: '.رياضيات <مسألة>',
    example: '.رياضيات ما ناتج 2+2؟',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

// ═══════════════════════════════════════════════
// 📐 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
    const text = m.args.join(' ')

    if (!text) {
        return m.reply(`📐 *رياضيات*\n\n> اكتب مسألتك\n\n📌 *مثال:* \`${m.prefix}رياضيات ما ناتج 2+2؟\``)
    }

    m.react('⏳')

    try {
        const url = `https://api.nexray.eu.cc/ai/mathgpt?text=${encodeURIComponent(text)}`
        
        const { data } = await axios.get(url, {
            timeout: 30000,
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
        })

        if (!data.status || !data.result) {
            await m.react('❌')
            return m.reply("⚠️ فشل حل المسألة الرياضية.")
        }

        const answer = data.result

        m.react('✅')
        await m.reply(`${answer}`)

    } catch (error) {
        m.react('❌')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }