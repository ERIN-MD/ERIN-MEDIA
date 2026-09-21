import { snackvideo } from 'btch-downloader'
import te from '../../src/lib/maro-error.js'
const pluginConfig = {
    name: 'سناب_فيديو',
    alias: ['snackvideo'],
    category: 'downloader',
    description: 'تحميل فيديو سناب فيديو',
    usage: '.سناب_فيديو <رابط>',
    example: '.سناب_فيديو https://www.snackvideo.com/@xxx/video/xxx',
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
            `⚠️ *طريقة الاستخدام*\n\n` +
            `> \`${m.prefix}سناب_فيديو <رابط>\`\n\n` +
            `> مثال:\n` +
            `> \`${m.prefix}سناب_فيديو https://www.snackvideo.com/@xxx/video/xxx\``
        )
    }
    
    if (!url.match(/snackvideo\.com/i)) {
        return m.reply(`❌ رابط غير صالح. استخدم رابط سناب فيديو.`)
    }
    
    await m.react('🕕')
    
    try {
        const data = await snackvideo(url)
        
        if (!data?.status || !data?.result?.videoUrl) {
            return m.reply(`❌ فشل جلب الفيديو. جرب رابطاً آخر.`)
        }
        
        const result = data.result
        
        await sock.sendMedia(m.chat, result.videoUrl, null, m, {
            type: 'video',
            contextInfo: {
                forwardingScore: 99,
                isForwarded: true
            }
        })
        
    } catch (err) {
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }