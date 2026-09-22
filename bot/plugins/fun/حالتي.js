import fs from "fs";
import path from "path";
import { getDatabase } from "../../src/lib/maro-database.js";

const marriageFile = path.join(process.cwd(), "data", "marriage.json");

if (!fs.existsSync(marriageFile)) {
  fs.mkdirSync(path.dirname(marriageFile), { recursive: true });
  fs.writeFileSync(marriageFile, JSON.stringify({}, null, 2));
}

function loadMarriage() {
  return JSON.parse(fs.readFileSync(marriageFile));
}

const pluginConfig = {
    name: "حالتي",
    alias: ["حالتي_الزواج"],
    category: "fun",
    description: "📊 يعرض حالتك الاجتماعية",
    usage: ".حالتي",
    example: ".حالتي",
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

async function handler(m, { sock }) {
    const db = getDatabase();
    const botName = "المأذون";

    if (!m.isGroup) {
        return m.reply("❌ هذا الأمر يعمل داخل المجموعات فقط.");
    }

    const sender = m.sender;
    let senderData = db.getUser(sender) || {};
    let mentions = [sender];
    let statusText = "";

    // نجمع البيانات من المصدرين
    let isHusband = false;
    let isWife = false;
    let wives = [];
    let husband = null;

    // من قاعدة البيانات العامة
    if (senderData.fun?.pasanganArray && senderData.fun.pasanganArray.length > 0) {
        isHusband = true;
        wives = senderData.fun.pasanganArray;
    } else if (senderData.fun?.pasangan) {
        isWife = true;
        husband = senderData.fun.pasangan;
    }

    // من ملف الزواج المنفصل
    const marriage = loadMarriage();
    
    if (!isHusband && marriage[sender] && marriage[sender].length > 0) {
        isHusband = true;
        wives = marriage[sender];
    }
    
    if (!isWife) {
        for (let groom in marriage) {
            if (marriage[groom].includes(sender)) {
                isWife = true;
                husband = groom;
                break;
            }
        }
    }

    // بناء النص حسب الحالة
    if (isHusband) {
        statusText = `👳‍♂️ الحالة: متزوج\n` +
            `👰‍♀️ عدد الزوجات: ${wives.length}/4`;
        mentions = [...mentions, ...wives];
    } else if (isWife) {
        statusText = `👰‍♀️ الحالة: متزوجة\n` +
            `👳‍♂️ الزوج: @${husband.split("@")[0]}`;
        mentions.push(husband);
    } else {
        statusText = `💔 الحالة: أعزب / عزباء`;
    }

    await sock.sendMessage(m.chat, {
        text: `╭── 📊 حالتك ──╮\n\n` +
            `👤 المستخدم: @${sender.split("@")[0]}\n\n` +
            `${statusText}\n\n` +
            `✍️ بإشراف ${botName} 🤖\n` +
            `╰──────────────╯`,
        mentions: mentions
    }, { quoted: m });

    await m.react("📊");
}

export { pluginConfig as config, handler };