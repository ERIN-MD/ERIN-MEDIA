import axios from "axios";
import config from "../../config.js";
import te from "../../src/lib/maro-error.js";
import { getDatabase } from "../../src/lib/maro-database.js";

const NEOXR_APIKEY = config.APIkey?.neoxr || "Milik-Bot-OurinMD";

const pluginConfig = {
    name: "شخصية",
    alias: ["cai", "charai", "character", "شخصيه"],
    category: "ai",
    description: "بحث عن شخصية AI وتفعيلها للمحادثة التلقائية",
    usage: ".شخصية بحث <اسم> | .شخصية ايقاف | .شخصية مسح",
    example: ".شخصية بحث غوجو",
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true,
};

async function handler(m, { sock, args, text }) {
    if (!args || args.length === 0) {
        return m.reply(`🤖 *الشخصيات الذكية*\n\n` +
            `استخدم الأوامر التالية:\n` +
            `> *.شخصية بحث <اسم>* (بحث عن شخصية)\n` +
            `> *.شخصية ايقاف* (إيقاف الذكاء التلقائي)\n` +
            `> *.شخصية مسح* (مسح ذاكرة المحادثة)\n\n` +
            `*مثال:* .شخصية بحث غوجو`);
    }

    const cmd = args[0].toLowerCase();

    if (cmd === "بحث") {
        const query = args.slice(1).join(" ");
        if (!query) return m.reply(`اكتب اسم الشخصية اللي عايز تدور عليها!\nمثال: .شخصية بحث غوجو`);

        await m.react("🕕");
        try {
            const searchUrl = `https://api.neoxr.eu/api/cai-search?q=${encodeURIComponent(query)}&apikey=${NEOXR_APIKEY}`;
            const response = await axios.get(searchUrl, { timeout: 30000 });
            const resData = response.data;

            if (!resData || !resData.status || !resData.data || resData.data.length === 0) {
                await m.react("❌");
                return m.reply(`الشخصية "${query}" غير موجودة.`);
            }

            const maxResults = Math.min(resData.data.length, 10);
            let listTxt = `🤖 *نتائج البحث عن: ${query.toUpperCase()}*\n\n`;
            listTxt += `اختر شخصية من القائمة:\n\n`;

            const searchResults = [];

            for (let i = 0; i < maxResults; i++) {
                const item = resData.data[i].document;
                searchResults.push({
                    character_id: item.character_id,
                    name: item.name,
                    title: item.title,
                    creator: item.creator_username,
                    is_nsfw: item.is_nsfw
                });
                const nsfwTag = item.is_nsfw ? " 🔞" : "";
                listTxt += `*${i + 1}.* ${item.name}${nsfwTag}\n`;
                listTxt += `> ${item.title}\n`;
                listTxt += `> 👤 بواسطة ${item.creator_username}\n\n`;
            }

            listTxt += `> 💡 *أرسل الرقم (مثال: 1)* للاختيار وتفعيل الشخصية، أو اكتب \`الغاء\` للإلغاء.`;

            const db = getDatabase();
            const user = db.getUser(m.sender);
            
            user.cai_search_session = {
                results: searchResults,
                time: Date.now()
            };
            db.save();

            await m.react("✅");
            await m.reply(listTxt);

        } catch (error) {
            console.error("[CAI Search Error]", error);
            await m.react("☢");
            m.reply(te(m.prefix, m.command, m.pushName));
        }
    } else if (cmd === "ايقاف") {
        const db = getDatabase();
        if (!db.db.data.characterai) db.db.data.characterai = {};
        
        if (db.db.data.characterai[m.chat]?.enabled) {
            delete db.db.data.characterai[m.chat];
            db.save();
            m.reply(`✅ *تم إيقاف الشخصية الذكية في هذه المحادثة.*`);
        } else {
            m.reply(`❌ لا توجد شخصية ذكية نشطة في هذه المحادثة.`);
        }
    } else if (cmd === "مسح") {
        const db = getDatabase();
        if (!db.db.data.characterai) db.db.data.characterai = {};
        
        const chatAi = db.db.data.characterai[m.chat];
        if (chatAi?.enabled) {
            chatAi.conversation_id = null;
            db.save();
            m.reply(`✅ *تم مسح ذاكرة المحادثة.*\n\nالشخصية "${chatAi.name}" الآن لا تتذكر المحادثات السابقة.`);
        } else {
            m.reply(`❌ لا توجد شخصية ذكية نشطة في هذه المحادثة.`);
        }
    } else {
        m.reply(`أمر غير صالح. استخدم: بحث, ايقاف, مسح`);
    }
}

