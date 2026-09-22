import { getDatabase } from "../../src/lib/maro-database.js";
import { saluranCtx } from "../../src/lib/maro-context.js";

const pluginConfig = {
  name: "منع_الخطف",
  alias: ["anticulik"],
  category: "group",
  description: "البوت يخرج تلقائياً من المجموعة إذا أضيف بدون إذن",
  usage: ".منع_الخطف تشغيل/إيقاف",
  example: ".منع_الخطف تشغيل",
  isOwner: true,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const option = m.text?.toLowerCase()?.trim();

  if (!option) {
    const status = db.setting("anticulik") || "off";

    return m.reply(
      `🛡️ *منع الخطف*\n\n` +
        `سيخرج البوت تلقائياً من المجموعة إذا أضافه شخص غير معروف بدون إذن.\n\n` +
        `*الحالة:*\n` +
        `> الوضع: *${status === "on" ? "مفعل ✅" : "معطل ❌"}*\n\n` +
        `*الاستخدام:*\n` +
        `> *${m.prefix}منع_الخطف تشغيل* — تفعيل\n` +
        `> *${m.prefix}منع_الخطف إيقاف* — تعطيل\n\n` +
        `_إذا كان مفعلاً، البوت ينضم فقط عبر *${m.prefix}انضمام* أو بإضافة المالك_`
    );
  }

  if (option === "تشغيل" || option === "on") {
    db.setting("anticulik", "on");
    const ctx = saluranCtx();
    return m.reply(
      `🛡️ *تم تفعيل منع الخطف*\n\n` +
        `> سيخرج البوت تلقائياً إذا أضيف بدون إذن\n` +
        `> الطريقة الوحيدة لإضافة البوت: *${m.prefix}انضمام* بواسطة المالك\n\n` +
        `_العضو الذي يضيف البوت سيتم تحذيره_`,
      { contextInfo: ctx }
    );
  }

  if (option === "إيقاف" || option === "off") {
    db.setting("anticulik", "off");
    return m.reply(
      `🛡️ *تم تعطيل منع الخطف*\n\n` +
        `> لن يخرج البوت تلقائياً عند إضافته للمجموعات\n` +
        `> يمكن لأي شخص إضافة البوت للمجموعات`
    );
  }

  return m.reply(
    `❌ *خيار غير صالح*\n\n> استخدم *${m.prefix}منع_الخطف تشغيل* أو *${m.prefix}منع_الخطف إيقاف*`
  );
}

async function handleAntiCulik(event, sock, db) {
  if (event.action !== "add") return false;

  const botNumber = sock.user?.id?.split(":")[0] || sock.user?.id?.split("@")[0];
  const botLid = sock.user?.id;

  const isBotAdded = (event.participants || []).some((p) => {
    const rJid = typeof p === "object" && p !== null ? p.phoneNumber || p.id : p;
    if (typeof rJid !== "string") return false;
    const pNum = rJid.split("@")[0].split(":")[0];
    return (pNum === botNumber || rJid === botLid || rJid.includes(botNumber));
  });

  if (!isBotAdded) return false;

  const anticulikStatus = db.setting("anticulik") || "off";
  if (anticulikStatus !== "on") return false;

  const inviter = event.author || "";
  const ownerNumbers = (global.owner || []).map((o) => typeof o === "string" ? o.split("@")[0] : o);
  const inviterNum = inviter.split("@")[0].split(":")[0];

  const isOwnerInviter = inviterNum === botNumber || ownerNumbers.includes(inviterNum) || inviter === botLid;
  if (isOwnerInviter) return false;

  const inviterMention = inviter ? `@${inviter.split("@")[0]}` : "شخص ما";

  await sock.sendMessage(event.id, {
    text:
      `🛡️ *منع الخطف*\n\n` +
      `استأذن أولاً يا بطل، لا تخطف البوت 🗿\n\n` +
      `> تمت إضافة البوت بواسطة ${inviterMention} بدون إذن\n` +
      `> سيغادر البوت هذه المجموعة\n\n` +
      `_تواصل مع المالك لإضافة البوت بالطريقة الصحيحة_`,
    contextInfo: saluranCtx(),
    mentionedJid: inviter ? [inviter] : [],
  });

  await new Promise((r) => setTimeout(r, 2000));
  await sock.groupLeave(event.id);
  return true;
}

export { pluginConfig as config, handler, handleAntiCulik };