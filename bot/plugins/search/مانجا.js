import axios from 'axios'
import config from '../../config.js'
import te from '../../src/lib/maro-error.js'

const CUKI_APIKEY = config.APIkey?.cuki || 'cuki-x'

// ═══════════════════════════════════════════════
// 🛠️ دوال مساعدة
// ═══════════════════════════════════════════════
function trimText(text, max = 60) {
    const value = (text || '').replace(/\s+/g, ' ').trim()
    if (!value) return '-'
    if (value.length <= max) return value
    return value.slice(0, max) + '...'
}

async function fetchMangatoon(query) {
    const { data } = await axios.get(`https://api.cuki.biz.id/api/search/mangatoon?apikey=${encodeURIComponent(CUKI_APIKEY)}&query=${encodeURIComponent(query)}`, {
        timeout: 30000,
        headers: { 'user-agent': 'Mozilla/5.0' }
    })

    if (!data?.status || !data?.data?.results) {
        throw new Error(data?.message || 'لم يتم العثور على نتائج')
    }

    return data.data
}

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: 'مانجا',
    alias: ['mangatoon'],
    category: 'search',
    description: 'بحث عن مانجا في Mangatoon',
    usage: '.مانجا <بحث>',
    example: '.مانجا love',
    isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
    cooldown: 8, energi: 1, isEnabled: true
}

// ═══════════════════════════════════════════════
// 📚 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
    const query = m.text?.trim()

    if (!query) {
        return m.reply(`📚 *مانجا*\n\n📌 مثال: \`${m.prefix}مانجا love\``)
    }

    m.react('🔍')

    try {
        const result = await fetchMangatoon(query)
        const komikGroups = Array.isArray(result.results?.komik) ? result.results.komik : []
        const items = komikGroups.flatMap((entry) => Array.isArray(entry?.items) ? entry.items : []).slice(0, 10)

        if (items.length === 0) {
            m.react('❌')
            return m.reply(`❌ لم يتم العثور على: ${query}`)
        }

        let caption = '📚 *مانجا*\n\n'
        caption += `🔎 *البحث:* ${result.query || query}\n`
        caption += `📦 *المجموع:* ${result.total || items.length}\n\n`

        items.forEach((item, index) => {
            caption += `*${index + 1}.* ${trimText(item.title)}\n`
            caption += `   ├ ${item.link}\n\n`
        })

        const cover = items[0]?.image
        if (cover) {
            await sock.sendMedia(m.chat, cover, caption.trim(), m, { type: 'image' })
        } else {
            await m.reply(caption.trim())
        }

        m.react('✅')
    } catch (error) {
        console.log(error)
        m.react('❌')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }