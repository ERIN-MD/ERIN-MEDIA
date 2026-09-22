// فتيات_اليابان - أمر للحصول على صورة عشوائية لفتيات جميلات من اليابان

import axios from 'axios'
import config from '../../config.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'فتيات_اليابان',
    alias: ['cecanjepang'],
    category: 'cecan',
    description: 'صورة عشوائية لفتيات جميلات من اليابان',
    usage: '.فتيات_اليابان',
    example: '.فتيات_اليابان',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const api = 'https://api.nexray.web.id/random/cecan/japan'
    await m.react('🇯🇵')
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