async function caiAnswerHandler(m, sock) {
    if (!m.body || m.isCommand) return false;

    const db = getDatabase();
    const user = db.getUser(m.sender);

    if (!user || !user.cai_search_session) return false;

    const session = user.cai_search_session;
    const SESSION_TIMEOUT = 5 * 60 * 1000;
    
    if (Date.now() - session.time > SESSION_TIMEOUT) {
        delete user.cai_search_session;
        db.save();
        await m.reply(`⏰ *انتهت الجلسة*\n\nجلسة البحث عن الشخصية انتهت.`);
        return true;
    }

    const text = m.body.trim().toLowerCase();

    if (text === "الغاء" || text === "cancel") {
        delete user.cai_search_session;
        db.save();
        await m.reply(`🚪 تم إلغاء البحث عن الشخصية.`);
        return true;
    }

    const choice = parseInt(text);
    if (isNaN(choice) || choice < 1 || choice > session.results.length) {
        return false;
    }

    const selected = session.results[choice - 1];
    delete user.cai_search_session;
    
    if (!db.db.data.characterai) db.db.data.characterai = {};
    
    db.db.data.characterai[m.chat] = {
        enabled: true,
        character_id: selected.character_id,
        name: selected.name,
        is_nsfw: selected.is_nsfw,
        conversation_id: null,
        activatedAt: Date.now(),
        activatedBy: m.sender
    };
    db.save();

    await m.react("✅");
    const nsfwWarning = selected.is_nsfw ? "\n⚠️ *تحذير: هذه الشخصية مصنفة NSFW.*" : "";
    await m.reply(`🤖 *تم تفعيل الشخصية الذكية*\n\nتم اختيار *${selected.name}*! من الآن فصاعداً، سترد الشخصية على جميع الرسائل العادية في هذه المحادثة.\n\n> اكتب \`.شخصية ايقاف\` للإيقاف.${nsfwWarning}`);

    return true;
}

async function caiChatHandler(m, sock) {
    if (!m.body || m.isCommand) return false;

    const db = getDatabase();
    if (!db.db.data.characterai) return false;

    const chatAi = db.db.data.characterai[m.chat];
    if (!chatAi || !chatAi.enabled) return false;

    if (m.fromMe) return false;
    if (chatAi.isProcessing) return false;

    chatAi.isProcessing = true;
    
    try {
        let apiUrl = `https://api.neoxr.eu/api/cai?character_id=${chatAi.character_id}&message=${encodeURIComponent(m.body)}&apikey=${NEOXR_APIKEY}`;
        
        if (chatAi.conversation_id) {
            apiUrl += `&conversation_id=${encodeURIComponent(chatAi.conversation_id)}`;
        }

        const response = await axios.get(apiUrl, { timeout: 45000 });
        const resData = response.data;

        if (resData && resData.status && resData.data) {
            if (resData.data.conversation_id) {
                chatAi.conversation_id = resData.data.conversation_id;
                db.save();
            }

            let replyText = resData.data.content || "";
            if (resData.data.is_nsfw) {
                replyText = `🔞 [NSFW]\n` + replyText;
            }

            await m.reply(replyText);
        }
    } catch (error) {
        console.error("[CAI Chat Error]", error.message);
    } finally {
        chatAi.isProcessing = false;
    }

    return true;
}

export { pluginConfig as config, handler, caiAnswerHandler, caiChatHandler };
