import { cocofun } from 'btch-downloader'
import te from '../../src/lib/maro-error.js'
const pluginConfig = {
    name: 'كوكوفن',
    alias: ['cocofun'],
    category: 'downloader',
    description: 'تحميل فيديو كوكو فن',
    usage: '.كوكوفن <رابط>',
    example: '.كوكوفن https://www.cocofun.com/share/post/xxx',
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
            `> \`${m.prefix}كوكوفن <رابط>\`\n\n` +
            `> مثال:\n` +
            `> \`${m.prefix}كوكوفن https://www.cocofun.com/share/post/xxx\``
        )
    }
    
    if (!url.match(/cocofun\.com/i)) {
        return m.reply(`❌ رابط غير صالح. استخدم رابط كوكو فن.`)
    }
    
    await m.react('🕕')
    
    try {
        const data = await cocofun(url)
        
        if (!data?.status || !data?.result) {
            return m.reply(`❌ فشل جلب الفيديو. جرب رابطاً آخر.`)
        }
        
        const result = data.result
        const videoUrl = result.no_watermark || result.watermark
        
        if (!videoUrl) {
            return m.reply(`❌ الفيديو غير موجود.`)
        }
        
        await sock.sendMedia(m.chat, videoUrl, null, m, {
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