import te from '../../src/lib/maro-error.js'
import { live3d } from '../../src/scraper/seaart.js'

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: 'لمانغا',
    alias: ['manga'],
    category: 'ai',
    description: 'تحويل الصورة إلى مانغا يابانية',
    usage: '.لمانغا (رد على صورة)',
    example: '.لمانغا',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 3,
    isEnabled: true
}

const PROMPT = `Transform this image into Japanese manga style illustration. 
Apply black and white manga aesthetics with dramatic shading, speed lines, 
expressive eyes, and detailed screentones. Keep the original composition 
but convert it to look like a page from a Japanese manga with bold ink lines, 
dynamic poses, and that distinctive manga art style.`

// ═══════════════════════════════════════════════
// 📖 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && (m.quoted.isImage || m.quoted.type === 'imageMessage'))
    
    if (!isImage) {
        return m.reply(`📖 *لمانغا*\n\n> رد على صورة لتحويلها إلى مانغا\n\n📌 *مثال:* \`${m.prefix}لمانغا\``)
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