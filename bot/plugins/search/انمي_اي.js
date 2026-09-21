import axios from 'axios'
import config from '../../config.js'
import { downloadContentFromMessage } from 'maro'
import FormData from 'form-data'
import te from '../../src/lib/maro-error.js'

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-MaroMD'

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: 'انمي_اي',
    alias: ['whatanime'],
    category: 'search',
    description: 'تعرف على الأنمي من صورة',
    usage: '.انمي_اي (رد على صورة)',
    example: '.انمي_اي',
    isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
    cooldown: 15, energi: 1, isEnabled: true
}

// ═══════════════════════════════════════════════
// 🛠️ رفع الصورة
// ═══════════════════════════════════════════════
async function uploadToTempfiles(buffer) {
    const form = new FormData()
    form.append('file', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' })
    const response = await axios.post('https://c.termai.cc/api/upload?key=AIzaBj7z2z3xBjsk', form, {
        headers: form.getHeaders(), timeout: 30000
    })
    if (response.data?.files?.[0]?.url) return response.data
    throw new Error('فشل الرفع')
}

// ═══════════════════════════════════════════════
// 🎯 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
    let imageBuffer = null
    let imageMsg = null
    
    if (m.isImage && m.message?.imageMessage) {
        imageMsg = m.message.imageMessage
    } else if (m.quoted?.isImage && m.quoted?.message?.imageMessage) {
        imageMsg = m.quoted.message.imageMessage
    } else if (m.quoted?.isImage) {
        try { imageBuffer = await m.quoted.download() } catch (e) {}
    }
    
    if (m.isVideo || m.quoted?.isVideo) {
        return m.reply(`❌ *غير مدعوم*\n\n> الصور فقط\n> الفيديو لا يمكن معالجته\n\n📌 رد على صورة مع \`${m.prefix}انمي_اي\``)
    }
    
    if (!imageMsg && !imageBuffer) {
        return m.reply(`🔍 *ما هذا الأنمي؟*\n\n> أرسل صورة أو رد على صورة مع \`${m.prefix}انمي_اي\``)
    }
    
    m.react('🔍')
    
    try {
        if (!imageBuffer && imageMsg) {
            const stream = await downloadContentFromMessage(imageMsg, 'image')
            let chunks = []
            for await (const chunk of stream) { chunks.push(chunk) }
            imageBuffer = Buffer.concat(chunks)
        }
        
        if (!imageBuffer || imageBuffer.length < 100) {
            m.react('❌')
            return m.reply(`❌ فشل جلب الصورة`)
        }
        
        await m.react('⏳')
        
        const imageUrl = await uploadToTempfiles(imageBuffer)
        
        const res = await axios.get(`https://api.neoxr.eu/api/whatanime?url=${encodeURIComponent(imageUrl)}&apikey=${NEOXR_APIKEY}`, { timeout: 60000 })
        
        if (!res.data?.status || !res.data?.data) {
            m.react('❌')
            return m.reply(`❌ لم يتم التعرف على الأنمي`)
        }
        
        const d = res.data.data
        const similarity = ((d.similarity || 0) * 100).toFixed(2)
        
        const formatTime = (seconds) => {
            if (!seconds) return '00:00'
            const mins = Math.floor(seconds / 60)
            const secs = Math.floor(seconds % 60)
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        }
        
        const filename = d.filename || 'غير معروف'
        const animeName = filename.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').replace(/\.mp4|\.mkv|\.avi/gi, '').trim() || 'أنمي غير معروف'
        
        const caption = `🔍 *ما هذا الأنمي؟*\n\n` +
            `🎬 *الأنمي:* ${animeName}\n` +
            `📺 *الحلقة:* ${d.episode || 'فيلم/OVA'}\n` +
            `🆔 *AniList ID:* ${d.anilist || '-'}\n\n` +
            `⏱️ *التوقيت:* ${formatTime(d.from)} → ${formatTime(d.to)}\n` +
            `📊 *التطابق:* ${similarity}%\n\n` +
            `🔗 https://anilist.co/anime/${d.anilist || ''}`
        
        m.react('✅')
        
        if (d.image) {
            await sock.sendMedia(m.chat, d.image, caption, m, { type: 'image' })
        } else {
            await m.reply(caption)
        }
        
    } catch (error) {
        m.react('❌')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }