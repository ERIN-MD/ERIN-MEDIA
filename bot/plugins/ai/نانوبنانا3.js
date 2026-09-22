// ═══════════════════════════════════════════════
// 📁 plugins/ai/نانوبنانا3.js
// 🍌 نانوبنانا 3 - تعديل الصور بالذكاء الاصطناعي
// ═══════════════════════════════════════════════

import fetch from 'node-fetch'
import FormData from 'form-data'
import sharp from 'sharp'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'نانوبنانا3',
    alias: ['nanobanan3', 'نانو3', 'بنانا3', 'nano3'],
    category: 'ai',
    description: 'تعديل الصور بالذكاء الاصطناعي',
    usage: '.نانوبنانا3 <برومبت> (رد على صورة)',
    example: '.نانوبنانا3 anime style',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 3,
    isEnabled: true
}

const API = "https://johan-vex-apis.vercel.app/api/tools/nanobanan"

async function uploadToImgbb(buffer) {
    const form = new FormData()
    form.append('source', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' })
    form.append('type', 'file')
    form.append('action', 'upload')
    const res = await fetch('https://imgbb.com/json', {
        method: 'POST',
        headers: { 'User-Agent': 'Mozilla/5.0', ...form.getHeaders() },
        body: form,
    })
    const json = await res.json()
    if (!json?.image?.url) throw new Error('فشل رفع الصورة')
    return json.image.url
}

async function maybeConvertWebp(buffer) {
    const isWebp = buffer.toString('ascii', 8, 12) === 'WEBP'
    if (!isWebp) return buffer
    try { return await sharp(buffer).jpeg().toBuffer() } catch { return buffer }
}

async function handler(m, { sock, text }) {
    const q = m.quoted || m
    if (!q.isMedia || !q.isImage) {
        return m.reply(`🍌 *نانوبنانا 3*\n\n📝 .نانوبنانا3 <برومبت> (رد على صورة)\n💡 .نانوبنانا3 anime style`)
    }

    if (!text) return m.reply('❌ *اكتب البرومبت*')

    m.react('⏳')

    try {
        const buffer = await q.download()
        const cleanBuffer = await maybeConvertWebp(buffer)
        const sourceUrl = await uploadToImgbb(cleanBuffer)

        const url = `${API}?url=${encodeURIComponent(sourceUrl)}&prompt=${encodeURIComponent(text)}`
        const res = await fetch(url)
        const json = await res.json()

        if (!json?.success || !json?.result_url) throw new Error(json?.error || 'فشل')

        const imgRes = await fetch(json.result_url)
        const resultBuffer = Buffer.from(await imgRes.arrayBuffer())

        m.react('✅')
        await sock.sendMessage(m.chat, { image: resultBuffer }, { quoted: m })

    } catch (e) {
        m.react('❌')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }