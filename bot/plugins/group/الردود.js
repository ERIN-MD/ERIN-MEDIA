import { getDatabase } from '../../src/lib/maro-database.js'
import fs from 'fs'
import path from 'path'
import axios from 'axios'

const AUTO_REPLY_PATH = path.join(process.cwd(), 'data', 'autoreply.json')

function loadAutoReplies() {
    try {
        const dataDir = path.join(process.cwd(), 'data')
        if (!fs.existsSync(dataDir)) { fs.mkdirSync(dataDir, { recursive: true }) }
        if (!fs.existsSync(AUTO_REPLY_PATH)) { fs.writeFileSync(AUTO_REPLY_PATH, JSON.stringify({}, null, 2)); return {} }
        const data = fs.readFileSync(AUTO_REPLY_PATH, 'utf8')
        const parsed = JSON.parse(data)
        const sanitized = {}
        for (const [key, value] of Object.entries(parsed)) { sanitized[key] = typeof value === 'string' ? value : String(value) }
        return sanitized
    } catch (e) { console.error('خطأ في تحميل الردود:', e); return {} }
}

function saveAutoReplies(replies) {
    try {
        const sanitized = {}
        for (const [key, value] of Object.entries(replies)) { sanitized[key] = typeof value === 'string' ? value : String(value) }
        fs.writeFileSync(AUTO_REPLY_PATH, JSON.stringify(sanitized, null, 2)); return true
    } catch (e) { console.error('خطأ في حفظ الردود:', e); return false }
}

async function downloadToBuffer(url) {
    try {
        const response = await axios({ method: 'GET', url, responseType: 'arraybuffer', timeout: 30000, headers: { 'User-Agent': 'Mozilla/5.0' } })
        return Buffer.from(response.data)
    } catch (error) { console.error('خطأ في التحميل:', error.message); return null }
}

function getFileTypeFromUrl(url) {
    const ext = path.extname(url).toLowerCase()
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) return 'image'
    if (['.mp4', '.webm', '.mkv'].includes(ext)) return 'video'
    if (['.mp3', '.m4a', '.ogg', '.wav', '.opus'].includes(ext)) return 'audio'
    return null
}

function parseReplyContent(content) {
    const contentStr = typeof content === 'string' ? content : String(content)
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const urls = contentStr.match(urlRegex) || []
    let text = contentStr.replace(urlRegex, '').trim()
    if (text === '') text = null
    const images = [], videos = [], audios = []
    for (const url of urls) {
        const type = getFileTypeFromUrl(url)
        if (type === 'image') images.push(url)
        else if (type === 'video') videos.push(url)
        else if (type === 'audio') audios.push(url)
    }
    return { text, images, videos, audios }
}

async function sendReply(sock, chatId, replyData, m) {
    const { text, images, videos, audios } = replyData
    if (text) { await m.reply(`🤖 ${text}`) }
    for (const imgUrl of images) {
        try {
            const buffer = await downloadToBuffer(imgUrl)
            if (buffer) { await sock.sendMessage(chatId, { image: buffer, caption: `🤖 رد تلقائي` }, { quoted: m }) }
        } catch(e) { console.error('خطأ في إرسال الصورة:', e.message) }
    }
    for (const vidUrl of videos) {
        try {
            const buffer = await downloadToBuffer(vidUrl)
            if (buffer) { await sock.sendMessage(chatId, { video: buffer, caption: `🤖 رد تلقائي`, gifPlayback: false }, { quoted: m }) }
        } catch(e) { console.error('خطأ في إرسال الفيديو:', e.message) }
    }
    for (const audioUrl of audios) {
        try {
            const buffer = await downloadToBuffer(audioUrl)
            if (buffer && buffer.length > 1000) { await sock.sendMessage(chatId, { audio: buffer, mimetype: 'audio/mpeg', ptt: false }, { quoted: m }) }
        } catch(e) { console.error('خطأ في إرسال الصوت:', e.message) }
    }
}

const pluginConfig = {
    name: 'الردود',
    alias: ['autoreply'],
    category: 'group',
    description: '⚙️ إدارة الردود التلقائية العامة',
    usage: '.الردود <اضافة/حذف/قائمة/مسح>',
    example: '.الردود اضافة مرحبا|أهلاً وسهلاً',
    isOwner: true,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const args = m.args || []
    const fullArg = args.join(' ')
    
    let separator = '|'
    if (fullArg.includes('/')) separator = '/'
    else if (fullArg.includes('|')) separator = '|'
    
    const separatorIndex = fullArg.indexOf(separator)
    let action, keywordsPart, replyContent
    
    if (separatorIndex !== -1) {
        const before = fullArg.substring(0, separatorIndex).trim()
        replyContent = fullArg.substring(separatorIndex + 1).trim()
        const parts = before.split(/\s+/)
        action = parts[0]?.toLowerCase()
        keywordsPart = parts.slice(1).join(' ').toLowerCase()
    } else {
        action = args[0]?.toLowerCase()
        keywordsPart = args.slice(1).join(' ').toLowerCase()
        replyContent = null
    }

    const autoReplies = loadAutoReplies()

    if (!action) {
        const repliesList = Object.entries(autoReplies)
        if (repliesList.length === 0) {
            return m.reply(`📭 *لا توجد ردود تلقائية*\n\n📝 *لإضافة رد:*\n.الردود اضافة الكلمة | الرد\n.الردود اضافة فوق|تحت|على / الرد`)
        }
        let message = `📝 *قائمة الردود العامة*\n━━━━━━━━━━━━━━━━━━\n`
        for (const [key, value] of repliesList) {
            const valueStr = typeof value === 'string' ? value : String(value)
            const hasMedia = valueStr.match(/https?:\/\/[^\s]+/)
            const typeIcon = hasMedia ? '📎' : '💬'
            const preview = hasMedia ? 'ملف' : valueStr.substring(0, 30) + (valueStr.length > 30 ? '...' : '')
            const keywords = key.split('|').map(k => k.trim()).join(' | ')
            message += `${typeIcon} *${keywords}* → ${preview}\n`
        }
        message += `━━━━━━━━━━━━━━━━━━\n📊 *إجمالي الردود:* ${repliesList.length}`
        return m.reply(message)
    }

    if (action === 'اضافة' && keywordsPart && replyContent) {
        const keywords = keywordsPart.split(/[|\/]/).map(k => k.trim()).filter(k => k)
        if (keywords.length === 0) { return m.reply("❌ *يرجى تحديد كلمة واحدة على الأقل*") }
        for (const keyword of keywords) { autoReplies[keyword] = replyContent }
        if (saveAutoReplies(autoReplies)) {
            const replyStr = typeof replyContent === 'string' ? replyContent : String(replyContent)
            const hasMedia = replyStr.match(/https?:\/\/[^\s]+/)
            const typeText = hasMedia ? 'رد متعدد (نص + ملفات)' : 'رد نصي'
            const keywordsDisplay = keywords.join(' | ')
            await m.reply(`✅ *تم إضافة ${keywords.length} ردود*\n\n📝 *الكلمات:* ${keywordsDisplay}\n📎 *النوع:* ${typeText}`)
        } else { await m.reply("❌ فشل في حفظ الرد") }
    } else if (action === 'حذف' && keywordsPart) {
        let foundKeyword = null
        for (const existingKey of Object.keys(autoReplies)) { if (existingKey.toLowerCase() === keywordsPart.toLowerCase()) { foundKeyword = existingKey; break } }
        if (foundKeyword) { delete autoReplies[foundKeyword]; if (saveAutoReplies(autoReplies)) { await m.reply(`✅ *تم حذف الرد*\n📝 *الكلمة:* ${foundKeyword}`) } else { await m.reply("❌ فشل في حذف الرد") } }
        else { await m.reply(`❌ *لا يوجد رد للكلمة:* "${keywordsPart}"`) }
    } else if (action === 'مسح' || action === 'clear') {
        if (saveAutoReplies({})) { await m.reply(`✅ *تم مسح جميع الردود التلقائية*`) } else { await m.reply("❌ فشل في مسح الردود") }
    } else {
        await m.reply(`❌ *أمر غير صحيح*\n\n📋 *الأوامر المتاحة:*\n• .الردود ← عرض الردود\n• .الردود اضافة كلمة | الرد\n• .الردود اضافة كلمة1|كلمة2|كلمة3 / الرد\n• .الردود حذف كلمة\n• .الردود مسح ← مسح الكل`)
    }
}

async function checkAutoReply(m, sock) {
    if (!m.isGroup) return false
    if (m.key?.fromMe) return false
    if (!m.body) return false
    const autoReplies = loadAutoReplies()
    if (!autoReplies || Object.keys(autoReplies).length === 0) return false
    const text = m.body.toLowerCase().trim()
    for (const [keyword, replyContent] of Object.entries(autoReplies)) {
        if (text.includes(keyword.toLowerCase())) {
            try { await m.react('🤖') } catch(e) {}
            const parsedReply = parseReplyContent(replyContent)
            await sendReply(sock, m.chat, parsedReply, m)
            return true
        }
    }
    return false
}

export { pluginConfig as config, handler, checkAutoReply }