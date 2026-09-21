import te from '../../src/lib/maro-error.js'
import { live3d } from '../../src/scraper/seaart.js'

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: 'لانعكاس',
    alias: ['mirror'],
    category: 'ai',
    description: 'تحويل الصورة إلى تأثير مرآة',
    usage: '.لانعكاس (رد على صورة)',
    example: '.لانعكاس',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 3,
    isEnabled: true
}

const PROMPT = `Create a mirror reflection effect of this image. 
Add a realistic reflection as if the subject is in front of a mirror or reflective surface. 
Ensure symmetry, smooth reflection blending, realistic lighting and shadows. 
Keep the original identity and details, high quality, photorealistic.`

// ═══════════════════════════════════════════════
// 🪞 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && (m.quoted.isImage || m.quoted.type === 'imageMessage'))
    
    if (!isImage) {
        return m.reply(`🪞 *لانعكاس*\n\n> رد على صورة لإضافة تأثير المرآة\n\n📌 *مثال:* \`${m.prefix}لانعكاس\``)
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