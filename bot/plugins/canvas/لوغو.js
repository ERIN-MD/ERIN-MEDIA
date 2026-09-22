import { f } from '../../src/lib/maro-http.js'
import te from '../../src/lib/maro-error.js'

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: 'لوغو',
    alias: ['ba'],
    category: 'canvas',
    description: 'صنع لوجو Blue Archive',
    usage: '.لوغو <نص1> & <نص2>',
    example: '.لوغو Blue & Archive',
    isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
    cooldown: 10, energi: 1, isEnabled: true
}

// ═══════════════════════════════════════════════
// 🎮 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
    const input = m.text?.trim() || ''
    const parts = input.split(/[&,]/).map(s => s.trim()).filter(s => s)
    
    if (parts.length < 2) {
        return m.reply(`🎮 *لوغو*\n\n📌 مثال: \`${m.prefix}لوغو Blue & Archive\``)
    }
    
    const textL = parts[0]
    const textR = parts[1]
    
    m.react('⏳')
    
    try {
        // API بديل مباشر
        const apiUrl = `https://api.nexray.eu.cc/maker/balogo?text=${encodeURIComponent(textL + ' ' + textR)}`
        const response = await f(apiUrl, 'arrayBuffer')
        
        if (!response || response.length < 100) {
            throw new Error('فشل التوليد')
        }
        
        await sock.sendMedia(m.chat, Buffer.from(response), null, m, { type: 'image' })
        m.react('✅')
        
    } catch (error) {
        m.react('❌')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }