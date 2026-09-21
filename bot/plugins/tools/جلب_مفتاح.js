import axios from 'axios'

const pluginConfig = {
    name: 'جلب_مفتاح',
    alias: ['sitekey', 'turnstile', 'cfkey'],
    category: 'tools',
    description: 'استخراج Cloudflare Turnstile Sitekey من موقع',
    usage: '.جلب_مفتاح <رابط>',
    example: '.جلب_مفتاح https://example.com',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function extractSitekey(url) {
    try {
        const { data: html } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            timeout: 15000
        })

        const sitekeys = new Set()

        // البحث في HTML
        const scriptMatches = html.match(/0x[A-Za-z0-9_-]{20,}/g)
        if (scriptMatches) scriptMatches.forEach(k => sitekeys.add(k))

        // البحث في data-sitekey
        const attrMatches = html.match(/data-sitekey="([^"]+)"/g)
        if (attrMatches) {
            attrMatches.forEach(m => {
                const key = m.match(/"([^"]+)"/)?.[1]
                if (key?.startsWith('0x')) sitekeys.add(key)
            })
        }

        // استخراج روابط JS
        const jsFiles = [...new Set([
            ...(html.match(/src="([^"]+\.js[^"]*)"/g) || []).map(m => m.match(/"([^"]+)"/)?.[1]).filter(Boolean),
            ...(html.match(/href="([^"]+\.js[^"]*)"/g) || []).map(m => m.match(/"([^"]+)"/)?.[1]).filter(Boolean)
        ])].slice(0, 10)

        // فحص ملفات JS
        for (const jsPath of jsFiles) {
            try {
                const fullUrl = jsPath.startsWith('http') ? jsPath : new URL(jsPath, url).href
                const { data: jsContent } = await axios.get(fullUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    timeout: 5000
                })
                const matches = jsContent.match(/0x[A-Za-z0-9_-]{20,}/g)
                if (matches) matches.forEach(k => sitekeys.add(k))
            } catch {}
        }

        return [...sitekeys]
    } catch (e) {
        return []
    }
}

async function handler(m, { sock, text }) {
    if (!text) return m.reply(`🔑 *Turnstile Sitekey*\n\n> \`${m.prefix}جلب_مفتاح <رابط>\`\n\n> مثال:\n> \`${m.prefix}جلب_مفتاح https://example.com\``)

    const url = text.trim()
    if (!url.startsWith('http')) return m.reply('❌ رابط غير صالح')

    await m.react('🔍')

    const keys = await extractSitekey(url)

    if (keys.length === 0) {
        await m.react('❌')
        return m.reply('❌ لم يتم العثور على Sitekey')
    }

    let txt = `🔑 *Cloudflare Turnstile Sitekeys*\n\n`
    keys.forEach((key, i) => {
        txt += `${i + 1}. \`${key}\`\n`
    })

    await m.reply(txt)
    await m.react('✅')
}

export { pluginConfig as config, handler }