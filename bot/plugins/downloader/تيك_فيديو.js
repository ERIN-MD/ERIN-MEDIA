import axios from 'axios'
import * as cheerio from 'cheerio'
import crypto from 'crypto'
import { generateWAMessage, generateWAMessageFromContent, jidNormalizedUser } from 'maro'
import config from '../../config.js'
import te from '../../src/lib/maro-error.js'
import sharp from 'sharp'
import fs from 'fs'

const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    Origin: 'https://savett.cc',
    Referer: 'https://savett.cc/en1/download',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
}

async function getToken() {
    const res = await axios.get('https://savett.cc/en1/download')
    return {
        csrf: res.data.match(/name="csrf_token" value="([^"]+)"/)?.[1],
        cookie: res.headers['set-cookie'].map(v => v.split(';')[0]).join('; ')
    }
}

async function fetchTikTok(url, csrf, cookie) {
    const res = await axios.post(
        'https://savett.cc/en1/download',
        `csrf_token=${encodeURIComponent(csrf)}&url=${encodeURIComponent(url)}`,
        { headers: { ...headers, Cookie: cookie } }
    )
    return res.data
}

function parseResponse(html) {
    const $ = cheerio.load(html)

    const stats = []
    $('#video-info .my-1 span').each((_, el) => {
        stats.push($(el).text().trim())
    })

    const data = {
        username: $('#video-info h3').first().text().trim(),
        views: stats[0] || null,
        likes: stats[1] || null,
        bookmarks: stats[2] || null,
        comments: stats[3] || null,
        shares: stats[4] || null,
        duration: $('#video-info p.text-muted').first().text().replace(/Duration:/i, '').trim() || null,
        type: null,
        downloads: { nowm: [], wm: [] },
        mp3: [],
        slides: []
    }

    const slides = $('.carousel-item[data-data]')

    if (slides.length) {
        data.type = 'photo'
        slides.each((_, el) => {
            try {
                const json = JSON.parse($(el).attr('data-data').replace(/&quot;/g, '"'))
                if (Array.isArray(json.URL)) {
                    json.URL.forEach(url => {
                        data.slides.push({ index: data.slides.length + 1, url })
                    })
                }
            } catch {}
        })
        return data
    }

    data.type = 'video'

    $('#formatselect option').each((_, el) => {
        const label = $(el).text().toLowerCase()
        const raw = $(el).attr('value')
        if (!raw) return

        try {
            const json = JSON.parse(raw.replace(/&quot;/g, '"'))
            if (!json.URL) return

            if (label.includes('mp4') && !label.includes('watermark')) {
                data.downloads.nowm.push(...json.URL)
            }
            if (label.includes('watermark')) {
                data.downloads.wm.push(...json.URL)
            }
            if (label.includes('mp3')) {
                data.mp3.push(...json.URL)
            }
        } catch {}
    })

    return data
}

async function savett(url) {
    const { csrf, cookie } = await getToken()
    const html = await fetchTikTok(url, csrf, cookie)
    return parseResponse(html)
}

const pluginConfig = {
    name: ['تيك_فيديو', 'tt2', 'ttmp4'],
    alias: ['tiktokdl2', 'ttdown2', 'تحميل_تيكتوك'],
    category: 'downloader',
    description: 'تحميل فيديو/صور تيكتوك بدون علامة مائية',
    usage: '.تيك_فيديو <رابط>',
    example: '.تيك_فيديو https://vt.tiktok.com/xxx',
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
            `╭┈┈⬡「 🎵 *تحميل تيكتوك* 」\n` +
            `┃ 📌 الاستخدام: \`${m.prefix}تيك_فيديو <رابط>\`\n` +
            `╰┈┈⬡\n\n` +
            `> مثال: ${m.prefix}تيك_فيديو https://vt.tiktok.com/xxx`
        )
    }

    if (!url.match(/tiktok\.com|vt\.tiktok/i)) {
        return m.reply('❌ رابط غير صالح. استخدم رابط تيكتوك.')
    }

    m.react('⏱️')

    try {
        const result = await savett(url)

        let botThumbnail = null
        try {
            const imgBuffer = fs.readFileSync(config.assets["maro"])
            botThumbnail = await sharp(imgBuffer).resize(300, 170).jpeg().toBuffer()
        } catch (e) {}

        const caption = 
`🎵 *تيكتوك*

👤 *الناشر:* ${result.username || '-'}
🔗 *الرابط:* ${url}
━━━━━━━━━━━━━━━━━━
👀 *المشاهدات:* ${result.views || '-'}
❤️ *الإعجابات:* ${result.likes || '-'}
💬 *التعليقات:* ${result.comments || '-'}
🔁 *المشاركات:* ${result.shares || '-'}
⏱️ *المدة:* ${result.duration || '-'}`

        if (result.type === 'video' && result.downloads.nowm.length > 0) {
            await sock.sendMessage(
                m.chat,
                {
                    video: { url: result.downloads.nowm[0] },
                    mimetype: 'video/mp4',
                    caption,
                    jpegThumbnail: botThumbnail
                },
                { quoted: m }
            )

            m.react('✅')
            return
        }

        if (result.type === 'photo' && result.slides.length > 0) {
            await m.reply(`📸 *جاري إرسال ${result.slides.length} صورة...*`)

            const mediaList = []
            for (let i = 0; i < result.slides.length; i++) {
                const imgUrl = result.slides[i].url
                if (!imgUrl) continue

                try {
                    const res = await axios.get(imgUrl, {
                        responseType: 'arraybuffer',
                        timeout: 30000
                    })
                    mediaList.push({
                        image: Buffer.from(res.data),
                        caption: i === 0 ? caption : ''
                    })
                } catch (e) {
                    console.error(`[تيك_فيديو] فشل تحميل الصورة ${i}:`, e.message)
                }
            }

            if (mediaList.length === 0) {
                throw new Error('فشل تحميل الصور')
            }

            const opener = generateWAMessageFromContent(
                m.chat,
                {
                    messageContextInfo: { messageSecret: crypto.randomBytes(32) },
                    albumMessage: {
                        expectedImageCount: mediaList.length,
                        expectedVideoCount: 0
                    }
                },
                {
                    userJid: jidNormalizedUser(sock.user.id),
                    quoted: m,
                    upload: sock.waUploadToServer
                }
            )

            await sock.relayMessage(opener.key.remoteJid, opener.message, {
                messageId: opener.key.id
            })

            for (const content of mediaList) {
                const msg = await generateWAMessage(
                    opener.key.remoteJid,
                    content,
                    { upload: sock.waUploadToServer }
                )

                msg.message.messageContextInfo = {
                    messageSecret: crypto.randomBytes(32),
                    messageAssociation: {
                        associationType: 1,
                        parentMessageKey: opener.key
                    }
                }

                await sock.relayMessage(msg.key.remoteJid, msg.message, {
                    messageId: msg.key.id
                })
            }

            m.react('✅')
            return
        }

        if (result.mp3.length > 0) {
            await m.reply(`🎵 *تنبيه*\n> لا يوجد فيديو، جاري إرسال الصوت فقط...`)
            await sock.sendMessage(
                m.chat,
                {
                    audio: { url: result.mp3[0] },
                    mimetype: 'audio/mpeg'
                },
                { quoted: m }
            )
            m.react('✅')
            return
        }

        throw new Error('لا يوجد وسائط للتحميل')

    } catch (err) {
        console.error('[تيك_فيديو] خطأ:', err)
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }