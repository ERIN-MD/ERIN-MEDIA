import { f } from '../../src/lib/maro-http.js'
import config from '../../config.js'
import te from '../../src/lib/maro-error.js'

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: 'رسم_انمي',
    alias: ['animegen'],
    category: 'ai',
    description: 'توليد صور أنمي بالذكاء الاصطناعي',
    usage: '.رسم_انمي <وصف>',
    example: '.رسم_انمي فتاة، ألوان زاهية',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 1,
    isEnabled: true
}

// ═══════════════════════════════════════════════
// 🎨 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
    const prompt = m.text
    
    if (!prompt) {
        return m.reply(
            `🎨 *رسم أنمي*\n\n` +
            `> توليد صور أنمي بالذكاء الاصطناعي!\n\n` +
            `📌 *مثال:* \`${m.prefix}رسم_انمي فتاة، ألوان زاهية\`\n\n` +
            `💡 *نصائح:*\n` +
            `> • استخدم الإنجليزية لنتائج أفضل\n` +
            `> • كلما كان الوصف أدق كانت النتيجة أجمل`
        )
    }
    
    m.react('⏳')

    try {
        const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-MaroMD'
        const apiUrl = `https://api.neoxr.eu/api/ai-anime?q=${encodeURIComponent(prompt)}&apikey=${NEOXR_APIKEY}`
        
        const data = await f(apiUrl)
        
        if (!data?.status || !data?.data?.url) {
            m.react('❌')
            return m.reply('❌ فشل توليد الصورة. حاول مرة أخرى!')
        }
        
        const result = data.data  
        await sock.sendMedia(m.chat, result.url, null, m, { type: 'image' })
        m.react('✅')
    } catch (error) {
        m.react('❌')
        if (error.code === 'ECONNABORTED') {
            m.reply('⏱️ انتهت المهلة. حاول مجدداً!')
        } else {
            m.reply(te(m.prefix, m.command, m.pushName))
        }
    }
}

export { pluginConfig as config, handler }