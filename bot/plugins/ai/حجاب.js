import axios from 'axios'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'حجاب',
    alias: ['tohijab', 'hijab', 'اضافة_حجاب'],
    category: 'ai',
    description: 'إضافة حجاب على الصورة',
    usage: '.حجاب (رد على صورة)',
    example: '.حجاب',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 2,
    isEnabled: true
}

async function uploadToPixhost(buffer) {
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('img', buffer, 'image.jpg');
    form.append('content_type', '0');
    const res = await axios.post('https://api.pixhost.to/images', form, {
        headers: { ...form.getHeaders() },
        timeout: 30000
    });
    return res.data?.th_url || res.data?.show_url;
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
    
    if (!isImage) {
        return m.reply(`🧕 *إضافة حجاب*\n\n> رد على صورة\n\n\`${m.prefix}حجاب\``)
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
        
        const imageUrl = await uploadToPixhost(buffer)
        
        const res = await axios.get('https://api-faa.my.id/faa/tohijab', {
            params: { url: imageUrl },
            responseType: 'arraybuffer',
            timeout: 60000
        })
        
        await sock.sendMessage(m.chat, {
            image: Buffer.from(res.data)
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }