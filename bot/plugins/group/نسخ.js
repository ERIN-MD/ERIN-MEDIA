import fs from "fs";
import path from "path";
import axios from "axios";
import te from '../../src/lib/maro-error.js';

const SAVE_PATH = path.join(process.cwd(), "data", "group_copy.json");
const BACKUP_PATH = path.join(process.cwd(), "data", "group_backups");

if (!fs.existsSync(path.join(process.cwd(), "data"))) fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
if (!fs.existsSync(BACKUP_PATH)) fs.mkdirSync(BACKUP_PATH, { recursive: true });
if (!fs.existsSync(SAVE_PATH)) fs.writeFileSync(SAVE_PATH, JSON.stringify({}, null, 2));

function createBackup(data, groupId) {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(BACKUP_PATH, `${groupId}_${timestamp}.json`);
        fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
        return backupFile;
    } catch (err) { return null; }
}

async function getGroupInfo(sock, chatId) {
    let groupName = "", groupDesc = "", groupPhoto = null, participantCount = 0, owner = "";
    try {
        const metadata = await sock.groupMetadata(chatId);
        groupName = metadata.subject || "بدون اسم";
        groupDesc = metadata.desc || "لا يوجد وصف";
        participantCount = metadata.participants?.length || 0;
        owner = metadata.owner || "غير معروف";
    } catch (err) {}
    try { groupPhoto = await sock.profilePictureUrl(chatId, "image"); } catch { groupPhoto = null; }
    return { name: groupName, desc: groupDesc, photo: groupPhoto, participantCount, owner, chatId };
}

const pluginConfig = {
    name: "نسخ",
    alias: ["copy"],
    category: "group",
    description: "📋 نسخ ولصق إعدادات المجموعة (الاسم، الوصف، الصورة)",
    usage: ".نسخ أو .لصق",
    example: ".نسخ",
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
};

async function handler(m, { sock }) {
    const cmd = m.command?.toLowerCase();

    if (cmd === "نسخ" || cmd === "copy") {
        await m.react("📋");
        try {
            const groupInfo = await getGroupInfo(sock, m.chat);
            const backupFile = createBackup(groupInfo, m.chat.replace('@g.us', ''));
            const dataToSave = { name: groupInfo.name, desc: groupInfo.desc, photo: groupInfo.photo, copiedAt: new Date().toISOString(), copiedFrom: m.chat, backupFile: backupFile ? path.basename(backupFile) : null };
            fs.writeFileSync(SAVE_PATH, JSON.stringify(dataToSave, null, 2));

            await m.reply(
                `📦 *تم نسخ معلومات المجموعة*\n\n` +
                `📛 الاسم: ${groupInfo.name}\n` +
                `📝 الوصف: ${groupInfo.desc.substring(0, 50)}${groupInfo.desc.length > 50 ? '...' : ''}\n` +
                `🖼️ الصورة: ${groupInfo.photo ? '✅' : '❌'}\n` +
                `👥 الأعضاء: ${groupInfo.participantCount}`
            );
            await m.react("✅");
        } catch (err) {
            m.reply(te(m.prefix, m.command, m.pushName));
        }
    } else if (cmd === "لصق") {
        if (!m.isAdmin && !m.isOwner) return m.reply("❌ *للمشرفين فقط*");

        await m.react("📥");
        try {
            const data = JSON.parse(fs.readFileSync(SAVE_PATH));
            if (!data.name && !data.desc && !data.photo) return m.reply("⚠️ *لا يوجد شيء محفوظ*\nاستخدم .نسخ أولاً");

            let successCount = 0, failCount = 0;
            const results = [];

            if (data.name) {
                try { await sock.groupUpdateSubject(m.chat, data.name); results.push("✅ تم تغيير الاسم"); successCount++; }
                catch (err) { results.push(`❌ فشل الاسم: ${err.message}`); failCount++; }
            }
            if (data.desc && data.desc !== "لا يوجد وصف") {
                try { await sock.groupUpdateDescription(m.chat, data.desc); results.push("✅ تم تغيير الوصف"); successCount++; }
                catch (err) { results.push(`❌ فشل الوصف: ${err.message}`); failCount++; }
            }
            if (data.photo) {
                try {
                    const img = await axios.get(data.photo, { responseType: "arraybuffer" });
                    await sock.updateProfilePicture(m.chat, Buffer.from(img.data));
                    results.push("✅ تم تغيير الصورة"); successCount++;
                } catch (err) { results.push(`❌ فشل الصورة: ${err.message}`); failCount++; }
            }

            await m.reply(`📥 *نتيجة اللصق*\n\n✅ نجح: ${successCount}\n❌ فشل: ${failCount}\n\n${results.join('\n')}`);
            await m.react("✅");
        } catch (err) {
            m.reply(te(m.prefix, m.command, m.pushName));
        }
    } else {
        await m.reply(`📋 *نسخ المجموعة*\n\n.نسخ - لحفظ الإعدادات\n.لصق - لتطبيق الإعدادات`);
    }
}

export { pluginConfig as config, handler };