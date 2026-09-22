import config from '../../config.js'
import { bratImage } from '../../src/lib/maro-brat.js'

const pluginConfig = {
    name: 'brathd',
    alias: ['brathdsticker', 'brathds'],
    category: 'sticker',
    description: 'Membuat sticker brat HD',
    usage: '.brathd <text>',
    example: '.brathd hello world',
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
        return m.reply(`🖼️ *ʙʀᴀᴛ ʜᴅ sᴛɪᴄᴋᴇʀ*\n\n> Masukkan teks\n\n\`Contoh: ${m.prefix}brathd hello world\``)
    }
    
    m.react('🕕')
    
    try {
        await sock.sendImageAsSticker(m.chat, bratImage(text, 'hd'), m, {
            packname: config.sticker.packname,
            author: config.sticker.author
        })
        m.react('✅')
    } catch (error) {
        console.error('Brat HD Error:', error)
        m.react('❌')
    }
}

export { pluginConfig as config, handler }
