import axios from 'axios'
import { uploadImage } from '../../src/lib/maro-uploader.js'
import { f } from '../../src/lib/maro-http.js'
import te from '../../src/lib/maro-error.js'

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: 'مجسم',
    alias: ['figure'],
    category: 'ai',
    description: 'تحويل الصورة إلى نمط مجسم',
    usage: '.مجسم (رد على صورة)',
    example: '.مجسم',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 2,
    isEnabled: true
}

// ═══════════════════════════════════════════════
// 🎭 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
    
    if (!isImage) {
        return m.reply(`🎭 *مجسم*\n\n> رد على صورة لتحويلها إلى نمط مجسم\n\n📌 *مثال:* \`${m.prefix}مجسم\``)
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
        
        const imageUrl = await uploadImage(buffer, 'image.jpg')
        
        const apiUrl = `https://api-faa.my.id/faa/tofigura?url=${encodeURIComponent(imageUrl)}`
        const res = await axios.get(apiUrl, { responseType: 'arraybuffer' })
        
        m.react('✅')
        await sock.sendMedia(m.chat, Buffer.from(res.data), null, m, { type: 'image' })
        
    } catch (error) {
        m.react('❌')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }