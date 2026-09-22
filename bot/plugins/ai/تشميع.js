import { live3d } from '../../src/scraper/seaart.js'
import te from '../../src/lib/maro-error.js'

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: 'تشميع',
    alias: ['oil'],
    category: 'ai',
    description: 'تحويل الصورة إلى لوحة زيتية',
    usage: '.تشميع (رد على صورة)',
    example: '.تشميع',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 3,
    isEnabled: true
}

const PROMPT = `Transform this image into a classical oil painting style. 
Apply thick brushstrokes, rich colors, and the texture of traditional oil paint on canvas. 
Keep the original composition but make it look like a masterpiece painting 
with visible brushwork, artistic color blending, and that timeless gallery-quality aesthetic.`

// ═══════════════════════════════════════════════
// 🖼️ دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && (m.quoted.isImage || m.quoted.type === 'imageMessage'))
    
    if (!isImage) {
        return m.reply(`🖼️ *تشميع*\n\n> رد على صورة لتحويلها إلى لوحة زيتية\n\n📌 *مثال:* \`${m.prefix}تشميع\``)
    }
    
    m.react('⏳')
    
    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }
        
        if (!buffer) {
            m.react('❌')
            return m.reply(`❌ فشل تحميل الصورة`)
        }
        
        const result = await live3d(buffer, PROMPT)
        
        m.react('✅')
        await sock.sendMedia(m.chat, result.image, null, m, { type: 'image' })
        
    } catch (error) {
        m.react('❌')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }