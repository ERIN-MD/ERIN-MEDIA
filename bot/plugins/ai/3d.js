import te from '../../src/lib/maro-error.js'
import { live3d } from '../../src/scraper/seaart.js'

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: '3d',
    alias: ['to3d'],
    category: 'ai',
    description: 'تحويل الصورة إلى 3D',
    usage: '.3d (رد على صورة)',
    example: '.3d',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 3,
    isEnabled: true
}

const PROMPT = `Transform this image into a high-quality 3D rendered style like Pixar or DreamWorks CGI. 
Apply realistic lighting, smooth textures, and that polished 3D animated movie look. 
Keep the original composition but make it look like a frame from a modern 3D animated film 
with subsurface scattering on skin, detailed hair, and cinematic lighting.`

// ═══════════════════════════════════════════════
// 🎮 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && (m.quoted.isImage || m.quoted.type === 'imageMessage'))
    
    if (!isImage) {
        return m.reply(`🎮 *3D*\n\n> رد على صورة لتحويلها إلى 3D\n\n📌 *مثال:* \`${m.prefix}3d\``)
    }
    
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
        
        await m.react('⏳')
        
        const result = await live3d(buffer, PROMPT)
        
        m.react('✅')
        await sock.sendMedia(m.chat, result.image, null, m, { type: 'image' })
        
    } catch (error) {
        m.react('❌')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }