/**
 * حلم / عالم الأحلام - مولد تفسير أحلام ممتع
 */

const pluginConfig = {
    name: 'حلم',
    alias: ['mimpi'],
    category: 'fun',
    description: 'استكشف عالم أحلامك بناءً على اسمك',
    usage: '.حلم <اسم>',
    example: '.حلم كيسيا',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 1,
    isEnabled: true
}

const DREAM_LEVELS = ['واضح ✨', 'غامض 🌟', 'أثيري 💫', 'إلهي 🌙', 'أسطوري 🎇']
const DREAM_QUALITIES = ['هادئ 😌', 'مغامرة 🚀', 'صوفي 🔮', 'نبوءة 📖', 'ملحمي 🗺️']

const ELEMENTS = [
    '🌊 بحر الكريستال المتوهج',
    '🌈 قوس قزح عائم',
    '🌺 حديقة معلقة',
    '⭐ كوكبة حية',
    '🌙 قمران مزدوجان',
    '🏰 قلعة الغيوم',
    '🌋 جبل المنشور',
    '🎭 مسرح الظلال'
]

const EVENTS = [
    '🦋 فراشات تحمل رسالة سرية',
    '🎭 أقنعة ترقص وحدها',
    '🌊 أمطار نجوم تسقط في البحر',
    '🎪 موكب مخلوقات عجيبة',
    '🌺 زهور تغني أغنية قديمة',
    '🎨 لوحات تنبض بالحياة',
    '🎵 موسيقى تُرى كألوان',
    '⚡ برق يشكل سلماً إلى السماء'
]

const ENCOUNTERS = [
    '🐉 تنين قوس قزح الحكيم',
    '🧙‍♂️ ساحر النجوم',
    '🦊 ثعلب الروح ذو التسعة ذيول',
    '🧝‍♀️ جنية جالبة الأحلام',
    '🦁 أسد الكريستال',
    '🐋 حوت طائر غامض',
    '🦅 طائر الفينيق الزمني',
    '🐢 سلحفاة حاملة العالم',
    '🦄 يونيكورن الأبعاد'
]

const POWERS = [
    '✨ التحكم بالوقت',
    '🌊 التحدث مع العناصر',
    '🎭 تغيير الشكل',
    '🌈 التلاعب بالواقع',
    '👁️ رؤية المستقبل',
    '🎪 الانتقال بين الأبعاد',
    '🌙 الشفاء الروحي',
    '⚡ الطاقة الكونية'
]

const MESSAGES = [
    'رحلتك ستجلب تغييراً كبيراً',
    'أسرار قديمة ستُكشف قريباً',
    'قوة مخفية ستستيقظ قريباً',
    'قدر جديد ينتظر في الأفق',
    'اتصال روحي سيتقوى',
    'تحول كبير سيحدث',
    'تنوير سيأتي من اتجاه غير متوقع',
    'مهمة هامة ستبدأ قريباً'
]

function generateDream(seed) {
    const seedNum = Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0)
    
    const pick = (arr) => arr[seedNum % arr.length]
    const pickMulti = (arr, count) => {
        const shuffled = [...arr].sort(() => Math.random() - 0.5)
        return shuffled.slice(0, count)
    }
    
    return {
        level: pick(DREAM_LEVELS),
        quality: pick(DREAM_QUALITIES),
        elements: pickMulti(ELEMENTS, 3),
        events: pickMulti(EVENTS, 2),
        encounters: pickMulti(ENCOUNTERS, 2),
        powers: pickMulti(POWERS, 2),
        message: pick(MESSAGES)
    }
}

async function handler(m, { sock }) {
    const args = m.args || []
    let name = args.join(' ') || m.pushName || m.sender.split('@')[0]
    
    await m.react('🌙')
    await m.reply('🌙 *الدخول إلى عالم الأحلام...*')
    await new Promise(r => setTimeout(r, 1500))
    
    const dream = generateDream(name)
    
    let txt = `╭═══❯ *🌙 عالم الأحلام* ❮═══\n`
    txt += `│ 👤 *المستكشف:* ${name}\n`
    txt += `│ ⭐ *المستوى:* ${dream.level}\n`
    txt += `│ 💫 *النوع:* ${dream.quality}\n`
    txt += `│ 🌈 *العناصر:*\n`
    for (const el of dream.elements) {
        txt += `│ ├ ${el}\n`
    }
    txt += `│ 🎪 *الأحداث:*\n`
    for (const ev of dream.events) {
        txt += `│ ├ ${ev}\n`
    }
    txt += `│ 🌟 *اللقاءات:*\n`
    for (const enc of dream.encounters) {
        txt += `│ ├ ${enc}\n`
    }
    txt += `│ 💫 *القوى:*\n`
    for (const pow of dream.powers) {
        txt += `│ ├ ${pow}\n`
    }
    txt += `│ 🔮 *الرسالة:*\n`
    txt += `│ ${dream.message}\n`
    txt += `╰════════════════════`
    
    await m.reply(txt)
}

export { pluginConfig as config, handler }