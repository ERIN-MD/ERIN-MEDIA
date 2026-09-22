// برجك - أمر لمعرفة توقعات الأبراج

import axios from 'axios'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'برجك',
    alias: ['zodiak'],
    category: 'primbon',
    description: 'توقعات الأبراج',
    usage: '.برجك <اسم البرج>',
    example: '.برجك الحمل',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const validZodiacs = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagitarius', 'capricorn', 'aquarius', 'pisces']

// ترجمة أسماء الأبراج
const zodiacNames = {
    aries: 'الحمل',
    taurus: 'الثور',
    gemini: 'الجوزاء',
    cancer: 'السرطان',
    leo: 'الأسد',
    virgo: 'العذراء',
    libra: 'الميزان',
    scorpio: 'العقرب',
    sagitarius: 'القوس',
    capricorn: 'الجدي',
    aquarius: 'الدلو',
    pisces: 'الحوت'
}

async function handler(m, { sock }) {
    let zodiac = m.args[0]?.toLowerCase()
    
    // التحقق من الاسم العربي
    if (zodiac) {
        for (const [key, value] of Object.entries(zodiacNames)) {
            if (value === zodiac) {
                zodiac = key
                break
            }
        }
    }
    
    if (!zodiac || !validZodiacs.includes(zodiac)) {
        const zodiacList = Object.values(zodiacNames).map(z => `• ${z}`).join('\n')
        return m.reply(`⭐ *برجك*\n\n> أدخل اسم البرج:\n\n${zodiacList}\n\n\`مثال: ${m.prefix}برجك الحمل\``)
    }
    
    m.react('⭐')
    
    try {
        const url = `https://api.siputzx.my.id/api/primbon/zodiak?zodiak=${zodiac}`
        const { data } = await axios.get(url, { timeout: 30000 })
        
        if (!data?.status || !data?.data) {
            m.react('❌')
            return m.reply(`❌ *فشل*\n\n> فشل الحصول على التوقعات`)
        }
        
        const r = data.data
        const zodiacAr = zodiacNames[zodiac] || zodiac.toUpperCase()
        const response = `⭐ *برج ${zodiacAr}*\n\n` +
            `${r.zodiak}\n\n` +
            `🔢 *رقم الحظ:* ${r.nomor_keberuntungan}\n` +
            `🌸 *زهرة الحظ:* ${r.bunga_keberuntungan}\n` +
            `🎨 *لون الحظ:* ${r.warna_keberuntungan}\n` +
            `💎 *حجر الحظ:* ${r.batu_keberuntungan}\n` +
            `🔥 *العنصر:* ${r.elemen_keberuntungan}\n` +
            `🪐 *الكوكب:* ${r.planet_yang_mengitari}\n` +
            `💕 *البرج المتوافق:* ${r.pasangan_zodiak}`
        
        m.react('✅')
        await m.reply(response)
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }