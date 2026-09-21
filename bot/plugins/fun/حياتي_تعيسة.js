import axios from 'axios'
import config from '../../config.js'
import { f } from '../../src/lib/maro-http.js'
import te from '../../src/lib/maro-error.js'
const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-MaroMD'

const pluginConfig = {
    name: 'حياتي_تعيسة',
    alias: ['fml'],
    category: 'fun',
    description: 'قصة عشوائية عن التعاسة في الحياة',
    usage: '.حياتي_تعيسة',
    example: '.حياتي_تعيسة',
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
        const data = await f(`https://api.neoxr.eu/api/fml?apikey=${NEOXR_APIKEY}`)
        
        if (!data?.status || !data?.data?.text) {
            m.react('❌')
            return m.reply(`❌ فشل جلب قصة التعاسة`)
        }    
        await m.reply(data.data.text)
        m.react('✅')
        
    } catch (err) {
        m.react('☢')
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }