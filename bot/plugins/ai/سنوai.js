import { chat } from '../../src/scraper/multiAI.js'

const pluginConfig = {
    name: 'سنوai',
    alias: ['snowai', 'سنو', 'snowping', 'snow'],
    category: 'ai',
    description: 'محادثة ذكاء اصطناعي عبر مزودي Tarboo Bot',
    usage: '.سنوai <سؤال>',
    example: '.سنوai كيف حالك؟',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock, text }) {
    if (!text) return m.reply(`🤖 *SnowPing AI*\n\n> \`${m.prefix}سنوai <سؤال>\`\n\n> مثال:\n> \`${m.prefix}سنوai كيف حالك؟\``)
    
    await m.react('🤖')
    
    try {
        const result = await chat({ message: text, model: 'auto' })
        if (result?.status && result?.text) {
            return m.reply(result.text)
        }
        throw new Error(result?.error || 'لم يُرجع مزود الذكاء الاصطناعي إجابة.')
    } catch (e) {
        console.error('Snow AI fallback Error:', e.message)
        return m.react('❌')
    }
}

export { pluginConfig as config, handler }
