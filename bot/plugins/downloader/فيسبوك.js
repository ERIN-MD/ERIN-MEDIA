import { fbdown } from 'btch-downloader'
import te from '../../src/lib/maro-error.js'
const pluginConfig = {
    name: 'فيسبوك',
    alias: ['facebook', 'fb'],
    category: 'downloader',
    description: 'تحميل فيديو فيسبوك',
    usage: '.فيسبوك <رابط>',
    example: '.فيسبوك https://www.facebook.com/watch?v=xxx',
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
            `> \`${m.prefix}فيسبوك <رابط>\`\n\n` +
            `> مثال:\n` +
            `> \`${m.prefix}فيسبوك https://www.facebook.com/watch?v=xxx\``
        )
    }
    
    if (!url.match(/facebook\.com|fb\.watch/i)) {
        return m.reply(`❌ رابط غير صالح. استخدم رابط فيسبوك.`)
    }
    
    await m.react('🕕')
    
    try {
        const data = await fbdown(url)
        
        if (!data?.status) {
            return m.reply(`❌ فشل جلب الفيديو. جرب رابطاً آخر.`)
        }
        
        const videoUrl = data.HD || data.Normal_video
        
        if (!videoUrl) {
            return m.reply(`❌ الفيديو غير موجود.`)
        }
        
        const quality = data.HD ? 'HD' : 'SD'
        
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