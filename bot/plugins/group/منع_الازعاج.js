import te from "../../src/lib/maro-error.js"

const pluginConfig = {
    name: "منع_الازعاج",
    alias: ["antispam"],
    category: "group",
    description: "حماية المجموعة من الرسائل المزعجة المتكررة",
    usage: ".منع_الازعاج <تشغيل/إيقاف/إجراء/تأخير>",
    example: ".منع_الازعاج تشغيل\n.منع_الازعاج تحذير\n.منع_الازعاج 2",
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isAdmin: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const spamTracker = new Map()

async function handler(m, { sock, db }) {
    const args = m.args
    const action = args[0]?.toLowerCase()
    const delayMatch = action?.match(/^(\d+)(s|ms)?$/)
    
    if (!action || (!["تشغيل", "ايقاف", "تحذير", "طرد", "حذف"].includes(action) && !delayMatch)) {
        return m.reply(
            `🛡️ *منع الإزعاج*\n\n` +
            `هذه الميزة تحمي المجموعة من الأعضاء الذين يرسلون رسائل متكررة بسرعة كبيرة مما يزعج الآخرين\n\n` +
            `*الاستخدام:*\n` +
            `> \`${m.prefix}منع_الازعاج تشغيل\` (تفعيل)\n` +
            `> \`${m.prefix}منع_الازعاج إيقاف\` (تعطيل)\n\n` +
            `*اختر طريقة العقاب:*\n` +
            `> \`${m.prefix}منع_الازعاج تحذير\` (تحذير حتى 3 مرات)\n` +
            `> \`${m.prefix}منع_الازعاج طرد\` (طرد تلقائي)\n` +
            `> \`${m.prefix}منع_الازعاج حذف\` (حذف الرسائل المزعجة)\n\n` +
            `*ضبط الحساسية:*\n` +
            `> \`${m.prefix}منع_الازعاج 2\` (تعيين الحد الأقصى للفارق بين الرسائل 2 ثانية)\n` +
            `> \`${m.prefix}منع_الازعاج 1500\` (تعيينه إلى 1500 مللي ثانية)`
        )
    }

    const groupData = db.getGroup(m.chat) || {}
    
    if (delayMatch) {
        let delayMs = parseInt(delayMatch[1])
        if (delayMatch[2] === "s" || (delayMs >= 1 && delayMs <= 10)) { delayMs = delayMs * 1000 }
        if (delayMs < 500) delayMs = 500
        if (delayMs > 10000) delayMs = 10000
        
        groupData.antispamDelay = delayMs
        db.setGroup(m.chat, groupData)
        
        return m.reply(
            `🛡️ *تم تحديث حساسية منع الإزعاج*\n\n` +
            `> الحد الأقصى للفارق: *${delayMs} مللي ثانية* (${(delayMs/1000).toFixed(1)} ثانية)\n\n` +
            `سيتم اعتبار الرسائل كإزعاج إذا أرسل العضو عدة رسائل بفارق أقل من *${(delayMs/1000).toFixed(1)} ثانية* بينها`
        )
    }

    if (action === "تشغيل" || action === "on") {
        if (groupData.antispam === true) { return m.reply(`✅ ميزة منع الإزعاج مفعلة بالفعل، لا تغيير`); }
        groupData.antispam = true; db.setGroup(m.chat, groupData);
        await m.reply(`🛡️ *تم تحديث منع الإزعاج*\n\n> الحالة: *مفعل ✅*\n\nسيراقب البوت الآن أي نشاط إزعاج أو رسائل متكررة من الأعضاء`);
    } else if (action === "ايقاف" || action === "off") {
        if (groupData.antispam === false) { return m.reply(`✅ ميزة منع الإزعاج معطلة بالفعل، لا تغيير`); }
        groupData.antispam = false; db.setGroup(m.chat, groupData);
        await m.reply(`🛡️ *تم تحديث منع الإزعاج*\n\n> الحالة: *معطل ❌*\n\nسيتوقف البوت عن مراقبة نشاط الإزعاج`);
    } else {
        groupData.antispamAction = action === "تحذير" ? "warning" : action === "طرد" ? "kick" : action === "حذف" ? "delete" : action;
        db.setGroup(m.chat, groupData);
        
        let textAction = "";
        if (action === "تحذير") textAction = "توجيه تحذيرات تدريجية";
        if (action === "طرد") textAction = "طرد العضو تلقائياً";
        if (action === "حذف") textAction = "حذف الرسائل المزعجة";
        
        await m.reply(`🛡️ *تم تحديث إجراء منع الإزعاج*\n\n> طريقة العقاب: *${action === "تحذير" ? "تحذير" : action === "طرد" ? "طرد" : "حذف"}*\n\nسيتخذ البوت إجراء *${textAction}* عند اكتشاف إزعاج`);
    }
}

async function checkSpam(m, sock, db) {
    if (!m.isGroup || m.isAdmin || m.isOwner || m.fromMe) return false
    const groupData = db.getGroup(m.chat)
    if (!groupData || !groupData.antispam) return false
    const senderId = m.sender; const chatKey = `${m.chat}_${senderId}`; const now = Date.now()
    const delayThreshold = groupData.antispamDelay || 2000
    const userData = spamTracker.get(chatKey) || { count: 0, lastMessage: 0, warnings: 0 }
    if (now - userData.lastMessage < delayThreshold) { userData.count += 1 }
    else { if (now - userData.lastMessage > delayThreshold + 1000) { userData.count = 1 } else { userData.count = Math.max(1, userData.count - 1) } }
    userData.lastMessage = now; spamTracker.set(chatKey, userData)
    if (userData.count >= 5) { return true }
    return false
}

async function handleSpamAction(m, sock, db) {
    const groupData = db.getGroup(m.chat)
    const action = groupData.antispamAction || "warning"
    const senderId = m.sender; const chatKey = `${m.chat}_${senderId}`
    const userData = spamTracker.get(chatKey)

    if (action === "warning") {
        userData.warnings += 1; spamTracker.set(chatKey, userData)
        if (userData.warnings >= 3) {
            await m.reply(`⚠️ *الحد الأقصى للتحذيرات*\n\n> إلى: @${senderId.split("@")[0]}\n\nلقد تلقيت 3 تحذيرات بسبب الإزعاج المستمر. يرجى التوقف فوراً!`, { mentions: [senderId] });
            userData.warnings = 0; userData.count = 0; spamTracker.set(chatKey, userData);
        } else {
            await m.reply(`⚠️ *تم اكتشاف إزعاج*\n\n> التحذير رقم ${userData.warnings} من 3\n\nمرحباً @${senderId.split("@")[0]}، رجاءً توقف عن إرسال الرسائل المتكررة بسرعة!`, { mentions: [senderId] });
            userData.count = 0; spamTracker.set(chatKey, userData);
        }
    } else if (action === "kick") {
        if (m.isBotAdmin) {
            await m.reply(`🛑 *تم طرد مزعج*\n\nعذراً @${senderId.split("@")[0]}، سيتم طردك بسبب الإزعاج!`, { mentions: [senderId] });
            await sock.groupParticipantsUpdate(m.chat, [senderId], "remove");
            spamTracker.delete(chatKey);
        } else {
            await m.reply(`⚠️ *تم اكتشاف إزعاج*\n\nتم اكتشاف إزعاج من @${senderId.split("@")[0]}، لكن البوت ليس مشرفاً ليطرده. اجعل البوت مشرفاً ليعمل بشكل كامل`, { mentions: [senderId] });
            userData.count = 0; spamTracker.set(chatKey, userData);
        }
    } else if (action === "delete") {
        if (m.isBotAdmin) { await sock.sendMessage(m.chat, { delete: m.key }); }
        else { userData.count = 0; spamTracker.set(chatKey, userData); }
    }
}

export { pluginConfig as config, handler, checkSpam, handleSpamAction }