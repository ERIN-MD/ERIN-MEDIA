import { getDatabase } from "../../src/lib/maro-database.js";
import {
  findParticipantByNumber,
  getParticipantJid,
} from "../../src/lib/maro-lid.js";
import config from "../../config.js";

const pluginConfig = {
  name: ["منع_البوتات", "كشف_بوت"],
  alias: ["antibot"],
  category: "group",
  description: "كشف وطرد بوتات واتساب مع نظام تحذيرات (3 تحذيرات = طرد)",
  usage: ".منع_البوتات <تشغيل/إيقاف>",
  example: ".منع_البوتات تشغيل",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  isAdmin: true,
  isBotAdmin: true,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

const WARNING_LIMIT = 3;

function getWarnings(db, groupJid, userJid) {
  const groupData = db.getGroup(groupJid) || {};
  const warnings = groupData.antibotWarnings || {};
  return warnings[userJid] || 0;
}

function addWarning(db, groupJid, userJid) {
  const groupData = db.getGroup(groupJid) || {};
  const warnings = groupData.antibotWarnings || {};
  warnings[userJid] = (warnings[userJid] || 0) + 1;
  db.setGroup(groupJid, { ...groupData, antibotWarnings: warnings });
  db.save();
  return warnings[userJid];
}

function resetWarnings(db, groupJid, userJid) {
  const groupData = db.getGroup(groupJid) || {};
  const warnings = groupData.antibotWarnings || {};
  delete warnings[userJid];
  db.setGroup(groupJid, { ...groupData, antibotWarnings: warnings });
  db.save();
}

function resetAllWarnings(db, groupJid) {
  const groupData = db.getGroup(groupJid) || {};
  db.setGroup(groupJid, { ...groupData, antibotWarnings: {} });
  db.save();
}

function gpMsg(key, replacements = {}) {
  const defaults = {
    antibot_warn1: "🤖 *تنبيه بوت!*\n\n@%user% تم اكتشاف رسالة بوت.\n⚠️ *تحذير 1/3*\n> احذف البوت من جهازك.",
    antibot_warn2: "🤖 *تحذير ثاني!*\n\n@%user% هذه رسالة بوت مرة أخرى.\n⚠️ *تحذير 2/3*\n> التحذير القادم = طرد.",
    antibot_kick: "🚫 *تم الطرد!*\n\n@%user% تم طرده بعد 3 تحذيرات.\n> السبب: استخدام بوت واتساب.",
  };
  let text = config.groupProtection?.[key] || defaults[key] || "";
  for (const [k, v] of Object.entries(replacements)) {
    text = text.replace(new RegExp(`%${k}%`, "g"), v);
  }
  return text;
}

function extractMessageId(m) {
  return String(m?.key?.id || m?.id || "").trim();
}

function extractSenderDevice(m) {
  const participant = String(m?.key?.participant || "");
  const match = participant.match(/:(\d+)@/);
  if (!match) return null;
  const value = Number.parseInt(match[1], 10);
  return Number.isNaN(value) ? null : value;
}

function isUnknownPushName(pushName) {
  const value = String(pushName || "").trim().toLowerCase();
  return !value || ["unknown", "undefined", "null"].includes(value);
}

function analyzeBotMessage(m) {
  const messageId = extractMessageId(m);
  if (!messageId) {
    return { isBot: false, score: 0, reasons: [], confidence: "منخفض" };
  }

  if (
    messageId.startsWith("WAMID.") ||
    messageId.startsWith("false_") ||
    messageId.startsWith("true_")
  ) {
    return { isBot: false, score: 0, reasons: [], confidence: "منخفض" };
  }

  let score = 0;
  const reasons = [];
  const idUpper = messageId.toUpperCase();

  if (idUpper.startsWith("BAE5")) { score += 5; reasons.push("id-BAE5"); }
  else if (idUpper.startsWith("3EB0") && idUpper.length === 22) { score += 4; reasons.push("id-3EB0"); }
  else if (idUpper.startsWith("B24E")) { score += 5; reasons.push("id-B24E"); }
  else if (idUpper.startsWith("94DD")) { score += 5; reasons.push("id-94DD"); }
  else if (idUpper.startsWith("B1E")) { score += 5; reasons.push("id-B1E"); }
  else if (/^[A-F0-9]{28,40}$/i.test(messageId)) { score += 2; reasons.push("id-upper-hex"); }
  else if (messageId.length === 16) { score += 3; reasons.push("id-length-16"); }
  else if (messageId.length < 20 && !messageId.includes("-")) { score += 2; reasons.push("id-length-suspicious"); }

  if (m?.isBaileys === true) { score += 5; reasons.push("flag-isBaileys"); }

  const msg = m?.message || {};
  const actualMsg =
    msg.ephemeralMessage?.message ||
    msg.viewOnceMessage?.message ||
    msg.viewOnceMessageV2?.message ||
    msg;

  const botMessageTypes = [
    "buttonsMessage", "templateMessage", "listMessage",
    "interactiveMessage", "buttonsResponseMessage",
    "templateButtonReplyMessage", "listResponseMessage",
    "interactiveResponseMessage",
  ];
  for (const type of botMessageTypes) {
    if (actualMsg[type]) { score += 6; reasons.push(`message-type-${type}`); break; }
  }

  const senderDevice = extractSenderDevice(m);
  if (Number.isInteger(senderDevice) && senderDevice > 20) { score += 2; reasons.push("participant-highDevice"); }
  if (isUnknownPushName(m?.pushName)) { score += 1; reasons.push("pushname-unknown"); }

  const confidence = score >= 6 ? "مرتفع" : score >= 4 ? "متوسط" : "منخفض";
  return { isBot: score >= 5, score, reasons, confidence, messageId, senderDevice };
}

function handler(m, { sock }) {
  const db = getDatabase();
  const args = m.args[0]?.toLowerCase();
  const groupData = db.getGroup(m.chat) || {};
  const current = groupData.antibot || false;

  if (!args || args === "حالة") {
    return m.reply(
      `🤖 *منع البوتات*\n\n` +
      `> الحالة: ${current ? "✅ مفعل" : "❌ معطل"}\n` +
      `> التحذيرات: 3 تحذيرات = طرد\n` +
      `> الكشف: *ذكي*\n\n` +
      `> .منع_البوتات تشغيل/إيقاف\n` +
      `> .منع_البوتات تحذيرات\n` +
      `> .منع_البوتات تصفير`
    );
  }

  if (args === "تحذيرات" || args === "warnings") {
    const warnings = groupData.antibotWarnings || {};
    const entries = Object.entries(warnings);
    if (entries.length === 0) return m.reply("✅ *لا توجد تحذيرات*");
    let text = "📊 *تحذيرات البوتات*\n\n";
    for (const [jid, count] of entries) {
      text += `> @${jid.split("@")[0]}: ${count}/${WARNING_LIMIT}\n`;
    }
    return m.reply(text, { mentions: entries.map(([jid]) => jid) });
  }

  if (args === "تصفير" || args === "reset") {
    resetAllWarnings(db, m.chat);
    return m.reply("✅ *تم مسح جميع التحذيرات*");
  }

  if (args === "تشغيل" || args === "on") {
    db.setGroup(m.chat, { ...groupData, antibot: true });
    db.save();
    m.react("✅");
    return m.reply("✅ *تم تفعيل منع البوتات*\n\n> 3 تحذيرات = طرد تلقائي");
  }

  if (args === "إيقاف" || args === "off") {
    db.setGroup(m.chat, { ...groupData, antibot: false });
    db.save();
    m.react("❌");
    return m.reply("❌ *تم تعطيل منع البوتات*");
  }

  return m.reply("❌ استخدم .منع_البوتات تشغيل أو .منع_البوتات إيقاف");
}

function isBotMessage(m) {
  return analyzeBotMessage(m);
}

async function detectBot(m, sock) {
  if (!m.isGroup) return false;

  const db = getDatabase();
  const groupData = db.getGroup(m.chat);
  if (!groupData?.antibot) return false;

  const result = isBotMessage(m);
  if (!result.isBot) return false;

  const botJid = m.sender;
  if (!botJid) return false;

  const groupMeta = m.groupMetadata;
  if (!groupMeta) return false;

  const myNumber = sock.user?.id?.split(":")[0] || sock.user?.id?.split("@")[0];
  const myJid = myNumber + "@s.whatsapp.net";
  if (botJid === myJid) return false;

  const botParticipant = findParticipantByNumber(groupMeta.participants, myJid);
  if (!botParticipant?.admin) return false;

  const targetParticipant = findParticipantByNumber(groupMeta.participants, botJid);
  if (targetParticipant?.admin) return false;

  const targetJidToKick = targetParticipant ? getParticipantJid(targetParticipant) : botJid;

  try {
    try {
      await sock.sendMessage(m.chat, { delete: m.key });
    } catch {
      await sock.sendMessage(m.chat, {
        delete: {
          remoteJid: m.chat,
          fromMe: false,
          id: m.key?.id || m.id,
          participant: m.sender,
        },
      });
    }

    const currentWarnings = addWarning(db, m.chat, botJid);

    if (currentWarnings >= WARNING_LIMIT) {
      await sock.groupParticipantsUpdate(m.chat, [targetJidToKick], "remove");
      await sock.sendMessage(m.chat, {
        text: gpMsg("antibot_kick", { user: botJid.split("@")[0] }),
        mentions: [botJid],
      });
      resetWarnings(db, m.chat, botJid);
    } else {
      const msgKey = currentWarnings === 1 ? "antibot_warn1" : "antibot_warn2";
      await sock.sendMessage(m.chat, {
        text: gpMsg(msgKey, { user: botJid.split("@")[0] }),
        mentions: [botJid],
      });
    }

    return true;
  } catch (err) {
    return false;
  }
}

export { pluginConfig as config, handler, detectBot, isBotMessage };