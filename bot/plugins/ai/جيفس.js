import axios from 'axios'
import fs from 'fs'
import path from 'path'

const pluginConfig = {
    name: 'جيفس',
    alias: ['jeeves', 'jeev', 'جيف'],
    category: 'ai',
    description: 'محادثة مع Jeeves AI مع دعم الجلسات',
    usage: '.جيفس <سؤال>',
    example: '.جيفس من هو رئيس اندونيسيا؟',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

const dbPath = './database/jeeves.json'
const SESSION_TIMEOUT = 3 * 60 * 60 * 1000 // 3 ساعات

function loadDB() {
    try {
        if (!fs.existsSync(dbPath)) return {}
        return JSON.parse(fs.readFileSync(dbPath, 'utf8'))
    } catch {
        return {}
    }
}

function saveDB(db) {
    try {
        const dir = path.dirname(dbPath)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))
    } catch {}
}

async function jeevesAI(prompt, parentMessageId = null) {
    const requestData = { prompt }
    if (parentMessageId) requestData.parentMessageId = parentMessageId

    const config = {
        method: 'POST',
        url: 'https://api.jeeves.ai/generate/v4/chat',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
            'Origin': 'https://jeeves.ai',
            'Referer': 'https://jeeves.ai/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
        },
        data: JSON.stringify(requestData),
        responseType: 'stream',
        timeout: 60000
    }

    try {
        const response = await axios.request(config)
        return new Promise((resolve) => {
            let answer = ''
            let messageId = null

            response.data.on('data', (chunk) => {
                const lines = chunk.toString().split('\n').filter(line => line.trim() !== '')
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataContent = line.substring(6).trim()
                        if (dataContent === '[DONE]') continue
                        try {
                            const jsonData = JSON.parse(dataContent)
                            if (jsonData.messageId && !messageId) {
                                messageId = jsonData.messageId
                            }
                            if (jsonData.text) {
                                answer += jsonData.text
                            }
                        } catch {}
                    }
                }
            })

            response.data.on('end', () => {
                resolve({ answer: answer.trim(), messageId })
            })

            response.data.on('error', () => {
                resolve({ answer: '❌ خطأ في الاتصال', messageId: null })
            })
        })
    } catch (error) {
        return { answer: `❌ خطأ: ${error.message}`, messageId: null }
    }
}

async function handler(m, { sock, text }) {
    if (!text) {
        return m.reply(
            `🤖 *Jeeves AI*\n\n` +
            `> \`${m.prefix}جيفس <سؤال>\`\n\n` +
            `> مثال:\n` +
            `> \`${m.prefix}جيفس من هو رئيس اندونيسيا؟\``
        )
    }

    await m.react('🤖')

    let db = loadDB()
    let userId = m.sender
    let now = Date.now()
    let parentMessageId = null

    let session = db[userId]
    if (session) {
        if (now - session.lastUsed > SESSION_TIMEOUT) {
            delete db[userId]
        } else {
            parentMessageId = session.messageId || null
        }
    }

    try {
        let res = await jeevesAI(text, parentMessageId)
        if (!res || !res.answer) {
            return m.reply('❌ لا يوجد رد من Jeeves.')
        }

        db[userId] = {
            messageId: res.messageId,
            lastUsed: now
        }
        saveDB(db)

        await m.reply(res.answer)

    } catch (err) {
        await m.reply(`❌ خطأ: ${err.message}`)
    }
}

export { pluginConfig as config, handler }