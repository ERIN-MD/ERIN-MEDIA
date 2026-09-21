import fs from "fs";
import path from "path";
import { getDatabase } from "../../src/lib/maro-database.js";

const DB_PATH = path.join(process.cwd(), "data", "marriage.json");
const BOT_NAME = "💍 مأذون القروب الرسمي";

const loadDB = () => JSON.parse(fs.readFileSync(DB_PATH));
const saveDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

if (!global.divorceSessions) global.divorceSessions = {};

const pluginConfig = {
    name: "طلاق",
    alias: ["divorce"],
    category: "fun",
    description: "💔 طلاق زوجة من زوجاتك",
    usage: ".طلاق @الزوجة",
    example: ".طلاق @الزوجة",
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 60,
    energi: 0,
    isEnabled: true
};

async function handler(m, { sock }) {
    const db = getDatabase();

    if (!m.isGroup) {
        return m.reply("❌ الطلاق متاح داخل المجموعات فقط.");
    }

    const mentioned = m.mentionedJid || [];

    if (!mentioned[0]) {
        return m.reply("❌ منشن الزوجة التي تريد طلاقها.");
    }

    const husband = m.sender;
    const wife = mentioned[0];

    if (wife === husband) {
        return m.reply("❌ لا يمكنك طلاق نفسك!");
    }

    let found = false;

    // التحقق من قاعدة البيانات العامة
    let husbandData = db.getUser(husband) || {};
    if (husbandData.fun?.pasanganArray && husbandData.fun.pasanganArray.includes(wife)) {
        found = true;
    }

    // التحقق من ملف الزواج المنفصل
    if (!found) {
        const marriageData = loadDB();
        if (marriageData[husband] && marriageData[husband].includes(wife)) {
            found = true;
        }
    }

    if (!found) {
        return m.reply("❌ لا يوجد عقد زواج بينكما أصلاً!");
    }

    // تخزين جلسة الطلاق
    const sessionKey = `${m.chat}_${husband}_${wife}`;
    global.divorceSessions[sessionKey] = {
        husband,
        wife,
        chat: m.chat,
        timestamp: Date.now()
    };

    // إرسال طلب تأكيد الطلاق
    let txt = `💔 طلب طلاق رسمي\n\n` +
        `👳‍♂️ الزوج: @${husband.split("@")[0]}\n` +
        `👰 الزوجة: @${wife.split("@")[0]}\n\n` +
        `هل توافقان على الطلاق؟\n\n` +
        `يرجى من الطرفين كتابة:\n` +
        `*.موافقة_طلاق* للموافقة\n` +
        `*.رفض_طلاق* للإلغاء`;

    await sock.sendMessage(m.chat, {
        text: txt,
        mentions: [husband, wife]
    }, { quoted: m });

    await m.react("💔");
}

async function replyHandler(m, sock) {
    if (!m.body) return false;

    const text = m.body.trim().toLowerCase();

    if (text !== "موافقة_طلاق" && text !== "رفض_طلاق") return false;

    // البحث عن جلسة طلاق نشطة
    const sessionKey = Object.keys(global.divorceSessions || {}).find(
        key => {
            const s = global.divorceSessions[key];
            return s.chat === m.chat && s.timestamp && (Date.now() - s.timestamp < 300000);
        }
    );

    if (!sessionKey) return false;

    const session = global.divorceSessions[sessionKey];
    const { husband, wife } = session;

    // التحقق من أن المستخدم طرف في الطلاق
    if (m.sender !== husband && m.sender !== wife) return false;

    if (text === "رفض_طلاق") {
        delete global.divorceSessions[sessionKey];
        await m.reply("💞 تم إلغاء الطلاق... فرصة جديدة للحب 😉");
        await m.react("💕");
        return true;
    }

    if (text === "موافقة_طلاق") {
        // تسجيل الموافقة
        if (!session.approved) session.approved = [];
        
        if (!session.approved.includes(m.sender)) {
            session.approved.push(m.sender);
        }

        // إذا وافق الطرفان
        if (session.approved.length >= 2) {
            delete global.divorceSessions[sessionKey];
            await confirmDivorce(m, sock, husband, wife);
            return true;
        } else {
            // في انتظار الطرف الآخر
            global.divorceSessions[sessionKey] = session;
            await m.reply(
                `✅ @${m.sender.split("@")[0]} وافق على الطلاق.\n` +
                `في انتظار موافقة الطرف الآخر...`,
                { mentions: [m.sender] }
            );
            return true;
        }
    }

    return false;
}

async function confirmDivorce(m, sock, husband, wife) {
    const db = getDatabase();

    // تحديث قاعدة البيانات العامة
    let husbandData = db.getUser(husband) || {};
    let wifeData = db.getUser(wife) || {};

    if (!husbandData.fun) husbandData.fun = {};
    if (!wifeData.fun) wifeData.fun = {};

    // إزالة الزوجة من قائمة زوجات الزوج
    if (husbandData.fun.pasanganArray) {
        husbandData.fun.pasanganArray = husbandData.fun.pasanganArray.filter(w => w !== wife);
        if (husbandData.fun.pasanganArray.length === 0) {
            delete husbandData.fun.pasangan;
            delete husbandData.fun.pasanganArray;
        } else {
            husbandData.fun.pasangan = husbandData.fun.pasanganArray[husbandData.fun.pasanganArray.length - 1];
        }
    }

    delete wifeData.fun.pasangan;
    delete wifeData.fun.pasanganArray;

    db.setUser(husband, husbandData);
    db.setUser(wife, wifeData);

    // تحديث ملف الزواج المنفصل
    const marriageData = loadDB();
    if (marriageData[husband]) {
        marriageData[husband] = marriageData[husband].filter(w => w !== wife);
        if (marriageData[husband].length === 0) {
            delete marriageData[husband];
        }
    }
    if (marriageData[wife]) {
        delete marriageData[wife];
    }
    saveDB(marriageData);

    const nafaqa = Math.floor(Math.random() * 10000) + 1000;

    await m.react("💔");

    await m.reply(
        `💔 تم الطلاق رسميًا\n\n` +
        `👳‍♂️ الزوج: @${husband.split("@")[0]}\n` +
        `👰 الزوجة: @${wife.split("@")[0]}\n\n` +
        `💸 النفقة: ${nafaqa} جنيه\n\n` +
        `نسأل الله العوض الجميل 🤲`,
        { mentions: [husband, wife] }
    );
}

export { pluginConfig as config, handler, replyHandler };