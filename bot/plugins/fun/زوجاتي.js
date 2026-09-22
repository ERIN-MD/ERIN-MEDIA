import fs from "fs";
import path from "path";
import { getDatabase } from "../../src/lib/maro-database.js";

const DB_PATH = path.join(process.cwd(), "data", "marriage.json");
const BOT_NAME = "💍 مأذون القروب الرسمي";

const loadDB = () => JSON.parse(fs.readFileSync(DB_PATH));

const pluginConfig = {
    name: "زوجاتي",
    alias: ["mywives"],
    category: "fun",
    description: "👰 يعرض قائمة زوجاتك (للأزواج فقط)",
    usage: ".زوجاتي",
    example: ".زوجاتي",
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

    if (!m.isGroup) {
        return m.reply("❌ الأمر يعمل داخل المجموعات فقط.");
    }

    const husband = m.sender;
    let wives = [];

    // الطريقة الأولى: من قاعدة البيانات العامة
    let husbandData = db.getUser(husband) || {};
    if (husbandData.fun?.pasanganArray && husbandData.fun.pasanganArray.length > 0) {
        wives = husbandData.fun.pasanganArray;
    }

    // الطريقة الثانية: من ملف الزواج المنفصل
    if (wives.length === 0) {
        try {
            const marriageData = loadDB();
            if (marriageData[husband] && marriageData[husband].length > 0) {
                wives = marriageData[husband];
            }
        } catch (e) {}
    }

    // التحقق إذا كان الشخص زوجة وليس زوجاً
    if (wives.length === 0) {
        // نتحقق إذا كان الشخص زوجة لشخص آخر
        let isWife = false;
        
        // من قاعدة البيانات
        if (husbandData.fun?.pasangan && !husbandData.fun?.pasanganArray) {
            isWife = true;
        }
        
        // من ملف الزواج
        if (!isWife) {
            try {
                const marriageData = loadDB();
                for (let groom in marriageData) {
                    if (marriageData[groom].includes(husband)) {
                        isWife = true;
                        break;
                    }
                }
            } catch (e) {}
        }

        if (isWife) {
            return m.reply("👰 هذا الأمر للأزواج فقط! أنتِ زوجة وليس لديك زوجات.\n\nجربي استخدام *.زوجي* لمعرفة زوجك.");
        }
        
        return m.reply("💔 لا تملك أي زوجات حالياً.");
    }

    let text = `💍 ════『 زوجاتك 』════ 💍\n\n`;

    wives.forEach((wife, i) => {
        text += `👰 ${i + 1}- @${wife.split("@")[0]}\n`;
    });

    text += `\n🤵‍♂️ العدد الكلي: ${wives.length}\n`;
    text += `════════════════════\n`;
    text += `${BOT_NAME}`;

    await sock.sendMessage(m.chat, {
        text,
        mentions: wives
    });

    await m.react("💍");
}

export { pluginConfig as config, handler };