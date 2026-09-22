import axios from 'axios'
import fs from 'fs'
import path from 'path'

const pluginConfig = {
    name: 'رواية',
    alias: ['novel', 'sunovels', 'روايه'],
    category: 'downloader',
    description: 'بحث وتحميل روايات من Sunovels',
    usage: '.رواية <اسم الرواية>',
    example: '.رواية القس المجنون',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 8,
    energi: 1,
    isEnabled: true
}

const API_BASE = 'https://engez.a7a.online/api/v1/reading/sunovels'
const sessions = {}

function getSession(sender) {
    if (!sessions[sender]) {
        sessions[sender] = { results: [], novel: null, chapters: [], page: 1, totalPages: 0 }
    }
    return sessions[sender]
}

async function apiGet(params) {
    const url = `${API_BASE}?${new URLSearchParams(params).toString()}`
    const { data } = await axios.get(url, { timeout: 30000 })
    return data
}

async function handler(m, { sock, text, prefix }) {
    const session = getSession(m.sender)
    const input = text?.trim() || ''

    if (!input) {
        return m.reply(`📚 *Sunovels*\n\n> \`${prefix}رواية <اسم>\`\n\n> مثال:\n> \`${prefix}رواية القس المجنون\``)
    }

    // ============ اختيار رواية ============
    if (input.startsWith('اختيار ') || input.startsWith('اختر ')) {
        const idx = parseInt(input.split(' ')[1]) - 1
        if (isNaN(idx) || !session.results[idx]) return m.reply('❌ رقم غير صحيح')

        session.novel = session.results[idx]
        await m.react('⏳')

        const data = await apiGet({ action: 'chapters', url: session.novel.url, page: '0' })
        session.chapters = data?.response?.chapters || []
        session.totalPages = data?.response?.totalPages || 1
        session.page = 1

        const total = Math.min(session.totalPages, 47)
        const pageRows = Array.from({ length: total }, (_, i) => ({
            title: `صفحة ${i + 1}`,
            id: `${prefix}رواية صفحة ${i + 1}`,
            description: `عرض فصول الصفحة ${i + 1}`
        }))

        const content = {
            buttonsMessage: {
                buttons: [{
                    buttonText: { displayText: '📄 اختر صفحة' },
                    buttonId: 'page',
                    type: 1,
                    nativeFlowInfo: {
                        name: 'single_select',
                        paramsJson: JSON.stringify({
                            title: `📖 ${session.novel.title}`,
                            sections: [{ title: '📄 صفحات الفصول', rows: pageRows }]
                        })
                    }
                }],
                contentText: `📖 *${session.novel.title}*\n📄 الصفحات: ${session.totalPages}`,
                footerText: 'اختر صفحة لعرض الفصول',
                headerType: 1
            }
        }

        const msg = generateWAMessageFromContent(m.chat, content, { userJid: sock.user.jid })
        await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
        await m.react('✅')
        return
    }

    // ============ اختيار صفحة ============
    if (input.startsWith('صفحة ') || input.startsWith('page ')) {
        const page = parseInt(input.split(' ')[1])
        if (isNaN(page) || !session.novel) return m.reply('❌ خطأ')

        await m.react('⏳')

        const data = await apiGet({ action: 'chapters', url: session.novel.url, page: String(page - 1) })
        const chapters = (data?.response?.chapters || []).sort((a, b) => 
            (parseInt(a.title) || 0) - (parseInt(b.title) || 0)
        )
        session.chapters = chapters
        session.page = page

        // بناء صفوف الفصول
        const chapterSections = []
        for (let i = 0; i < chapters.length; i += 10) {
            chapterSections.push({
                title: `📖 فصول ${i + 1}-${Math.min(i + 10, chapters.length)}`,
                rows: chapters.slice(i, i + 10).map((v, j) => ({
                    title: `فصل ${v.title}`,
                    id: `${prefix}رواية تحميل ${i + j + 1}`,
                    description: 'تحميل TXT'
                }))
            })
        }

        const content = {
            buttonsMessage: {
                buttons: [{
                    buttonText: { displayText: '📖 اختر فصل' },
                    buttonId: 'chapter',
                    type: 1,
                    nativeFlowInfo: {
                        name: 'single_select',
                        paramsJson: JSON.stringify({
                            title: `📖 ${session.novel.title}`,
                            sections: chapterSections
                        })
                    }
                }],
                contentText: `📖 *${session.novel.title}*\n📄 صفحة ${page}/${session.totalPages}`,
                footerText: `${chapters.length} فصل`,
                headerType: 1
            }
        }

        const msg = generateWAMessageFromContent(m.chat, content, { userJid: sock.user.jid })
        await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
        await m.react('✅')
        return
    }

    // ============ تحميل فصل ============
    if (input.startsWith('تحميل ') || input.startsWith('dl ')) {
        const num = parseInt(input.split(' ')[1]) - 1
        if (isNaN(num) || !session.chapters[num]) return m.reply('❌ رقم غير صحيح')

        const chapter = session.chapters[num]
        await m.react('⏳')

        const data = await apiGet({ action: 'content', url: chapter.url })
        if (!data?.success || !data?.response?.text) {
            await m.react('❌')
            return m.reply('❌ فشل التحميل')
        }

        const content = data.response
        const fileName = `${content.novelTitle || 'novel'}_${content.chapterTitle || chapter.title}.txt`
            .replace(/[\/\\:*?"<>|]/g, '_').slice(0, 100)

        const tmpDir = path.join(process.cwd(), 'temp')
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

        const filePath = path.join(tmpDir, `${Date.now()}.txt`)
        fs.writeFileSync(filePath, content.text, 'utf8')

        await sock.sendMessage(m.chat, {
            document: fs.readFileSync(filePath),
            fileName,
            mimetype: 'text/plain'
        }, { quoted: m })

        fs.unlinkSync(filePath)
        await m.react('✅')
        return
    }

    // ============ بحث ============
    await m.react('🔍')

    try {
        const results = await apiGet({ action: 'search', q: input })

        if (!results?.success || !results?.response?.length) {
            await m.react('❌')
            return m.reply(`❌ لم يتم العثور على: ${input}`)
        }

        session.results = results.response

        const rows = results.response.slice(0, 10).map((v, i) => ({
            title: v.title.length > 40 ? v.title.slice(0, 40) + '...' : v.title,
            id: `${prefix}رواية اختيار ${i + 1}`,
            description: 'اختيار الرواية'
        }))

        const content = {
            buttonsMessage: {
                buttons: [{
                    buttonText: { displayText: '📚 اختر رواية' },
                    buttonId: 'novel',
                    type: 1,
                    nativeFlowInfo: {
                        name: 'single_select',
                        paramsJson: JSON.stringify({
                            title: `📚 نتائج البحث عن: ${input}`,
                            sections: [{ title: '📚 نتائج البحث', rows }]
                        })
                    }
                }],
                contentText: `📚 *نتائج البحث:* ${input}`,
                footerText: `${results.response.length} نتيجة`,
                headerType: 1
            }
        }

        const msg = generateWAMessageFromContent(m.chat, content, { userJid: sock.user.jid })
        await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
        await m.react('✅')

    } catch (e) {
        await m.react('❌')
        return m.reply(`❌ خطأ: ${e.message}`)
    }
}

import { generateWAMessageFromContent } from 'maro'

export { pluginConfig as config, handler }