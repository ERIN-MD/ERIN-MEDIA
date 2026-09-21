import config from '../../config.js'
import { f } from '../../src/lib/maro-http.js'
import te from '../../src/lib/maro-error.js'
const pluginConfig = {
    name: 'سفايل',
    alias: ['sfile'],
    category: 'downloader',
    description: 'تحميل ملف من Sfile.mobi',
    usage: '.سفايل <رابط>',
    example: '.سفايل https://sfile.mobi/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const url = m.text?.trim()

    if (!url) {
        return m.reply(
            `⚠️ *طريقة الاستخدام*\n\n` +
            `> \`${m.prefix}سفايل <رابط>\`\n\n` +
            `> مثال: \`${m.prefix}سفايل https://sfile.mobi/xxxxx\``
        )
    }

    if (!url.includes('sfile.mobi') && !url.includes('sfile.co')) {
        return m.reply(`❌ الرابط يجب أن يكون من sfile.mobi أو sfile.co!`)
    }

    m.react('🕕')

    try {
        const { data } = await f(`https://api.neoxr.eu/api/sfile?url=${encodeURIComponent(url)}&apikey=${config.APIkey.neoxr}`)

        if (!data.url) {
            m.react('❌')
            return m.reply(`❌ فشل الحصول على رابط التحميل. قد لا يكون الملف متاحاً.`)
        }

        await sock.sendMedia(m.chat, data.url, null, m, {
            type: 'document',
            fileName: data.filename,
            mimetype: data.mime,
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