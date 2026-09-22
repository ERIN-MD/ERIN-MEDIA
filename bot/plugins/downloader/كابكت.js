import axios from 'axios'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'كابكت',
    alias: ['capcut', 'cc'],
    category: 'downloader',
    description: 'تحميل فيديو كاب كت',
    usage: '.كابكت <رابط>',
    example: '.كابكت https://www.capcut.com/t/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function capcutDL(url) {
    try {
        const { data } = await axios.get('https://api.siputzx.my.id/api/d/capcut', {
            params: { url },
            timeout: 30000
        })
        
        if (data?.status && data?.data?.originalVideoUrl) {
            return {
                status: true,
                originalVideoUrl: data.data.originalVideoUrl,
                title: data.data.title || '',
                coverUrl: data.data.coverUrl || '',
                authorName: data.data.authorName || ''
            }
        }
        return { status: false }
    } catch {
        return { status: false }
    }
}

async function handler(m, { sock }) {
    const url = m.text?.trim()

    if (!url) {
        return m.reply(
            `⚠️ *طريقة الاستخدام*\n\n` +
            `> \`${m.prefix}كابكت <رابط>\`\n\n` +
            `> مثال:\n` +
            `> \`${m.prefix}كابكت https://www.capcut.com/t/xxx\``
        )
    }

    if (!url.match(/capcut\.com/i)) {
        return m.reply(`❌ رابط غير صالح. استخدم رابط كاب كت.`)
    }

    await m.react('🕕')

    try {
        const data = await capcutDL(url)

        if (!data?.status || !data?.originalVideoUrl) {
            return m.reply(`❌ فشل جلب الفيديو. جرب رابطاً آخر.`)
        }

        await sock.sendMedia(m.chat, data.originalVideoUrl, data.title || null, m, {
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