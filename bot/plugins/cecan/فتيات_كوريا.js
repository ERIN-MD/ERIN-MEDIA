// فتيات_كوريا - أمر للحصول على صورة عشوائية لفتيات جميلات من كوريا

import axios from 'axios'
import config from '../../config.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'فتيات_كوريا',
    alias: ['cecankorea'],
    category: 'cecan',
    description: 'صورة عشوائية لفتيات جميلات من كوريا',
    usage: '.فتيات_كوريا',
    example: '.فتيات_كوريا',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const api = 'https://api.nexray.web.id/random/cecan/korea'
    await m.react('🇰🇷')
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