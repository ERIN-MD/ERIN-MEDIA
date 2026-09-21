import likee from '../../src/scraper/likee.js'
import te from '../../src/lib/maro-error.js'
const pluginConfig = {
    name: 'لايكي',
    alias: ['likee'],
    category: 'downloader',
    description: 'تحميل فيديو لايكي',
    usage: '.لايكي <رابط>',
    example: '.لايكي https://likee.video/@xxx',
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
            `> \`${m.prefix}لايكي <رابط>\`\n\n` +
            `> مثال:\n` +
            `> \`${m.prefix}لايكي https://likee.video/@xxx\``
        )
    }
    
    if (!url.match(/likee\.(video|com)/i)) {
        return m.reply(`❌ رابط غير صالح. استخدم رابط لايكي.`)
    }
    
    await m.react('🕕')
    
    try {
        const data = await likee(url)
        
        if (!data) {
            return m.reply(`❌ فشل جلب الفيديو. جرب رابطاً آخر.`)
        }
        
        const videoUrl = data.without_watermark || data.with_watermark
        
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
        
        await m.react('✅')
        
    } catch (err) {
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }