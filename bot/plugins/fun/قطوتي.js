const pluginConfig = {
    name: 'قطوتي',
    alias: [],
    category: 'fun',
    description: '🐱 تحدي قول مياو وإلا طرد',
    usage: '.قطوتي @شخص',
    example: '.قطوتي @شخص',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 30,
    energi: 0,
    isEnabled: true,
    isBotAdmin: true
};

if (!global.kittySessions) global.kittySessions = {};

async function handler(m, { sock }) {
    if (!m.isGroup) return m.reply("❌ فقط للجروبات.");

    let target = m.mentionedJid?.[0];
    if (!target) return m.reply("❗ استخدم الأمر هكذا:\n\n.قطوتي @شخص");

    if (!target.includes("@")) target = target + "@s.whatsapp.net";

    if (target === m.botNumber) return m.reply("🐱 أنا القط مو لازم أقول مياو!");

    let time = 10;
    
    const sessionKey = `${m.chat}_${target}`;
    
    if (global.kittySessions[sessionKey]) {
        return m.reply(`⚠️ فيه تحدي شغال بالفعل على @${target.split("@")[0]}!`, { mentions: [target] });
    }

    global.kittySessions[sessionKey] = {
        escaped: false,
        target,
        chat: m.chat,
        timer: null
    };

    await m.reply(`🐱 @${target.split("@")[0]}\nعندك *${time} ثانية* تقول "مياو" ولا رح تنطرد!`, { mentions: [target] });

    global.kittySessions[sessionKey].timer = setInterval(async () => {
        const session = global.kittySessions[sessionKey];
        if (!session) {
            clearInterval(time);
            return;
        }

        if (session.escaped) {
            clearInterval(session.timer);
            delete global.kittySessions[sessionKey];
            return;
        }

        time--;

        if (time <= 0) {
            clearInterval(session.timer);
            delete global.kittySessions[sessionKey];

            try {
                await sock.groupParticipantsUpdate(m.chat, [target], "remove");
                await sock.sendMessage(m.chat, {
                    text: `🚫🐱 @${target.split("@")[0]} ما قال "مياو" وتم طرده.`,
                    mentions: [target]
                });
            } catch (e) {
                await sock.sendMessage(m.chat, {
                    text: `⚠️ حاولت أطلع @${target.split("@")[0]} لكن فشلت — تأكد أن البوت أدمن وصلاحياته كافية.`,
                    mentions: [target]
                });
            }
        } else if (time <= 3) {
            await sock.sendMessage(m.chat, {
                text: `🐱 @${target.split("@")[0]}\nتبقى *${time} ثواني* قول "مياو"! ⚠️`,
                mentions: [target]
            });
        }
    }, 1000);
}

async function replyHandler(m, sock) {
    if (!m.body) return false;

    const text = m.body.trim();
    if (text !== "مياو") return false;

    const sender = m.sender;
    const sessionKey = `${m.chat}_${sender}`;
    const session = global.kittySessions?.[sessionKey];

    if (!session) return false;

    session.escaped = true;
    clearInterval(session.timer);
    delete global.kittySessions[sessionKey];

    await m.reply(`😺✨ @${sender.split("@")[0]} قال "مياو" ونجا!`, { mentions: [sender] });
    await m.react('😺');

    return true;
}

export { pluginConfig as config, handler, replyHandler };