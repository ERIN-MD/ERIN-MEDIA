import axios from 'axios'
import { generateWAMessageFromContent } from 'maro'

const pluginConfig = {
    name: 'تحميل',
    alias: ['dl', 'حمل', 'تنزيل'],
    category: 'downloader',
    description: 'تحميل من انستا تيك توك فيسبوك تويتر سناب شات + ستوري انستا',
    usage: '.تحميل <رابط>',
    example: '.تحميل https://www.instagram.com/reel/xxx/',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 2,
    isEnabled: true
}

const API_BASE = 'https://engez.a7a.online/api/v1/download/all'
const SELECT_SEPARATOR = '|'

function isYouTubeUrl(url) {
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|m\.youtube\.com)\//i.test(url)
}

async function fetchMediaData(url) {
    const apiUrl = `${API_BASE}?url=${encodeURIComponent(url)}`
    const { data } = await axios.get(apiUrl, { timeout: 30000 })

    if (!data || data.success !== true) {
        throw new Error('لم يتم العثور على نتائج لهذا الرابط')
    }

    const medias = data?.response?.medias
    if (!Array.isArray(medias) || medias.length === 0) {
        throw new Error('لا توجد ميديا متاحة لهذا الرابط')
    }

    return {
        title: data.response.title || 'بدون عنوان',
        source: data.response.source || 'غير معروف',
        medias,
    }
}

async function sendSingleMedia(sock, chat, media, title, quoted) {
    const isVideo = media.type === 'video'

    try {
        const fileResponse = await axios.get(media.url, {
            responseType: 'arraybuffer',
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36'
            }
        })

        const buffer = Buffer.from(fileResponse.data)

        if (isVideo) {
            await sock.sendMessage(chat, {
                video: buffer,
                caption: `📝 *${title}*\n🎬 *الجودة:* ${media.quality || 'غير معروف'}`
            }, { quoted })
        } else {
            await sock.sendMessage(chat, {
                audio: buffer,
                mimetype: 'audio/mpeg'
            }, { quoted })
            await sock.sendMessage(chat, {
                text: `📝 *${title}*\n🎵 *الجودة:* ${media.quality || 'غير معروف'}`
            }, { quoted })
        }
    } catch (e) {
        await sock.sendMessage(chat, {
            text: `❌ فشل تحميل الملف: ${e.message}`
        }, { quoted })
    }
}

async function handler(m, { sock, text }) {
    if (!text) return m.reply(`📥 *Multi Downloader*\n\n> \`${m.prefix}تحميل <رابط>\`\n\n> 📌 مثال:\n> \`${m.prefix}تحميل https://www.instagram.com/reel/xxx/\``)

    const url = text.trim()

    if (isYouTubeUrl(url)) {
        return m.reply('❌ روابط يوتيوب غير مدعومة.')
    }

    await m.react('⏳')

    try {
        const { title, source, medias } = await fetchMediaData(url)

        // إذا فيديو واحد فقط - حمله مباشرة
        if (medias.length === 1) {
            await sendSingleMedia(sock, m.chat, medias[0], title, m)
            await m.react('✅')
            return
        }

        // إذا أكثر من جودة - اعرض قائمة
        const rows = medias.map((media, i) => {
            const isVideo = media.type === 'video'
            const icon = isVideo ? '🎬' : '🎵'
            const typeLabel = isVideo ? 'فيديو' : 'صوت'
            return {
                title: `${icon} ${media.quality || 'غير معروف'}`,
                description: `تحميل ${typeLabel} بجودة ${media.quality}`,
                id: `${m.prefix}تحميل ${url}${SELECT_SEPARATOR}${i}`
            }
        })

        const content = {
            buttonsMessage: {
                contentText: `*🔎 اختر الجودة:*\n\n📝 *العنوان:* ${title}\n📡 *المصدر:* ${source}`,
                footerText: 'اختر من القائمة للتحميل',
                buttons: [{
                    buttonId: 'menu',
                    buttonText: { displayText: '📋 الجودات' },
                    type: 1,
                    nativeFlowInfo: {
                        name: 'single_select',
                        paramsJson: JSON.stringify({
                            title: 'اختر الجودة',
                            sections: [{ title: '📥 جودات متاحة', rows }]
                        })
                    }
                }],
                headerType: 1
            }
        }

        const msg = generateWAMessageFromContent(m.chat, content, { userJid: sock.user.jid })
        await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
        await m.react('✅')

    } catch (e) {
        await m.react('❌')
        return m.reply(`❌ ${e.message}`)
    }
}

export { pluginConfig as config, handler }