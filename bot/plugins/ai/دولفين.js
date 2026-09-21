import axios from 'axios'
import config from '../../config.js'
import te from '../../src/lib/maro-error.js'

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: 'دولفين',
    alias: ['dolphin'],
    category: 'ai',
    description: 'محادثة مع Dolphin AI',
    usage: '.دولفين <سؤال> أو .دولفين --<قالب> <سؤال>',
    example: '.دولفين اشرح عن الذكاء الاصطناعي',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

const TEMPLATES = ['logical', 'creative', 'summarize', 'code-beginner', 'code-advanced']

async function dolphinAI(question, template = 'logical') {
    const { data } = await axios.post('https://chat.dphn.ai/api/chat', {
        messages: [{ role: 'user', content: question }],
        model: 'dolphinserver:24B',
        template: template
    }, {
        headers: {
            origin: 'https://chat.dphn.ai',
            referer: 'https://chat.dphn.ai/',
            'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
        }
    })
    
    const result = data.split('\n\n')
        .filter(line => line && line.startsWith('data: {'))
        .map(line => JSON.parse(line.substring(6)))
        .map(line => line.choices[0].delta.content)
        .join('')
    
    if (!result) throw new Error('لا يوجد رد من الذكاء الاصطناعي')
    
    return result
}

// ═══════════════════════════════════════════════
// 🎯 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
    let text = m.text?.trim()
    
    if (!text) {
        return m.reply(
            `🐬 *Dolphin AI*\n\n` +
            `> محادثة مع Dolphin AI\n\n` +
            `╭┈┈⬡「 📋 *القوالب* 」\n` +
            `┃ • \`logical\` - إجابة منطقية\n` +
            `┃ • \`creative\` - إجابة إبداعية\n` +
            `┃ • \`summarize\` - تلخيص\n` +
            `┃ • \`code-beginner\` - كود مبتدئ\n` +
            `┃ • \`code-advanced\` - كود متقدم\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `📌 *مثال:* \`${m.prefix}دولفين ما هو الذكاء الاصطناعي؟\``
        )
    }
    
    let template = 'logical'
    
    const templateMatch = text.match(/^--(\S+)\s+/)
    if (templateMatch) {
        const requestedTemplate = templateMatch[1].toLowerCase()
        if (TEMPLATES.includes(requestedTemplate)) {
            template = requestedTemplate
            text = text.replace(templateMatch[0], '').trim()
        }
    }
    
    if (!text) return m.reply(`❌ اكتب سؤالك!`)
    
    await m.react('⏳')
    
    try {
        const result = await dolphinAI(text, template)
        await m.reply(result)
        await m.react('✅')
    } catch (error) {
        await m.react('❌')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }