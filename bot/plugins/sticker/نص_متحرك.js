import { addExifToWebp } from '../../src/lib/maro-exif.js'
import axios from 'axios'
import config from '../../config.js'
import { f } from '../../src/lib/maro-http.js'
import te from '../../src/lib/maro-error.js'

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-MaroMD'

const pluginConfig = {
    name: 'نص_متحرك',
    alias: ['attp', 'attp2', 'attp3'],
    category: 'sticker',
    description: 'صنع ستيكر نص متحرك',
    usage: '.نص_متحرك <نص>',
    example: '.نص_متحرك مرحبا',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

function getRandomColor() {
    const colors = ['FF5733', 'C70039', '900C3F', '581845', '2E86AB', 'A23B72', 'F18F01', 'C73E1D', '3A0CA3', '7209B7', '4361EE', '4CC9F0']
    return colors[Math.floor(Math.random() * colors.length)]
}

async function handler(m, { sock }) {
    let text = m.text?.trim()
    if (!text && m.quoted?.text) {
        text = m.quoted.text.trim()
    }
    if (!text) {
        return m.reply(`🎨 *نص_متحرك*\n\n📌 مثال: \`${m.prefix}نص_متحرك مرحبا\``)
    }
    if (text.length > 100) {
        return m.reply(`❌ النص طويل جداً! أقصى حد 100 حرف.`)
    }
    m.react('🕕')
    try {
        const color = getRandomColor()
        const url = `https://api.neoxr.eu/api/attp3?text=${encodeURIComponent(text)}&color=${color}&apikey=${NEOXR_APIKEY}`
        const data = await f(url)
        if (!data?.status || !data?.data?.url) {
            throw new Error('API لا يرجع بيانات صالحة')
        }
        const stickerUrl = data.data.url
        const stickerRes = await f(stickerUrl, 'buffer')
        if (!stickerRes) throw new Error('فشل تحميل الستيكر')
        let finalSticker = stickerRes
        try {
            finalSticker = await addExifToWebp(stickerRes, {
                packname: config.sticker.packname,
                author: config.sticker.author
            })
        } catch (e) {}
        await sock.sendMessage(m.chat, { sticker: finalSticker }, { quoted: m })
        m.react('✅')
    } catch (err) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }