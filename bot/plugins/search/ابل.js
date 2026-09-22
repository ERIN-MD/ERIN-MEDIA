import axios from 'axios'
import te from '../../src/lib/maro-error.js'

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: 'ابل',
    alias: ['apple'],
    category: 'search',
    description: 'بحث في Apple Music',
    usage: '.ابل <بحث>',
    example: '.ابل Best Friend',
    isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
    cooldown: 5, energi: 0, isEnabled: true
}

// ═══════════════════════════════════════════════
// 🍎 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
    const query = m.text?.trim()
    
    if (!query) {
        return m.reply(
            `🍎 *Apple Music*\n\n` +
            `> \`${m.prefix}ابل <بحث>\`\n\n` +
            `💡 مثال: \`${m.prefix}ابل Best Friend\``
        )
    }
    
    try {
        const res = await axios.get(`https://api.nexray.web.id/search/applemusic?q=${encodeURIComponent(query)}`)
        
        if (!res.data?.result?.length) {
            return m.reply(`❌ لم يتم العثور على نتائج لـ: ${query}`)
        }
        
        const tracks = res.data.result.slice(0, 5)
        
        let txt = `🍎 *Apple Music*\n\n`
        txt += `> البحث: *${query}*\n\n`                                                                                    
        
        tracks.forEach((t, i) => {
            txt += `*${i + 1}.* \`${t.title}\`\n`
            txt += `   ├ 📀 \`${t.subtitle || 'غير معروف'}\`\n`
            txt += `   └ 🔗 \`${t.link}\`\n\n`
        })
        
        return m.reply(txt.trim())
        
    } catch (err) {
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }