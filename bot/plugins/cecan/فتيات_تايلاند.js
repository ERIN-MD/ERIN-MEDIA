// فتيات_تايلاند - أمر للحصول على صورة عشوائية لفتيات جميلات من تايلاند

import axios from 'axios'
import config from '../../config.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'فتيات_تايلاند',
    alias: ['cecanthai'],
    category: 'cecan',
    description: 'صورة عشوائية لفتيات جميلات من تايلاند',
    usage: '.فتيات_تايلاند',
    example: '.فتيات_تايلاند',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const api = 'https://api.nexray.web.id/random/cecan/thailand'
    await m.react('🇹🇭')
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