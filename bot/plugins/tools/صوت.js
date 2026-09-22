import axios from 'axios'
import { commandGuide } from '../../src/lib/maro-text-style.js'

const pluginConfig = {
    name: 'صوت',
    alias: ['tts', 't2v', 'text2voice', 'نطق'],
    category: 'tools',
    description: 'تحويل النص إلى صوت',
    usage: '.صوت <نص>',
    example: '.صوت مرحباً كيف حالك',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock, text }) {
    if (!text) return m.reply(commandGuide({
        icon: '🔊',
        title: 'تحويل النص إلى صوت',
        note: 'اكتب النص الذي تريد تحويله إلى ملف صوتي.',
        command: `${m.prefix}صوت <نص>`,
        example: `${m.prefix}صوت مرحباً كيف حالك؟`,
    }))
    
    await m.react('🔊')
    
    try {
        const spokenText = text.trim().slice(0, 200)
        const language = /[\u0600-\u06FF]/.test(spokenText) ? 'ar' : 'en'
        const audioRes = await axios.get('https://translate.googleapis.com/translate_tts', {
            params: { ie: 'UTF-8', client: 'tw-ob', tl: language, q: spokenText },
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: { 'User-Agent': 'Tarboo Bot/1.0' },
        })
        if (!audioRes.data || !Buffer.byteLength(audioRes.data)) throw new Error('استجابة الصوت فارغة.')

        await sock.sendMessage(m.chat, {
            audio: Buffer.from(audioRes.data),
            mimetype: 'audio/mpeg'
        }, { quoted: m })
        await m.react('✅')
        
    } catch (e) {
        console.error('TTS Error:', e.message)
        return m.react('❌')
    }
}

export { pluginConfig as config, handler }
