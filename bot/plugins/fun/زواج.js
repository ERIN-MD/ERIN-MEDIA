import fs from "fs";
import path from "path";
import { getDatabase } from "../../src/lib/maro-database.js";
import config from "../../config.js";

const IMAGE = "https://files.catbox.moe/kvtkjq.jpg";
const BOT_NAME = "💍 مأذون القروب الرسمي";

if (!global.marriageSessions) global.marriageSessions = {};

const pluginConfig = {
    name: "زواج",
    alias: ["marry"],
    category: "fun",
    description: "💍 زواج عضوين في القروب بطريقة تفاعلية مع اختيار دور الزوج/الزوجة",
    usage: ".زواج @شخص",
    example: ".زواج @شخص",
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 30,
    energi: 2,
    isEnabled: true
};

const romanticQuotes = [
    "الحب الحقيقي لا يعرف المسافات 💕",
    "قلبان متحدان لا يفترقان 💗",
    "أنتما مثل قطع البازل المثالية 🧩",
    "تطابق صُنع في الجنة! ✨",
    "الكيمياء بينكما قوية جداً! 🔥",
    "أنتما مثال الثنائي المثالي 💑",
    "القدر جمعكما معاً 🌟",
    "تم اكتشاف تطابق مثالي! 💘",
    "مبروك عليكم 🎊",
    "زغرتوا يا جماعة 🎉😂",
];

async function handler(m, { sock }) {
    const db = getDatabase();
    const isGroup = m.isGroup;

    if (!isGroup)
        return m.reply("❌ الزواج يتم داخل المجموعات فقط يا عريس 😏");

    const mentioned = m.mentionedJid || [];
    const replied = m.quoted?.sender;

    const target = mentioned[0] || replied;

    if (!target)
        return m.reply("💍 منشن الشخص أو رد عليه عشان نبدأ كتب الكتاب 😉");

    if (target === m.sender)
        return m.reply("😂 هتتجوز نفسك؟ طيب المعازيم فين؟");

    if (target === m.botNumber)
        return m.reply("🤖 البوت مأذون مش عريس!");

    // التحقق من قاعدة البيانات
    let senderData = db.getUser(m.sender) || {};
    let targetData = db.getUser(target) || {};

    if (!senderData.fun) senderData.fun = {};
    if (!targetData.fun) targetData.fun = {};

    // التحقق من أن الهدف مش متزوج
    if (targetData.fun.pasangan) {
        return m.reply(
            `🚫 الشخص ده متجوز/مرتبط بالفعل 😅\n` +
            `@${target.split("@")[0]} مع @${targetData.fun.pasangan.split("@")[0]}`,
            { mentions: [target, targetData.fun.pasangan] }
        );
    }

    // التحقق من تعدد الزوجات (4 كحد أقصى)
    if (senderData.fun.pasanganArray && senderData.fun.pasanganArray.length >= 4)
        return m.reply("🚫 عندك 4 زوجات خلاص يا نجم 😎");

    // بدء جلسة الزواج - اختيار الدور
    await chooseRole(m, sock, m.sender, target);
}

async function chooseRole(m, sock, sender, target) {
    let txt = `╭━━━ 💍✨ بداية مراسم الزواج ✨💍━━━╮\n\n` +
        `اليوم عندنا مناسبة سعيدة 🎉\n` +
        `@${sender.split("@")[0]} قرر يدخل القفص الذهبي 😌\n\n` +
        `👰 الطرف الثاني:\n` +
        `@${target.split("@")[0]}\n\n` +
        `قبل ما نكتب العقد…\n` +
        `مين هيكون الزوج؟ 🤔\n\n` +
        `╰━━━━━━━━━━━━━━━━━━━━╯`;

    // تخزين الجلسة
    global.marriageSessions[`${m.chat}_${sender}`] = {
        sender,
        target,
        chat: m.chat,
        timestamp: Date.now(),
        step: "choose_role"
    };

    await sock.sendMessage(m.chat, {
        image: { url: IMAGE },
        caption: txt,
        mentions: [sender, target]
    }, { quoted: m });

    await m.reply(
        `اختر دورك:\n` +
        `*.انا_الزوج* 🤵\n` +
        `*.انا_الزوجة* 👰`
    );
}

// ============ معالج الردود ============
async function replyHandler(m, sock) {
    if (!m.body) return false;

    const text = m.body.trim().toLowerCase();
    const sender = m.sender;

    // البحث عن جلسة زواج نشطة
    const sessionKey = Object.keys(global.marriageSessions || {}).find(
        key => {
            const s = global.marriageSessions[key];
            return s.chat === m.chat && s.timestamp && (Date.now() - s.timestamp < 300000);
        }
    );

    if (!sessionKey) return false;

    const session = global.marriageSessions[sessionKey];

    // ========== اختيار الزوج ==========
    if (text === "انا_الزوج" && session.step === "choose_role") {
        if (sender !== session.sender) return false;

        const husband = sender;
        const wife = session.target;

        session.husband = husband;
        session.wife = wife;
        session.step = "khutbah";

        global.marriageSessions[sessionKey] = session;

        await sendKhutbah(m, sock, husband, wife);
        return true;
    }

    // ========== اختيار الزوجة ==========
    if (text === "انا_الزوجة" && session.step === "choose_role") {
        if (sender !== session.sender) return false;

        const husband = session.target;
        const wife = sender;

        session.husband = husband;
        session.wife = wife;
        session.step = "khutbah";

        global.marriageSessions[sessionKey] = session;

        await sendKhutbah(m, sock, husband, wife);
        return true;
    }

    // ========== قبول الزواج (العروسة فقط) ==========
    if ((text === "قبل_الزواج" || text === "قبول_الزواج") && session.step === "khutbah") {
        if (sender !== session.wife) return false;

        delete global.marriageSessions[sessionKey];
        await confirmMarriage(m, sock, session.husband, session.wife);
        return true;
    }

    // ========== رفض الزواج (العروسة فقط) ==========
    if ((text === "رفض_الزواج") && session.step === "khutbah") {
        if (sender !== session.wife) return false;

        delete global.marriageSessions[sessionKey];
        await rejectMarriage(m, sock, session.husband, session.wife);
        return true;
    }

    return false;
}

async function sendKhutbah(m, sock, husband, wife) {
    const db = getDatabase();

    // التحقق من قاعدة البيانات
    let husbandData = db.getUser(husband) || {};
    let wifeData = db.getUser(wife) || {};

    if (!husbandData.fun) husbandData.fun = {};
    if (!wifeData.fun) wifeData.fun = {};

    // التحقق من تعدد الزوجات
    if (husbandData.fun.pasanganArray && husbandData.fun.pasanganArray.length >= 4)
        return m.reply("🚫 الزوج ده مكمل النصاب القانوني 😅");

    if (wifeData.fun.pasangan)
        return m.reply("🚫 العروسة دي محجوزة بالفعل 💍");

    const khutbah = `╭━━━ 💍✨ خطبة النكاح الرسمية ✨💍━━━╮\n\n` +
        `الحمد لله الذي خلق الأزواج أزواجًا،\n` +
        `وجعل بين القلوب سكنًا ورحمة ❤️\n\n` +
        `اليوم نشهد جميعًا على هذا الجمع المبارك بين:\n\n` +
        `🤵 @${husband.split("@")[0]}\n` +
        `و\n` +
        `👰 @${wife.split("@")[0]}\n\n` +
        `يا عروس 👰\n` +
        `هذا عريس تقدم إليكِ راغبًا في الحلال،\n` +
        `متعهدًا بالحب والاهتمام والاهتمام بالطلبات 😏\n\n` +
        `هل تقبلين به زوجًا لكِ\n` +
        `على سنة الله ورسوله\n` +
        `وتحت إشراف ${BOT_NAME} ؟ 💍\n\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

    await sock.sendMessage(m.chat, {
        image: { url: IMAGE },
        caption: khutbah,
        mentions: [husband, wife]
    }, { quoted: m });

    await m.reply(
        `على العروسة @${wife.split("@")[0]} الرد:\n` +
        `*.قبل_الزواج* 💖\n` +
        `*.رفض_الزواج* 💔`,
        { mentions: [wife] }
    );
}

async function confirmMarriage(m, sock, husband, wife) {
    const db = getDatabase();

    let husbandData = db.getUser(husband) || {};
    let wifeData = db.getUser(wife) || {};

    if (!husbandData.fun) husbandData.fun = {};
    if (!wifeData.fun) wifeData.fun = {};

    // مصفوفة الزوجات
    if (!husbandData.fun.pasanganArray) husbandData.fun.pasanganArray = [];
    husbandData.fun.pasanganArray.push(wife);
    husbandData.fun.pasangan = wife;
    husbandData.fun.jadiPacar = Date.now();

    wifeData.fun.pasangan = husband;
    wifeData.fun.jadiPacar = Date.now();

    db.setUser(husband, husbandData);
    db.setUser(wife, wifeData);

    const ranks = ["الأولى", "الثانية", "الثالثة", "الرابعة"];
    const wifeRank = ranks[husbandData.fun.pasanganArray.length - 1] || "الأولى";
    const mahr = Math.floor(Math.random() * 5000) + 2000;
    const quote = romanticQuotes[Math.floor(Math.random() * romanticQuotes.length)];

    await m.react("💍");

    await m.reply(
        `╭━━━ 🎉💍 تم عقد القران بنجاح 💍🎉━━━╮\n\n` +
        `🤵 الزوج: @${husband.split("@")[0]}\n` +
        `👰 الزوجة: @${wife.split("@")[0]}\n\n` +
        `💎 ترتيب الزوجة: ${wifeRank}\n` +
        `💰 المهر: ${mahr} جنيه\n\n` +
        `"${quote}"\n\n` +
        `مبروك عليكم 🎊\n` +
        `يلا يا جماعة زغرطوا 🎉😂\n\n` +
        `✍️ بإشراف ${BOT_NAME}\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━╯`,
        { mentions: [husband, wife] }
    );
}

async function rejectMarriage(m, sock, husband, wife) {
    await m.react("💔");

    await m.reply(
        `╭━━━ 💔 تم رفض الطلب 💔━━━╮\n\n` +
        `👰 @${wife.split("@")[0]}\n` +
        `قالت: لا 😅\n\n` +
        `🤵 @${husband.split("@")[0]}\n` +
        `شد حيلك وجرب تاني 😂\n\n` +
        `✍️ ${BOT_NAME}\n` +
        `╰━━━━━━━━━━━━━━╯`,
        { mentions: [husband, wife] }
    );
}

export { pluginConfig as config, handler, replyHandler };