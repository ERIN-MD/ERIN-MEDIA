// ميم - أمر للحصول على ميم عشوائي من إندونيسيا

import axios from 'axios'
import config from '../../config.js'
import { f } from '../../src/lib/maro-http.js'
import te from '../../src/lib/maro-error.js'

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-MaroMD'

const pluginConfig = {
    name: 'ميم',
    alias: ['meme'],
    category: 'random',
    description: 'ميم عشوائي من إندونيسيا',
    usage: '.ميم',
    example: '.ميم',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    m.react('🕕') 
    try {
        const { data } = await f(`https://api.neoxr.eu/api/meme?apikey=${NEOXR_APIKEY}`)
        await sock.sendMedia(m.chat, data.url, data.title, m, {
            type: 'image'
        })
        m.react('✅')
    } catch (err) {
        m.react('☢')
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }