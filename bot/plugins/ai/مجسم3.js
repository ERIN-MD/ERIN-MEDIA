import te from '../../src/lib/maro-error.js'
import { live3d } from '../../src/scraper/seaart.js'

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: 'مجسم3',
    alias: ['figure3'],
    category: 'ai',
    description: 'تحويل الصورة إلى تمثال أكشن',
    usage: '.مجسم3 (رد على صورة)',
    example: '.مجسم3',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 3,
    isEnabled: true
}

const PROMPT = `Using the model, create a 1/7 scale commercialized figurine of the characters in the picture, 
in a realistic style, in a real environment. The figurine is placed on a computer desk. 
The figurine has a round transparent acrylic base, with no text on the base. 
The content on the computer screen is the modeling process of this figurine. 
Next to the computer screen is a BANDAI-style toy packaging box printed with the original artwork. 
The packaging features two-dimensional flat illustrations.`

// ═══════════════════════════════════════════════
// 🎭 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && (m.quoted.isImage || m.quoted.type === 'imageMessage'))
    
    if (!isImage) {
        return m.reply(`🎭 *مجسم3*\n\n> رد على صورة لتحويلها إلى تمثال\n\n📌 *مثال:* \`${m.prefix}مجسم3\``)
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