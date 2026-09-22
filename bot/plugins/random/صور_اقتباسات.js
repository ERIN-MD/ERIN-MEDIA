// صور_اقتباسات - أمر للحصول على صور اقتباسات عشوائية

import axios from 'axios'
import config from '../../config.js'
import { f } from '../../src/lib/maro-http.js'
import te from '../../src/lib/maro-error.js'

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-MaroMD'

const pluginConfig = {
    name: 'صور_اقتباسات',
    alias: ['quotesimage'],
    category: 'random',
    description: 'صور اقتباسات عشوائية',
    usage: '.صور_اقتباسات',
    example: '.صور_اقتباسات',
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
        const res = await f(`https://api.neoxr.eu/api/quotesimage?apikey=${NEOXR_APIKEY}`)
        
        if (!res.status || !res.data?.url) {
            m.react('❌')
            return m.reply(`❌ فشل الحصول على صورة الاقتباس`)
        }
        
        await sock.sendMedia(m.chat, res.data.url, null, m, {
            type: 'image'
        })
        
        m.react('✅')
        
    } catch (err) {
        m.react('☢')
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }