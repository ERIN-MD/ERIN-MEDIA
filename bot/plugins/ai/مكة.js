import axios from 'axios'
import { uploadImage } from '../../src/lib/maro-uploader.js'
import { f } from '../../src/lib/maro-http.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'مكة',
    alias: ['tomekah', 'mekah', 'mecca'],
    category: 'ai',
    description: 'تغيير خلفية الصورة إلى مكة المكرمة',
    usage: '.مكة (رد على صورة)',
    example: '.مكة',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 2,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
    
    if (!isImage) {
        return m.reply(`🕋 *تغيير الخلفية إلى مكة*\n\n> رد على صورة\n\n\`${m.prefix}مكة\``)
    }
    
    m.react('🕕')
    
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
        
        const url = `https://api-faa.my.id/faa/tomekah?url=${encodeURIComponent(imageUrl)}`
        const res = await f(url, 'arrayBuffer')
        
        m.react('✅')
        
        await sock.sendMedia(m.chat, Buffer.from(res), null, m, {
            type: 'image',
        })
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }