// أرشيف_أزرق - أمر للحصول على صورة عشوائية من لعبة Blue Archive

import axios from 'axios'
import config from '../../config.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'أرشيف_أزرق',
    alias: ['barandom'],
    category: 'random',
    description: 'صورة عشوائية من لعبة Blue Archive',
    usage: '.أرشيف_أزرق',
    example: '.أرشيف_أزرق',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const api = 'https://api.nexray.web.id/random/ba'
    await m.react('🕕')
    try {
        await sock.sendMedia(m.chat, api, null, m, {
            type: 'image'
        })
        
        await m.react('✅')
    } catch (e) {
        await m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }