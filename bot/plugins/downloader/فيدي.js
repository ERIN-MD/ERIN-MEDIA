import axios from 'axios'
import config from '../../config.js'
import { f } from '../../src/lib/maro-http.js'
import te from '../../src/lib/maro-error.js'
const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-MaroMD'

const pluginConfig = {
    name: 'فيدي',
    alias: ['videy'],
    category: 'downloader',
    description: 'تحميل فيديو من videy.co',
    usage: '.فيدي <رابط>',
    example: '.فيدي https://videy.co/v?id=7ZH1ZRIF',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const url = m.text?.trim()
    
    if (!url) {
        return m.reply(
            `🎬 *محمل فيدي*\n\n` +
            `> أدخل رابط videy.co\n\n` +
            `\`مثال: ${m.prefix}فيدي https://videy.co/v?id=7ZH1ZRIF\``
        )
    }
    
    if (!url.match(/videy\.co/i)) {
        return m.reply(`❌ رابط غير صالح. استخدم رابط من videy.co`)
    }
    
    m.react('🕕')
    
    try {
        const data = await f(`https://api.neoxr.eu/api/videy?url=${encodeURIComponent(url)}&apikey=${NEOXR_APIKEY}`)
        
        if (!data?.status || !data?.data?.url) {
            m.react('❌')
            return m.reply(`❌ فشل جلب الفيديو. الرابط غير صالح أو منتهي الصلاحية.`)
        }
        
        const videoUrl = data.data.url
        
        await sock.sendMedia(m.chat, videoUrl, null, m, {
            type: 'video',
            contextInfo: {
                forwardingScore: 99,
                isForwarded: true
            }
        })
        
        m.react('✅')
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }