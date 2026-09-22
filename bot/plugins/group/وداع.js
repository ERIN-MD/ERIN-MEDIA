import {
  cacheParticipantLids,
  getCachedJid,
  isLid,
  isLidConverted,
  lidToJid,
} from "../../src/lib/maro-lid.js";
import moment from "moment-timezone";
import config from "../../config.js";
import { getDatabase } from "../../src/lib/maro-database.js";
import { saluranCtx } from "../../src/lib/maro-context.js";
import { createGoodbyeCard } from "../../src/lib/maro-welcome-card.js";
import path from "path";
import fs from "fs";
import te from "../../src/lib/maro-error.js";

const DATA_DIR = path.join(process.cwd(), "data");
const IMAGE_PATH = path.join(DATA_DIR, "goodbyeImages.json");
const DEFAULT_TIMEZONE = config.timezone || config.bot?.timezone || "Asia/Jakarta";
const DEFAULT_PREFIX = config.command?.prefix || ".";
const OWNER_ONLY = config.messages?.ownerOnly || "❌ هذا الأمر متاح للمالك فقط.";

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(IMAGE_PATH)) {
  fs.writeFileSync(IMAGE_PATH, "{}\n", "utf8");
}

function readJson(filePath, fallback = {}) {
  try {
    const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return value && typeof value === "object" && !Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  const temporaryPath = `${filePath}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(temporaryPath, filePath);
}

function getGoodbyeImages() {
  return readJson(IMAGE_PATH, {});
}

function saveGoodbyeImages(data) {
  writeJson(IMAGE_PATH, data);
}

function normalizeToken(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[ـ]/g, "")
    .replace(/\s+/g, "_");
}

function parseAction(value) {
  const token = normalizeToken(value);
  if (["on", "enable", "enabled", "تفعيل", "تشغيل", "شغل", "فعال", "مفعل"].includes(token)) return "on";
  if (["off", "disable", "disabled", "تعطيل", "إيقاف", "ايقاف", "قفل", "إغلاق", "اغلاق", "معطل"].includes(token)) return "off";
  return null;
}

function isAllKeyword(value) {
  return ["الكل", "كل", "all", "عام", "شامل", "كامل"].includes(normalizeToken(value));
}

function parseGlobalAction(args = []) {
  const tokens = args.map(normalizeToken).filter(Boolean);
  if (!tokens.some(isAllKeyword)) return null;
  return parseAction(tokens.find((token) => parseAction(token)));
}

function resolvePlaceholders(template, username, groupName, groupDesc, memberCount, groupOwner, prefix) {
  const now = moment().tz(DEFAULT_TIMEZONE);
  const dayNames = {
    Sunday: "الأحد",
    Monday: "الإثنين",
    Tuesday: "الثلاثاء",
    Wednesday: "الأربعاء",
    Thursday: "الخميس",
    Friday: "الجمعة",
    Saturday: "السبت",
  };
  const values = {
    username: username || "مستخدم",
    groupName: groupName || "المجموعة",
    groupDesc: groupDesc || "",
    memberCount: String(memberCount ?? 0),
    groupOwner: groupOwner || "المشرف",
    date: now.format("DD/MM/YYYY"),
    time: now.format("HH:mm"),
    day: dayNames[now.format("dddd")] || now.format("dddd"),
    bot: config.bot?.name || "Maro",
    prefix: prefix || DEFAULT_PREFIX,
  };

  return String(template)
    .replace(/@منشن/gi, `@${values.username}`)
    .replace(/@اسم/gi, values.username)
    .replace(/@قروب/gi, values.groupName)
    .replace(/{user}/gi, `@${values.username}`)
    .replace(/{number}/gi, values.username)
    .replace(/{group}/gi, values.groupName)
    .replace(/{desc}/gi, values.groupDesc)
    .replace(/{count}/gi, values.memberCount)
    .replace(/{owner}/gi, values.groupOwner)
    .replace(/{date}/gi, values.date)
    .replace(/{time}/gi, values.time)
    .replace(/{day}/gi, values.day)
    .replace(/{bot}/gi, values.bot)
    .replace(/{prefix}/gi, values.prefix);
}

const pluginConfig = {
  name: "وداع",
  alias: ["goodbye", "وداعا", "bye", "leave"],
  category: "group",
  description: "نظام وداع متكامل مع صور مخصصة ورسائل وتحكم محلي وعام",
  usage: ".وداع <تشغيل/إيقاف/ضبط/صورة/حذف_صورة/تجربة/تشغيل الكل/إيقاف الكل>",
  example: ".وداع تشغيل",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  isAdmin: true,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

async function buildGoodbyeMessage(participant, groupName, groupDesc, memberCount, groupData, groupOwner = "", prefix = DEFAULT_PREFIX) {
  const username = participant?.split("@")[0] || "مستخدم";
  const customMessage = groupData?.goodbyeMsg;
  if (customMessage) {
    return resolvePlaceholders(customMessage, username, groupName, groupDesc, memberCount, groupOwner, prefix);
  }

  const farewells = ["وداعاً", "إلى اللقاء", "باي باي", "سلام", "أراك لاحقاً", "انتبه لنفسك", "تصبح على خير~"];
  const quotes = [
    "نتمنى أن تكون خطواتك القادمة ميسرة.",
    "شكراً لكونك جزءاً من هذه المجموعة.",
    "نتمنى أن نلتقي مجدداً.",
    "الباب مفتوح دائماً إذا أردت العودة.",
    "اعتنِ بنفسك يا صديق.",
    "ذكرياتك هنا ستبقى.",
  ];
  const emojis = ["🌙", "👋", "🥀", "💫", "😢", "🤍"];
  const headers = [
    "🌙 تصبحون على خير... اليوم صديق يودعنا.",
    "🥀 أصدقائي... هناك وداع صغير اليوم.",
    "💫 وداعاً~ ليست النهاية، فقط إلى اللقاء.",
    "🌌 أصدقائي... نجمة غيرت سماءها الليلة.",
  ];
  const now = moment().tz(DEFAULT_TIMEZONE);
  const farewell = farewells[Math.floor(Math.random() * farewells.length)];
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];
  const header = headers[Math.floor(Math.random() * headers.length)];

  return [
    "👋🏻 *وداعاً* 👋🏻",
    "",
    header,
    `${emoji} ${farewell}, *@${username}* 🤍`,
    "",
    "📌 *معلومات المجموعة*",
    `> 🏠 *الاسم* : ${groupName || "المجموعة"}`,
    `> 👥 *الأعضاء المتبقون* : ${memberCount || 0}`,
    `> 📅 *التاريخ* : ${now.format("DD/MM/YYYY")}`,
    "",
    "💌 *رسالة*",
    `> 「 ${quote} 」`,
    "",
    "🌸 _إلى اللقاء، يا صديق._ 🤍",
  ].join("\n");
}

function resolveRealParticipant(participant, groupMeta) {
  if (!participant) return "";
  const participants = Array.isArray(groupMeta?.participants) ? groupMeta.participants : [];
  if (participants.length) cacheParticipantLids(participants);

  let realParticipant = participant;
  const cachedJid = getCachedJid(participant);
  if (cachedJid && !isLidConverted(cachedJid)) return cachedJid;
  if (isLid(participant)) {
    const cachedFromLid = getCachedJid(participant);
    return cachedFromLid && !isLidConverted(cachedFromLid) ? cachedFromLid : lidToJid(participant);
  }
  if (isLidConverted(participant)) {
    const lidNumber = participant.replace("@s.whatsapp.net", "");
    const cachedFromLid = getCachedJid(`${lidNumber}@lid`);
    if (cachedFromLid && !isLidConverted(cachedFromLid)) realParticipant = cachedFromLid;
  }
  return realParticipant;
}

async function sendGoodbyeMessage(sock, groupJid, participant, groupMeta) {
  try {
    if (!groupJid || !participant) return false;
    const db = getDatabase();
    const groupData = db.getGroup(groupJid) || {};
    if (groupData.goodbye !== true && groupData.leave !== true) return false;

    const realParticipant = resolveRealParticipant(participant, groupMeta) || participant;
    const participants = Array.isArray(groupMeta?.participants) ? groupMeta.participants : [];
    const groupName = groupMeta?.subject || "المجموعة";
    const memberCount = participants.length;
    const groupOwner = groupMeta?.owner?.split("@")[0] || "";
    const username = realParticipant.split("@")[0] || "مستخدم";
    const text = await buildGoodbyeMessage(realParticipant, groupName, groupMeta?.desc || "", memberCount, groupData, groupOwner, DEFAULT_PREFIX);
    const mentions = realParticipant ? [realParticipant] : [];
    const contextInfo = { ...saluranCtx(), mentionedJid: mentions };

    let canvasBuffer = null;
    const customImage = getGoodbyeImages()[groupJid];
    if (customImage && fs.existsSync(customImage)) {
      try { canvasBuffer = fs.readFileSync(customImage); } catch (error) { console.error("[Goodbye image]", error.message); }
    }

    if (!canvasBuffer) {
      try {
        let profileUrl = config.assets?.["pp-kosong"] || "";
        try { profileUrl = await sock.profilePictureUrl(realParticipant, "image"); } catch { }
        canvasBuffer = await createGoodbyeCard(username, profileUrl, groupName, memberCount.toLocaleString());
      } catch (error) {
        console.error("[Goodbye card]", error.message);
      }
    }

    if (canvasBuffer) {
      await sock.sendMessage(groupJid, { image: canvasBuffer, caption: text, mentions, contextInfo });
      return true;
    }

    await sock.sendMessage(groupJid, { text, mentions, contextInfo });
    return true;
  } catch (error) {
    console.error("[Goodbye]", error.message);
    return false;
  }
}

async function getGroupIds(sock) {
  const groups = await sock.groupFetchAllParticipating();
  return Object.keys(groups || {}).filter((jid) => jid.endsWith("@g.us"));
}

async function setGoodbyeForAll(sock, db, enabled) {
  const groupIds = await getGroupIds(sock);
  for (const groupId of groupIds) {
    db.setGroup(groupId, { goodbye: enabled, leave: enabled });
  }
  return groupIds.length;
}

async function handler(m, { sock }) {
  const db = getDatabase();
  const args = Array.isArray(m.args) ? m.args : [];
  const sub = normalizeToken(args[0]);
  const currentPrefix = m.prefix || DEFAULT_PREFIX;
  const groupData = db.getGroup(m.chat) || {};
  const currentStatus = groupData.goodbye === true || groupData.leave === true;

  if (!sub) {
    const imagePath = getGoodbyeImages()[m.chat];
    return m.reply(
      `👋 *نظام الوداع*\n\n` +
      `📊 *الحالة:* ${currentStatus ? "🟢 مفعل" : "🔴 معطل"}\n` +
      `🖼️ *الصورة:* ${imagePath && fs.existsSync(imagePath) ? "✅ موجودة" : "❌ غير موجودة"}\n` +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      "*📝 الأوامر:*\n" +
      `• *${currentPrefix}وداع تشغيل* أو *on*\n` +
      `• *${currentPrefix}وداع إيقاف* أو *off*\n` +
      `• *${currentPrefix}وداع تشغيل الكل* أو *on all* — للمالك\n` +
      `• *${currentPrefix}وداع إيقاف الكل* أو *off all* — للمالك\n` +
      `• *${currentPrefix}وداع ضبط [رسالة]*\n` +
      `• *${currentPrefix}وداع صورة* — رداً على صورة\n` +
      `• *${currentPrefix}وداع حذف_صورة*\n` +
      `• *${currentPrefix}وداع تجربة*\n\n` +
      "*📌 المتغيرات:*\n" +
      "`@منشن` `@اسم` `@قروب` `{user}` `{number}` `{group}` `{desc}` `{count}` `{owner}` `{date}` `{time}` `{day}` `{bot}` `{prefix}`",
    );
  }

  const globalAction = parseGlobalAction(args);
  if (globalAction) {
    if (!m.isOwner) return m.reply(OWNER_ONLY);
    try {
      await m.react("🕕");
      const count = await setGoodbyeForAll(sock, db, globalAction === "on");
      await m.react("✅");
      return m.reply(globalAction === "on"
        ? `✅ *تم تفعيل الوداع في ${count} مجموعة*`
        : `❌ *تم إيقاف الوداع في ${count} مجموعة*`);
    } catch (error) {
      try { await m.react("❌"); } catch { }
      console.error("[Goodbye all]", error.message);
      return m.reply(te(m.prefix, m.command, m.pushName));
    }
  }

  const action = parseAction(sub);
  if (action === "on") {
    if (currentStatus) return m.reply("⚠️ *الوداع مفعل بالفعل*");
    db.setGroup(m.chat, { goodbye: true, leave: true });
    return m.reply("✅ *تم تفعيل الوداع*");
  }

  if (action === "off") {
    if (!currentStatus) return m.reply("⚠️ *الوداع معطل بالفعل*");
    db.setGroup(m.chat, { goodbye: false, leave: false });
    return m.reply("❌ *تم تعطيل الوداع*");
  }

  if (["ضبط", "set"].includes(sub)) {
    const customMessage = args.slice(1).join(" ").trim();
    if (!customMessage) return m.reply(`⚠️ اكتب الرسالة. مثال: ${currentPrefix}وداع ضبط مع السلامة @منشن`);
    db.setGroup(m.chat, { goodbye: true, leave: true, goodbyeMsg: customMessage });
    return m.reply("✅ *تم حفظ رسالة الوداع وتفعيل النظام*");
  }

  if (["صورة", "image", "img"].includes(sub)) {
    if (!m.quoted?.message?.imageMessage) return m.reply("⚠️ *رد على صورة ثم اكتب أمر صورة الوداع.*");
    try {
      const buffer = await m.quoted.download();
      if (!buffer?.length) throw new Error("تعذر تنزيل الصورة");
      const imageFile = path.join(DATA_DIR, `goodbye_${m.chat.replace(/[^0-9a-z_-]/gi, "_")}.jpg`);
      fs.writeFileSync(imageFile, buffer);
      const images = getGoodbyeImages();
      images[m.chat] = imageFile;
      saveGoodbyeImages(images);
      return m.reply("✅ *تم حفظ صورة الوداع*");
    } catch (error) {
      return m.reply(`❌ *تعذر حفظ الصورة*\n${error.message}`);
    }
  }

  if (["حذف_صورة", "delimage"].includes(sub)) {
    const images = getGoodbyeImages();
    const imagePath = images[m.chat];
    if (!imagePath) return m.reply("⚠️ *لا توجد صورة وداع محفوظة.*");
    try { if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); } catch { }
    delete images[m.chat];
    saveGoodbyeImages(images);
    return m.reply("✅ *تم حذف صورة الوداع*");
  }

  if (["تجربة", "test", "try"].includes(sub)) {
    const metadata = await sock.groupMetadata(m.chat);
    const testGroup = db.getGroup(m.chat) || {};
    const text = await buildGoodbyeMessage(
      m.sender,
      metadata.subject,
      metadata.desc || "",
      metadata.participants?.length || 0,
      testGroup,
      metadata.owner?.split("@")[0] || "",
      currentPrefix,
    );
    return m.reply(`${text}\n━━━━━━━━━━━━━━━━━━\n🤖 *تجربة فقط*`);
  }

  return m.reply(`❌ *أمر غير معروف.*\nاستخدم ${currentPrefix}وداع للمساعدة`);
}

export { pluginConfig as config, handler, sendGoodbyeMessage, buildGoodbyeMessage, resolvePlaceholders };