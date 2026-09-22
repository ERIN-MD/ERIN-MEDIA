/**
 * الأبراج - فاحص توافق الأبراج
 */

const pluginConfig = {
    name: 'الأبراج',
    alias: ['soulmatch'],
    category: 'fun',
    description: 'تحقق من توافق الأبراج بين شخصين',
    usage: '.الأبراج اسم1|اسم2',
    example: '.الأبراج رعد|مي',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 1,
    isEnabled: true
}

const ELEMENTS = ['نار 🔥', 'ماء 💧', 'أرض 🌍', 'رياح 🌪️', 'برق ⚡', 'جليد ❄️', 'نور ✨', 'ظلام 🌑']
const ZODIAC = ['♈ حمل', '♉ ثور', '♊ جوزاء', '♋ سرطان', '♌ أسد', '♍ عذراء', 
               '♎ ميزان', '♏ عقرب', '♐ قوس', '♑ جدي', '♒ دلو', '♓ حوت']
const SOUL_TYPES = [
    "القائد الشجاع", "الموازن الحكيم", "المبدع المعبر", "الباني الصلب", 
    "المغامر الحر", "الحامي المخلص", "المفكر الصوفي", "الفاتح القوي", "الإنساني النقي"
]

function generateSoulData(name, seed) {
    const nameVal = Array.from(name.toLowerCase()).reduce((a, c) => a + c.charCodeAt(0), 0)
    return {
        element: ELEMENTS[(nameVal + seed) % ELEMENTS.length],
        zodiac: ZODIAC[(nameVal + seed * 2) % ZODIAC.length],
        soulType: SOUL_TYPES[(nameVal + seed * 3) % SOUL_TYPES.length]
    }
}

function getMatchDescription(score) {
    if (score >= 90) return "💫 قدر حقيقي"
    if (score >= 80) return "✨ انسجام مثالي"
    if (score >= 70) return "🌟 اتصال قوي"
    if (score >= 60) return "⭐ إمكانية جيدة"
    if (score >= 50) return "🌙 يحتاج جهداً"
    return "🌑 تحدي ثقيل"
}

function getReading(score) {
    if (score >= 80) {
        return "أرواحكم لديها اتصال مميز ونادر جداً. القدر خطط لهذا اللقاء."
    } else if (score >= 60) {
        return "هناك كيمياء قوية بينكما. اختلافاتكم تصنع انسجاماً."
    } else if (score >= 40) {
        return "تحتاجون وقتاً لتفهموا بعضكم. كل تحدٍ سيقوي رابطتكم."
    }
    return "اختلاف كبير في طاقة الأرواح. تحتاجون الكثير من التكيف والتفاهم."
}

async function handler(m, { sock }) {
    const args = m.args || []
    const text = args.join(' ')
    
    if (!text || !text.includes('|')) {
        return m.reply(
            `💫 *الأبراج*\n\n` +
            `> تحقق من توافق الأبراج بين شخصين!\n\n` +
            `*الصيغة:*\n` +
            `> \`.الأبراج اسم1|اسم2\`\n\n` +
            `*مثال:*\n` +
            `> \`.الأبراج رعد|مي\``
        )
    }
    
    const [nama1, nama2] = text.split('|').map(n => n.trim())
    
    if (!nama1 || !nama2) {
        return m.reply(`❌ أدخل اسمين بالصيغة: \`${m.prefix}الأبراج اسم1|اسم2\``)
    }
    
    await m.react('🕕')
    
    const seed1 = Date.now() % 100
    const seed2 = (Date.now() + 50) % 100
    const soul1 = generateSoulData(nama1, seed1)
    const soul2 = generateSoulData(nama2, seed2)
    const combined = nama1.toLowerCase() + nama2.toLowerCase()
    const baseScore = Array.from(combined).reduce((a, c) => a + c.charCodeAt(0), 0)
    const compatibility = (baseScore % 51) + 50 
    let txt = `╭═══❯ *💫 الأبراج* ❮═══\n`
    txt += `│\n`
    txt += `│ 👤 *${nama1}*\n`
    txt += `│ ├ 🔮 الروح: ${soul1.soulType}\n`
    txt += `│ ├ 🌟 العنصر: ${soul1.element}\n`
    txt += `│ └ 🎯 البرج: ${soul1.zodiac}\n`
    txt += `│\n`
    txt += `│ 👤 *${nama2}*\n`
    txt += `│ ├ 🔮 الروح: ${soul2.soulType}\n`
    txt += `│ ├ 🌟 العنصر: ${soul2.element}\n`
    txt += `│ └ 🎯 البرج: ${soul2.zodiac}\n`
    txt += `│\n`
    txt += `│ 💕 *التوافق*\n`
    txt += `│ ├ 📊 النتيجة: *${compatibility}%*\n`
    txt += `│ └ 🎭 الحالة: ${getMatchDescription(compatibility)}\n`
    txt += `│\n`
    txt += `│ 🔮 *القراءة:*\n`
    txt += `│ ${getReading(compatibility)}\n`
    txt += `│\n`
    txt += `╰════════════════════`
    await m.reply(txt)
    m.react('✅')
}

export { pluginConfig as config, handler }