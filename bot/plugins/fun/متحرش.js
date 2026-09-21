import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const flirtPath = path.join(dataDir, "flirtbot.json");
const handled = new Set();

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(flirtPath)) fs.writeFileSync(flirtPath, JSON.stringify({}, null, 2));

const flirtMap = {
    "سلام": "وعليكم السلام يا بعد قلبي 😚",
    "اه": "موووح 😘 شو فيك؟ 😳",
    "احبك": "يا عمريي 😳 انا بعد احبك 🥰",
    "تحبني": "أكيد يا حبيبي 😍 وبموت فيك 🫣",
    "تعال": "جايتك ركض 😘 وينك انت؟ 😌",
    "وينك": "هنا يا قلبي، اشتقت لي؟ 🥺",
    "اشتقت": "وأنا أكثر يا روحي 😢💋",
    "صباح الخير": "صباحك عسل يا سكر 🍯💞",
    "مساء الخير": "مساء الحب والورد والقبل 😚🌹",
    "كفو": "وانت الأكفأ يا قلبي 😘",
    "غبي": "بس بحبك رغم غبائك 😝💞",
    "وحشتني": "أكثر مما تتخيل 🥺❤️",
    "قمر": "قمر بس لما تشوفك ☺️🌙",
    "قلبي": "قلبي يدق باسمك 😳❤️",
    "حضن": "تعال ضمني بقووة 🥺 أريد دفئك",
    "شوق": "شوقي ذابحني عليك 🥺 متى أشوفك؟",
};

const pluginConfig = {
    name: "متحرش",
    alias: ["flirt"],
    category: "fun",
    description: "بوت يرد بأسلوب بنت دلّوعة 😘 (يمكن تشغيله أو إيقافه)",
    usage: ".متحرش <اون/اوف>",
    example: ".متحرش اون",
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true,
};

async function handler(m) {
    const config = JSON.parse(fs.readFileSync(flirtPath));
    const isOn = config[m.chat] === true;

    const args = m.args || [];
    const action = args[0]?.toLowerCase();

    if (action === "اون" || action === "on") {
        if (isOn) return m.reply("💋 المتحرشة شغّالة أصلاً يا حلو 😉");
        config[m.chat] = true;
        fs.writeFileSync(flirtPath, JSON.stringify(config, null, 2));
        return m.reply("😈 تم تفعيل *البنت المتحرشة* 😘");
    } else if (action === "اوف" || action === "off") {
        if (!isOn) return m.reply("🚫 المتحرشة متوقفة أصلاً 😅");
        delete config[m.chat];
        fs.writeFileSync(flirtPath, JSON.stringify(config, null, 2));
        return m.reply("💤 تم إيقاف وضع *البنت المتحرشة* 😌");
    } else {
        return m.reply(`💘 أوامر المتحرشة:\n${m.prefix}متحرش اون ➜ تشغيل\n${m.prefix}متحرش اوف ➜ إيقاف`);
    }
}

async function checkFlirt(m) {
    if (!m.isGroup) return false;
    const config = JSON.parse(fs.readFileSync(flirtPath));
    if (!config[m.chat]) return false;

    const text = m.body?.toLowerCase()?.trim();
    if (!text) return false;

    const messageId = m.key?.id || `${m.sender}:${text}`;
    if (handled.has(messageId)) return false;
    handled.add(messageId);
    setTimeout(() => handled.delete(messageId), 8000);

    const found = Object.keys(flirtMap).find((k) => text.includes(k));
    if (found) {
        await m.reply(flirtMap[found]);
        return true;
    }
    return false;
}

export { pluginConfig as config, handler, checkFlirt };