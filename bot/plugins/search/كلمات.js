import axios from 'axios'
import te from '../../src/lib/maro-error.js'

// ═══════════════════════════════════════════════
// 🛠️ جلب الكلمات
// ═══════════════════════════════════════════════
async function fetchLyrics(judul) {
  try {
    const res = await axios.get(`https://api.nexray.eu.cc/search/lyrics?q=${encodeURIComponent(judul)}`)
    if (res.data && res.data.status && res.data.result) return res.data.result
    return null
  } catch { return null }
}

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: 'كلمات',
    alias: ['lyric'],
    category: 'search',
    description: 'بحث عن كلمات الأغاني',
    usage: '.كلمات <اسم الأغنية>',
    example: '.كلمات sempurna',
    isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
    cooldown: 10, energi: 1, isEnabled: true
}

// ═══════════════════════════════════════════════
// 🎵 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
    const query = m.text?.trim()
    
    if (!query) {
        return m.reply(`🎵 *كلمات*\n\n❌ اكتب اسم الأغنية\n\n📌 مثال: \`${m.prefix}كلمات sempurna\``)
    }
    
    m.react('🔍')
    
    try {
        const data = await fetchLyrics(query)
        
        if (!data || !data.lyrics || !data.lyrics.plain_lyrics) {
            m.react('❌')
            return m.reply(`❌ لم يتم العثور على كلمات: *${query}*`)
        }
        
        const title = data.title || query
        const artist = data.artist || data.lyrics.artist_name || 'غير معروف'
        const lyricsText = data.lyrics.plain_lyrics
        
        const texts = `🎵 *${title}*\n🎤 *${artist}*\n\n${lyricsText}\n\n🎧 استمتع!`
                      
        if (data.thumbnail && data.thumbnail !== '-') {
            await sock.sendMessage(m.chat, {
                image: { url: data.thumbnail },
                caption: texts
            }, { quoted: m })
        } else {
            await m.reply(texts)
        }
        
        m.react('✅')
        
    } catch (error) {
        m.react('❌')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }