import axios from 'axios'
import config from '../../config.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'انمي_برات',
    alias: ['animebrat'],
    category: 'sticker',
    description: 'صنع ستيكر Brat Anime',
    usage: '.انمي_برات <نص>',
    example: '.انمي_برات مرحبا',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.args.join(' ')
    if (!text) {
        return m.reply(`🖼️ *انمي_برات*\n\n📌 مثال: \`${m.prefix}انمي_برات مرحبا\``)
    }
    
    m.react('🕕')
    
    try {
        const url = `https://api.nexray.web.id/maker/bratanime?text=${encodeURIComponent(text)}`
        await sock.sendImageAsSticker(m.chat, url, m, {
            packname: config.sticker.packname,
            author: config.sticker.author
        })
        m.react('✅')
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }