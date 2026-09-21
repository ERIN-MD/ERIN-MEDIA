import fs from 'fs'
import path from 'path'
import gtts from 'gtts'
const pluginConfig = {
    name: 'كشف_الخادم',
    alias: ['cekkhodam'],
    category: 'fun',
    description: 'اكشف خادم نفسك أو شخص آخر',
    usage: '.كشف_الخادم أو رد على رسالة شخص',
    example: '.كشف_الخادم',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}
const KHODAMS = [
    { name: "النمر الأبيض", meaning: "أنت قوي وشجاع كالنمر، لأن أسلافك ورثوا لك قوة عظيمة." },
    { name: "المصباح النائم", meaning: "تبدو نعساناً لكنك دائماً تعطي ضوءاً دافئاً" },
    { name: "الباندا بلا أسنان", meaning: "أنت لطيف وتنجح دائماً في جعل الناس يبتسمون بغرابتك." },
    { name: "البطة المطاطية", meaning: "أنت هادئ ومبهج دائماً، قادر على مواجهة أمواج المشاكل بابتسامة." },
    { name: "سلاحف النينجا", meaning: "أنت رشيق وقوي، مستعد لحماية الضعفاء بقوتك القتالية." },
    { name: "قطة الثلاجة", meaning: "أنت غامض ودائماً موجود في أماكن غير متوقعة." },
    { name: "الصابون المعطر", meaning: "أنت دائماً تجلب العطر والانتعاش أينما كنت." },
    { name: "النملة الصغيرة", meaning: "أنت مجتهد ويمكن الاعتماد عليك دائماً في أي موقف." },
    { name: "كب كيك قوس قزح", meaning: "أنت حلو ومليء بالألوان، دائماً تجلب السعادة والبهجة." },
    { name: "الروبوت الصغير", meaning: "أنت متطور ومستعد دائماً للمساعدة بذكاء تكنولوجي عالٍ." },
    { name: "السمكة الطائرة", meaning: "أنت فريد ومليء بالمفاجآت، دائماً تتجاوز الحدود الموجودة." },
    { name: "الدجاج المقلي", meaning: "أنت محبوب ومنتظر من الكثيرين، مليء باللذة في كل خطوة." },
    { name: "الصرصور الطائر", meaning: "أنت دائماً تفاجئ وتثير ضجة في المكان." },
    { name: "الماعز الحفار", meaning: "أنت فريد ودائماً تجعل الناس يضحكون بتصرفاتك الغريبة." },
    { name: "البطاطس المقرمشة", meaning: "أنت دائماً تجعل الأجواء أكثر متعة ولذة." },
    { name: "الحصالة الخنزير", meaning: "أنت دائماً تخبئ مفاجآت في داخلك." },
    { name: "الخزانة القديمة", meaning: "أنت مليء بالقصص والذكريات الماضية." },
    { name: "القهوة بالحليب", meaning: "أنت حلو ودائماً تنشط الناس من حولك." },
    { name: "المكنسة", meaning: "أنت قوي ويمكن الاعتماد عليك دائماً لتنظيف المشاكل." },
    { name: "الإندومي المقلي", meaning: "دائماً تشبع وتُسعد" },
    { name: "الآيس كريم الذائب", meaning: "دائماً تذيب الأجواء بطعمك الحلو" },
    { name: "كرات اللحم المطاطية", meaning: "دائماً مثابر وصلب في مواجهة المشاكل" },
    { name: "الغراء الفائق", meaning: "دائماً ملتصق في المواقف المعقدة" },
    { name: "الصلصة الحلوة", meaning: "دائماً تعطي لمسة حلوة في الحياة" },
    { name: "صابون الاستحمام", meaning: "دائماً نظيف ومعطر" },
    { name: "القهوة المسكوبة", meaning: "دائماً متحمس، لكن أحياناً فوضوي" },
    { name: "القط البلدي", meaning: "دائماً مستقل ومليء بالمغامرات" },
    { name: "الدواء المر", meaning: "دائماً يعطي قوة رغم أنه غير مستساغ في البداية" },
    { name: "كيس الشاي", meaning: "دائماً يعطي دفئاً في القلب" },
    { name: "الموتور القديم", meaning: "دائماً مخلص وعنيد" },
    { name: "النودلز الفورية", meaning: "دائماً سريع ومشبع" },
    { name: "الكيك المطهو على البخار", meaning: "دائماً ناعم وحلو" },
    { name: "التوفو المستدير", meaning: "دائماً لذيذ في كل الأوقات" },
    { name: "الأرز باللبن", meaning: "دائماً مناسب في كل وقت" },
    { name: "الأسد المتوج", meaning: "لقد ولدت قائداً، تملك قوة وحكمة ملك." },
    { name: "النمر الأسود", meaning: "أنت غامض وقوي، مثل النمر الذي نادراً ما يُرى لكنه دائماً يقظ." },
    { name: "الحصان الذهبي", meaning: "أنت ثمين وقوي، مستعد للركض نحو النجاح." },
    { name: "النسر الأزرق", meaning: "لديك رؤية حادة وتستطيع رؤية الفرص من بعيد." },
    { name: "التنين الملون", meaning: "أنت قوي ولديك القدرة على الحماية والهجوم." },
    { name: "الفيل الأبيض", meaning: "أنت حكيم وقوي، رمز الشجاعة والثبات." },
    { name: "الثور المقدس", meaning: "أنت قوي ومليء بالحماس، لا تخشى مواجهة العقبات." },
    { name: "المروحة", meaning: "دائماً تعطي نسيمًا منعشًا" },
    { name: "طباخ الأرز", meaning: "دائماً يطبخ الأرز بإتقان" },
    { name: "الدراجة النارية", meaning: "دائماً رشيق في الطرقات" },
    { name: "الشبشب", meaning: "دائماً هادئ ومريح" },
    { name: "الوسادة", meaning: "دائماً مريح في الأحضان" },
    { name: "كلب الصيد", meaning: "أنت مخلص ومتفانٍ، دائماً تجد الطريق نحو هدفك." }
]
function getRandomKhodam() {
    const idx = Math.floor(Math.random() * KHODAMS.length)
    return KHODAMS[idx]
}
function handler(m, { sock }) {
    let targetJid = m.sender
    let targetName = m.pushName || m.sender.split('@')[0]
    if (m.quoted) {
        targetJid = m.quoted.sender
        targetName = m.quoted.pushName || targetJid.split('@')[0]
    } else if (m.mentionedJid?.[0]) {
        targetJid = m.mentionedJid[0]
        targetName = targetJid.split('@')[0]
    } else if(m.text) {
        targetName = m.text
    }
    const khodam = getRandomKhodam()
    let txt = `مرحباً ${targetName || ""}، خادمك هو ${khodam.name}، هذا الخادم يعني: ${khodam.meaning}`
    const tts = new gtts(txt, 'ar')
    const id = Date.now()
    const tempPath = path.join(process.cwd(), 'temp', `khodam-${id}.mp3`)
    tts.save(tempPath, async function (err) {
        if (err) return console.log(err)
        await sock.sendMedia(m.chat, fs.readFileSync(tempPath), null, m, { type: 'audio' })
        try {
            fs.unlinkSync(tempPath)
        } catch (error) {
        }
    })
}
export { pluginConfig as config, handler }