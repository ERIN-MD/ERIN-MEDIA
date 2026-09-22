import {
  isToxic,
  handleToxicMessage,
  DEFAULT_TOXIC_WORDS,
} from "./منع_الكلمات.js";
import config from "../../config.js";
import { getDatabase } from "../../src/lib/maro-database.js";
import te from "../../src/lib/maro-error.js";
import { saluranCtx } from "../../src/lib/maro-context.js";
const pluginConfig = {
  name: "اشعار_تغيير_الوسم",
  alias: ["notifgantitag"],
  category: "group",
  description: "تفعيل/تعطيل إشعار تغيير وسم العضو",
  usage: ".اشعار_تغيير_الوسم <تشغيل/إيقاف>",
  example: ".اشعار_تغيير_الوسم تشغيل",
  isGroup: true,
  isAdmin: true,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};
async function handler(m, { sock }) {
  const db = getDatabase();
  const args = m.args || [];
  const sub = args[0]?.toLowerCase();
  const sub2 = args[1]?.toLowerCase();
  const groupData = db.getGroup(m.chat) || {};
  const currentStatus = groupData.notifLabelChange === true;
  if (sub === "تشغيل" && sub2 === "الكل") {
    if (!m.isOwner) { return m.reply(`❌ فقط المالك يمكنه استخدام هذه الميزة!`); }
    m.react("🕕");
    try {
      const groups = await sock.groupFetchAllParticipating();
      const groupIds = Object.keys(groups);
      let count = 0;
      for (const groupId of groupIds) { db.setGroup(groupId, { notifLabelChange: true }); count++; }
      m.react("✅");
      return m.reply(`✅ *تم تفعيل إشعار الوسم العام*\n\n> تم التفعيل في *${count}* مجموعة!`);
    } catch (err) { m.react("☢"); return m.reply(te(m.prefix, m.command, m.pushName)); }
  }
  if (sub === "ايقاف" && sub2 === "الكل") {
    if (!m.isOwner) { return m.reply(`❌ فقط المالك يمكنه استخدام هذه الميزة!`); }
    m.react("🕕");
    try {
      const groups = await sock.groupFetchAllParticipating();
      const groupIds = Object.keys(groups);
      let count = 0;
      for (const groupId of groupIds) { db.setGroup(groupId, { notifLabelChange: false }); count++; }
      m.react("✅");
      return m.reply(`❌ *تم تعطيل إشعار الوسم العام*\n\n> تم التعطيل في *${count}* مجموعة!`);
    } catch (err) { m.react("☢"); return m.reply(te(m.prefix, m.command, m.pushName)); }
  }
  if (sub === "تشغيل" || sub === "on") {
    if (currentStatus) { return m.reply(`⚠️ *الإشعار مفعل بالفعل*\n\n> الحالة: *✅ مفعل*\n\n_استخدم \`${m.prefix}اشعار_تغيير_الوسم إيقاف\` للتعطيل._`); }
    db.setGroup(m.chat, { notifLabelChange: true });
    return m.reply(`✅ *تم تفعيل إشعار الوسم*\n\n> سيخبر البوت عند تغيير وسم أي عضو.\n\n_مثال: مشرف يضيف وسم "VIP" لعضو_`);
  }
  if (sub === "ايقاف" || sub === "off") {
    if (!currentStatus) { return m.reply(`⚠️ *الإشعار معطل بالفعل*\n\n> الحالة: *❌ معطل*\n\n_استخدم \`${m.prefix}اشعار_تغيير_الوسم تشغيل\` للتفعيل._`); }
    db.setGroup(m.chat, { notifLabelChange: false });
    return m.reply(`❌ *تم تعطيل إشعار الوسم*\n\n> لن يخبر البوت عند تغيير وسم الأعضاء.`);
  }
  m.reply(
    `🏷️ *إشعار تغيير الوسم*\n\n` +
    `> الحالة: *${currentStatus ? "✅ مفعل" : "❌ معطل"}*\n\n` +
    `> \`${m.prefix}اشعار_تغيير_الوسم تشغيل\` → تفعيل\n` +
    `> \`${m.prefix}اشعار_تغيير_الوسم إيقاف\` → تعطيل\n` +
    `> \`${m.prefix}اشعار_تغيير_الوسم تشغيل الكل\` → تفعيل عام (مالك)\n` +
    `> \`${m.prefix}اشعار_تغيير_الوسم إيقاف الكل\` → تعطيل عام (مالك)\n\n` +
    `> 📋 *هذه الميزة تخبرك عند:*\n` +
    `> • إضافة وسم لعضو\n` +
    `> • حذف وسم من عضو\n` +
    `> • تغيير وسم عضو`,
  );
}
async function handleLabelChange(msg, sock) {
  try {
    const db = getDatabase();
    const protocolMessage = msg.message?.protocolMessage;
    if (!protocolMessage) return false;
    if (protocolMessage.type !== 30) return false;
    const memberLabel = protocolMessage.memberLabel;
    if (!memberLabel) return false;
    const groupJid = msg.key.remoteJid;
    if (!groupJid?.endsWith("@g.us")) return false;
    const groupData = db.getGroup(groupJid) || {};
    const participant = msg.key.participant || msg.participant || "غير معروف";
    const label = memberLabel.label || "";
    if (groupData.antitoxic && label && label.trim()) {
      try {
        const toxicWords = groupData.toxicWords || DEFAULT_TOXIC_WORDS;
        const toxicCheck = isToxic(label, toxicWords);
        if (toxicCheck.toxic) {
          await sock.sendText(groupJid, `انتبه @${participant.split("@")[0]}، الوسم يحتوي على كلمة ممنوعة!`, null, { mentions: [participant], contextInfo: { ...saluranCtx(), mentionedJid: [participant] } });
          return true;
        }
      } catch {}
    }
    if (groupData.notifLabelChange !== true) return false;
    let notifText = "";
    if (label && label.trim()) { notifText = `🎉 @${participant.split("@")[0]} غيّر وسامه إلى *${label}*`; }
    else { notifText = `🥗 @${participant.split("@")[0]} أزال وسامه`; }
    await sock.sendText(groupJid, notifText, null, { mentions: [participant], contextInfo: { ...saluranCtx(), mentionedJid: [participant] } });
    return true;
  } catch (error) { console.error("[NotifLabelChange] خطأ:", error.message); return false; }
}
export { pluginConfig as config, handler, handleLabelChange };