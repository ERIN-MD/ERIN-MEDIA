// ═══════════════════════════════════════════════
// 📁 plugins/download/مانهوا.js
// 📚 شينيجامي - بحث وقراءة المانهوا
// ═══════════════════════════════════════════════

import ShinigamiClass from '../../src/scraper/shinigami.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'مانهوا',
    alias: ['manhwa', 'مانجا', 'manga', 'shinigami'],
    category: 'downloader',
    description: 'بحث وقراءة المانهوا والمانجا',
    usage: '.مانهوا <بحث> | .مانهوا اقرأ <id> | .مانهوا فصول <id>',
    example: '.مانهوا solo leveling\n.مانهوا فصول 14af3339\n.مانهوا اقرأ 267eb08a',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 3,
    isEnabled: true
}

const api = new ShinigamiClass()

async function handler(m, { sock, args, text }) {
    const cmd = args[0]?.toLowerCase()

    // .مانهوا اقرأ <chapterId>
    if (cmd === 'اقرأ' || cmd === 'read') {
        const chapterId = args[1]
        if (!chapterId) return m.reply('❌ *اكتب ID الفصل*\n💡 .مانهوا اقرأ 267eb08a')

        m.react('⏳')

        try {
            const { data } = await api.getChapterDetail(chapterId)
            if (!data?.chapter?.data) {
                m.react('❌')
                return m.reply('❌ *الفصل غير موجود*')
            }

            const images = data.chapter.data.map(img => ({
                image: { url: `https://assets.shngm.id/chapter/${chapterId}/${img}` }
            }))

            if (images.length === 0) {
                m.react('❌')
                return m.reply('❌ *لا توجد صور*')
            }

            m.react('✅')
            await sock.sendMessage(m.chat, {
                albumMessage: images.slice(0, 10),
                caption: `📖 *${data.chapter.chapter_number || 'فصل'}*\n📄 ${images.length} صورة`
            }, { quoted: m })

            // لو فيه صور زيادة، نبعت الباقي
            if (images.length > 10) {
                for (let i = 10; i < images.length; i += 10) {
                    await sock.sendMessage(m.chat, {
                        albumMessage: images.slice(i, i + 10)
                    }, { quoted: m })
                }
            }

        } catch (e) {
            m.react('❌')
            m.reply(te(m.prefix, m.command, m.pushName))
        }
        return
    }

    // .مانهوا فصول <mangaId>
    if (cmd === 'فصول' || cmd === 'chapters') {
        const mangaId = args[1]
        if (!mangaId) return m.reply('❌ *اكتب ID المانجا*\n💡 .مانهوا فصول 14af3339')

        m.react('⏳')

        try {
            const { data } = await api.getChapterList(mangaId)
            if (!data || data.length === 0) {
                m.react('❌')
                return m.reply('❌ *لا توجد فصول*')
            }

            let reply = `📚 *قائمة الفصول*\n\n`
            data.slice(0, 20).forEach((ch, i) => {
                reply += `📖 *${ch.chapter_number}*\n🆔 \`.مانهوا اقرأ ${ch.chapter_id}\`\n📅 ${ch.release_date?.split('T')[0] || ''}\n\n`
            })

            if (data.length > 20) reply += `_... و ${data.length - 20} فصل آخر_`

            m.react('✅')
            await m.reply(reply)

        } catch (e) {
            m.react('❌')
            m.reply(te(m.prefix, m.command, m.pushName))
        }
        return
    }

    // .مانهوا <بحث>
    if (!text) {
        return m.reply(`📚 *مانهوا*\n\n📝 .مانهوا <بحث>\n📋 .مانهوا فصول <id>\n📖 .مانهوا اقرأ <id>\n\n💡 .مانهوا solo leveling`)
    }

    m.react('⏳')

    try {
        const { data } = await api.search({ q: text, page_size: 10 })
        if (!data || data.length === 0) {
            m.react('❌')
            return m.reply('❌ *لا توجد نتائج*')
        }

        let reply = `📚 *نتائج البحث:* ${text}\n\n`
        data.forEach((manga, i) => {
            reply += `*${i + 1}.* ${manga.title}\n`
            reply += `⭐ ${manga.user_rate || '?'} | 👁️ ${manga.view_count || 0}\n`
            reply += `📖 الفصل ${manga.latest_chapter_number || '?'}\n`
            reply += `🆔 \`.مانهوا فصول ${manga.manga_id}\`\n\n`
        })

        m.react('✅')
        await m.reply(reply)

    } catch (e) {
        m.react('❌')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }