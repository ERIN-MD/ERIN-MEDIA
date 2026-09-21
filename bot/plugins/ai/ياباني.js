import axios from 'axios'
import { uploadImage } from '../../src/lib/maro-uploader.js'
import { f } from '../../src/lib/maro-http.js'
import te from '../../src/lib/maro-error.js'

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: 'ياباني',
    alias: ['japanese'],
    category: 'ai',
    description: 'تحويل الصورة إلى النمط الياباني',
    usage: '.ياباني (رد على صورة)',
    example: '.ياباني',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 2,
    isEnabled: true
}

// ═══════════════════════════════════════════════
// 🎌 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
    
    if (!isImage) {
        return m.reply(`🎌 *ياباني*\n\n> رد على صورة لتحويلها إلى النمط الياباني\n\n📌 *مثال:* \`${m.prefix}ياباني\``)
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
        
        const url = `https://api-faa.my.id/faa/tojapanese?url=${encodeURIComponent(imageUrl)}`
        const res = await f(url, 'arrayBuffer')
        
        m.react('✅')
        await sock.sendMedia(m.chat, Buffer.from(res), null, m, { type: 'image' })
        
    } catch (error) {
        m.react('❌')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }