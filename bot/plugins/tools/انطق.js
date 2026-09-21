import axios from 'axios'

const pluginConfig = {
    name: 'انطق',
    alias: ['tts', 'صوت', 'eleven', 'نطق', 'تحدث'],
    category: 'tools',
    description: 'تحويل النص إلى صوت بـ 165 صوت عربي وأجنبي',
    usage: '.انطق <رقم_الصوت> <نص>',
    example: '.انطق 1 السلام عليكم',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 8,
    energi: 1,
    isEnabled: true
}

const API_BASE = 'https://engez.a7a.online/api/v1/tools/elevenlab'

// أفضل 20 صوت
const TOP_VOICES = [
    { id: 1, name: 'ماجد', gender: 'ذكر' },
    { id: 2, name: 'غالية', gender: 'أنثى' },
    { id: 3, name: 'عائشة', gender: 'أنثى' },
    { id: 5, name: 'فهد', gender: 'ذكر' },
    { id: 6, name: 'حسن', gender: 'ذكر' },
    { id: 7, name: 'راكان', gender: 'ذكر' },
    { id: 8, name: 'حصة', gender: 'أنثى' },
    { id: 9, name: 'لمى', gender: 'أنثى' },
    { id: 13, name: 'أسماء', gender: 'أنثى' },
    { id: 24, name: 'فاطمة', gender: 'أنثى' },
    { id: 47, name: 'أحمد', gender: 'ذكر' },
    { id: 49, name: 'يوسف', gender: 'ذكر' },
    { id: 60, name: 'ريم', gender: 'أنثى' },
    { id: 68, name: 'عمر', gender: 'ذكر' },
    { id: 70, name: 'فاطمة', gender: 'أنثى' },
    { id: 75, name: 'أحمد', gender: 'ذكر' },
    { id: 82, name: 'سلمى', gender: 'أنثى' },
    { id: 97, name: 'سارة', gender: 'أنثى' },
    { id: 102, name: 'علي', gender: 'ذكر' },
    { id: 119, name: 'محمد', gender: 'ذكر' }
]

async function generateVoice(text, voiceId) {
    const { data } = await axios.get(`${API_BASE}?text=${encodeURIComponent(text)}&voice=${voiceId}`, {
        timeout: 60000
    })
    
    if (!data?.success || !data?.response?.url) {
        throw new Error(data?.error || 'فشل توليد الصوت')
    }
    
    return data.response
}

async function handler(m, { sock, text }) {
    if (!text) {
        let txt = `🎙️ *ElevenLabs TTS - 165 صوت*\n\n`
        txt += `📌 *الاستخدام:*\n`
        txt += `\`${m.prefix}انطق <رقم_الصوت> <نص>\`\n\n`
        txt += `📌 *مثال:*\n`
        txt += `\`${m.prefix}انطق 1 السلام عليكم\`\n`
        txt += `\`${m.prefix}انطق 24 مرحباً\`\n\n`
        txt += `🎤 *أفضل الأصوات:*\n`
        TOP_VOICES.slice(0, 10).forEach(v => {
            txt += `  ${v.id}. ${v.name} (${v.gender})\n`
        })
        txt += `\n_للقائمة الكاملة: \`${m.prefix}انطق قائمة\`_`
        return m.reply(txt)
    }

    // عرض القائمة الكاملة
    if (text === 'قائمة') {
        let txt = `🎤 *قائمة الأصوات*\n\n`
        TOP_VOICES.forEach(v => {
            txt += `${v.id}. *${v.name}* (${v.gender})\n`
        })
        txt += `\n_المجموع: 165 صوت | استخدم الرقم لتحديد الصوت_`
        return m.reply(txt)
    }

    await m.react('🎙️')

    // استخراج رقم الصوت والنص
    const match = text.match(/^(\d+)\s+(.+)/)
    let voiceId = '1'
    let textToSpeak = text

    if (match) {
        voiceId = match[1]
        textToSpeak = match[2]
    }

    try {
        const result = await generateVoice(textToSpeak, voiceId)
        
        const voice = TOP_VOICES.find(v => v.id === parseInt(voiceId))
        const voiceName = voice?.name || voiceId
        
        // إرسال الصوت
        await sock.sendMessage(m.chat, {
            audio: { url: result.url },
            mimetype: 'audio/mpeg',
            ptt: false
        }, { quoted: m })

        await sock.sendMessage(m.chat, {
            text: `🎙️ *${voiceName}* | 📝 ${textToSpeak}`
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        await m.react('❌')
        return m.reply(`❌ خطأ: ${e.message}`)
    }
}

export { pluginConfig as config, handler }