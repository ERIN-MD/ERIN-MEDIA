// فتيات_مصر - أمر للحصول على 5 صور عشوائية لفتيات جميلات من مصر في Carousel

import axios from 'axios'
import config from '../../config.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'فتيات_مصر',
    alias: ['cecanmesir'],
    category: 'cecan',
    description: '5 صور عشوائية لفتيات جميلات من مصر في Carousel',
    usage: '.فتيات_مصر',
    example: '.فتيات_مصر',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 2,
    isEnabled: true
}

async function handler(m, { sock }) {
    await m.react('🇪🇬')
    
    try {
        // جلب 5 صور عشوائية
        const images = []
        for (let i = 0; i < 5; i++) {
            const res = await axios.get('https://api.nexray.web.id/random/cecan/egypt', {
                responseType: 'arraybuffer'
            })
            const buffer = Buffer.from(res.data)
            images.push({ image: buffer })
        }
        
        // إرسال كـ Carousel (ألبوم)
        await sock.sendMessage(m.chat, {
            albumMessage: images
        }, { quoted: m })
        
        await m.react('✅')
    } catch (e) {
        await m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }