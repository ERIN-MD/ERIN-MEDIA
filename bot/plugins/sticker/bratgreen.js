import config from '../../config.js'
import { bratImage } from '../../src/lib/maro-brat.js'
const pluginConfig = {
    name: 'bratgreen',
    alias: ['brat2'],
    category: 'sticker',
    description: 'Membuat sticker brat ijo',
    usage: '.brat2 <text>',
    example: '.brat2 Hai semua',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.text
    if (!text) {
        return m.reply(`🖼️ *ʙʀᴀᴛ ɢʀᴇᴇɴ*\n\n> Masukkan teks\n\n\`Contoh: ${m.prefix}bratgreen Hai semua\``)
    }
    
    m.react('🕕')
    
    try {
        await sock.sendImageAsSticker(m.chat, bratImage(text, 'green'), m, {
            packname: config.sticker.packname,
            author: config.sticker.author
        })
        
        m.react('✅')
        
    } catch (error) {
        console.error('Brat Green Error:', error)
        m.react('❌')
    }
}

export { pluginConfig as config, handler }
