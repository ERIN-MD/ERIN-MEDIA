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
    name: "زوجي",
    alias: ["husband"],
    category: "fun",
    description: "👳‍♂️ يعرض زوجك (للزوجات فقط)",
    usage: ".زوجي",
    example: ".زوجي",
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
    const sender = m.sender;
    const botName = "المأذون";

    if (!m.isGroup) {
        return m.reply("❌ هذا الأمر يعمل داخل المجموعات فقط.");
    }

    // البحث عن الزوج بطريقتين: من قاعدة البيانات ومن ملف الزواج
    let senderData = db.getUser(sender) || {};
    let husband = null;

    // الطريقة الأولى: من قاعدة البيانات العامة
    if (senderData.fun?.pasangan) {
        husband = senderData.fun.pasangan;
    }

    // الطريقة الثانية: من ملف الزواج المنفصل
    if (!husband) {
        const marriage = loadMarriage();
        for (let groom in marriage) {
            if (marriage[groom].includes(sender)) {
                husband = groom;
                break;
            }
        }
    }

    if (!husband) {
        return m.reply(
            `╭── 💔 زوجي ──╮\n\n` +
            `❌ أنتِ لستِ متزوجة حالياً\n\n` +
            `✍️ ${botName} 🤖\n` +
            `╰──────────╯`
        );
    }

    await sock.sendMessage(m.chat, {
        text: `╭── 💍 زوجك ──╮\n\n` +
            `👰‍♀️ الزوجة: @${sender.split("@")[0]}\n` +
            `👳‍♂️ الزوج: @${husband.split("@")[0]}\n\n` +
            `✍️ المأذون: ${botName} 🤖\n` +
            `╰──────────╯`,
        mentions: [sender, husband]
    }, { quoted: m });

    await m.react("💍");
}

export { pluginConfig as config, handler };