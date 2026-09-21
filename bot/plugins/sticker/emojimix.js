import config from '../../config.js'
import { f } from './../../src/lib/maro-http.js'
const pluginConfig = {
    name: 'emojimix',
    alias: ['mixemoji', 'emix'],
    category: 'sticker',
    description: 'Gabungkan 2 emoji menjadi 1',
    usage: '.emojimix <emoji1><emoji2>',
    example: '.emojimix 😂🔥',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.text?.trim()
    
    if (!text) {
        return m.reply(
            `🎭 *ᴇᴍᴏᴊɪ ᴍɪx*\n\n` +
            `> Gabungkan 2 emoji menjadi 1\n\n` +
            `> Contoh: \`${m.prefix}emojimix 😂🔥\``
        )
    }
    
    const emojiRegex = /\p{Extended_Pictographic}/gu
    const emojis = text.match(emojiRegex)
    
    if (!emojis || emojis.length < 2) {
        return m.reply(`❌ Masukkan minimal 2 emoji!\n\nContoh: ${m.prefix}emojimix 😂🔥`)
    }
    
    const emoji1 = emojis[0]
    const emoji2 = emojis[1]
    
    m.react('🕕')
    
    try {
        const apiKey = process.env.EMOJI_KITCHEN_API_KEY
        if (!apiKey) throw new Error('EMOJI_KITCHEN_API_KEY غير مضبوط.')
        const apiUrl = `https://tenor.googleapis.com/v2/featured?key=${encodeURIComponent(apiKey)}&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`
        
        const data = await f(apiUrl)
        
        if (!data.results || data.results.length === 0) {
            return m.reply(`❌ Kombinasi emoji tidak ditemukan!\n\nCoba emoji lain.`)
        }
        
        const imageUrl = data.results[0].url
        
        await sock.sendImageAsSticker(m.chat, imageUrl, m, {
            packname: config.sticker.packname,
            author: config.sticker.author
        })
        
        m.react('✅')
        
    } catch (err) {
        console.error('EmojiMix Error:', err.message)
        m.react('❌')
    }
}

export { pluginConfig as config, handler }
