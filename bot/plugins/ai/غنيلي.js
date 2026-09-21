import fetch from 'node-fetch'
import config from '../../config.js'

const pluginConfig = {
    name: 'غنيلي',
    alias: ['غني', 'sing', 'اغنيه'],
    category: 'ai',
    description: 'توليد كلمات أغنية بالذكاء الاصطناعي',
    usage: '.غنيلي <وصف الأغنية>',
    example: '.غنيلي حب وحنين',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: true,
    cooldown: 30,
    energi: 5,
    isEnabled: true
}

async function handler(m, { sock }) {
    if (!m.text) {
        return m.reply('❌ *اكتب وصف الأغنية*\nمثال: .غنيلي حب وحنين')
    }

    await m.reply('🎵 *جاري التأليف...*')

    try {
        const res = await fetch('https://ai-song.ai/api/chat-openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=UTF-8',
                'Origin': 'https://ai-song.ai',
                'Referer': 'https://ai-song.ai/',
                'User-Agent': 'Mozilla/5.0'
            },
            body: JSON.stringify({ lyrics: m.text.trim() }),
            timeout: 30000
        })

        const data = await res.json()

        if (data?.data?.lyrics) {
            await m.reply(data.data.lyrics)
        } else {
            await m.reply('❌ فشل كتابة الأغنية')
        }
    } catch (e) {
        await m.reply('❌ حدث خطأ')
    }
}

export { pluginConfig as config, handler }