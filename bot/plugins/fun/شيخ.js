import { f } from '../../src/lib/maro-http.js'
import te from '../../src/lib/maro-error.js'

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: 'شيخ',
    alias: ['ustad'],
    category: 'fun',
    description: 'اسأل الشيخ (صورة)',
    usage: '.شيخ <سؤال>',
    example: '.شيخ لماذا أنا وسيم',
    isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
    cooldown: 10, energi: 1, isEnabled: true
}

// ═══════════════════════════════════════════════
// 📿 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
    const text = m.text || m.quoted?.text
    
    if (!text) {
        return m.reply(`📿 *شيخ*\n\n📌 مثال: \`${m.prefix}شيخ لماذا أنا وسيم\``)
    }
    
    await m.react('⏳')
    
    try {
        const apiUrl = `https://api.cuki.biz.id/api/canvas/ustadz?apikey=cuki-x&text=${encodeURIComponent(text)}`
        const { results } = await f(apiUrl)
        await sock.sendMedia(m.chat, results.url, text, m, { type: 'image' })
        m.react('✅')
        
    } catch (err) {
        m.react('❌')
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }