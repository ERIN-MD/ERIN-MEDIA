import moment from "moment-timezone";
import config from "../../config.js";
import { getDatabase } from "../../src/lib/maro-database.js";
import { createWideDiscordCard } from "../../src/lib/maro-welcome-card.js";
import { resolveAnyLidToJid } from "../../src/lib/maro-lid.js";
import path from "path";
import fs from "fs";
import te from "../../src/lib/maro-error.js";
import { saluranCtx } from "../../src/lib/maro-context.js";
import { getAssetBuffer } from "../../src/lib/maro-asset-manager.js";

const DATA_DIR = path.join(process.cwd(), "data");
const IMAGE_PATH = path.join(DATA_DIR, "welcomeImages.json");
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

function getWelcomeImages() {
  return readJson(IMAGE_PATH, {});
}

function saveWelcomeImages(data) {
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

function getPrefix(prefix) {
  return prefix || DEFAULT_PREFIX;
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
  const day = dayNames[now.format("dddd")] || now.format("dddd");
  const values = {
    username: username || "مستخدم",
    groupName: groupName || "المجموعة",
    groupDesc: groupDesc || "",
    memberCount: String(memberCount ?? 0),
    groupOwner: groupOwner || "المشرف",
    date: now.format("DD/MM/YYYY"),
    time: now.format("HH:mm"),
    day,
    bot: config.bot?.name || "Maro",
    prefix: getPrefix(prefix),
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
  name: "ترحيب",
  alias: ["welcome", "اهلا", "أهلا", "اهلا_وسهلا"],
  category: "group",
  description: "نظام ترحيب متكامل مع صور مخصصة ورسائل وتحكم محلي وعام",
  usage: ".ترحيب <تشغيل/إيقاف/ضبط/صورة/حذف_صورة/تجربة/تشغيل الكل/إيقاف الكل>",
  example: ".ترحيب تشغيل",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  isAdmin: true,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

async function buildWelcomeMessage(participant, groupName, groupDesc, memberCount, groupData, groupOwner = "", prefix = DEFAULT_PREFIX) {
  const username = participant?.split("@")[0] || "مستخدم";
  const customMessage = groupData?.welcomeMsg;
  if (customMessage) {
    return resolvePlaceholders(customMessage, username, groupName, groupDesc, memberCount, groupOwner, prefix);
  }

  const greetings = ["أخيراً وصلت", "أهلاً وسهلاً", "مرحباً", "هلا", "نورت", "يا مرحبا"];
  const quotes = [
    "لا تكن قارئاً صامتاً!",
    "استرخِ، اعتبر نفسك في منزلك!",
    "هيا شاركنا الحديث!",
    "استعد للإثارة!",
    "لا تخجل، كلنا أصدقاء!",
    "إذا احترت، ابدأ بالتحية.",
  ];
  const emojis = ["🎐", "🌸", "✨", "💫", "🪸", "🔥", "💖"];
  const headers = [
    "🎐 صباح الخير! اليوم انضم إلينا صديق جديد 🌱",
    "🌸 صباح الخير! صديق جديد انضم أخيراً ✨",
    "✨ مرحباً! صديق جديد يجلب طاقة جديدة 💫",
    "🪸 صباح الخير! المجموعة تكبر بفرد جديد 🤍",
  ];
  const now = moment().tz(DEFAULT_TIMEZONE);
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];
  const header = headers[Math.floor(Math.random() * headers.length)];
  const description = groupDesc ? `\n📝 *الوصف*\n> ❝ ${String(groupDesc).slice(0, 120)}${String(groupDesc).length > 120 ? "..." : ""} ❞\n` : "";

  return [
    "👋🏻 *مرحباً بالعضو الجديد* 👋🏻",
    "",
    header,
    `${emoji} ${greeting}, *@${username}* 💫`,
    "",
    "📌 *معلومات المجموعة*",
    `> 🏠 *الاسم* : ${groupName || "المجموعة"}`,
    `> 👥 *الأعضاء* : ${memberCount || 0}`,
    `> 📅 *التاريخ* : ${now.format("DD/MM/YYYY")}`,
    description,
    `✨ *نصيحة اليوم*\n> 「 ${quote} 」`,
    "",
    "🌸 _أهلاً بك~ نتمنى أن تنبسط!_ 🤍",
  ].join("\n");
}

async function sendWelcomeMessage(sock, groupJid, participant, groupMeta) {
  try {
    if (!groupJid || !participant) return false;
    const db = getDatabase();
    const groupData = db.getGroup(groupJid) || {};
    if (groupData.welcome !== true) return false;

    const participants = Array.isArray(groupMeta?.participants) ? groupMeta.participants : [];
    const realParticipant = resolveAnyLidToJid(participant, participants) || participant;
    const memberCount = participants.length;
    const groupName = groupMeta?.subject || "المجموعة";
    const groupDescription = groupMeta?.desc || "";
    const groupOwner = groupMeta?.owner?.split("@")[0] || "";
    const prefix = DEFAULT_PREFIX;
    const username = realParticipant.split("@")[0] || "مستخدم";
    const text = await buildWelcomeMessage(realParticipant, groupName, groupDescription, memberCount, groupData, groupOwner, prefix);
    const mentions = realParticipant ? [realParticipant] : [];
    const contextInfo = { ...saluranCtx(), mentionedJid: mentions };

    let canvasBuffer = null;
    const customImage = getWelcomeImages()[groupJid];
    if (customImage && fs.existsSync(customImage)) {
      try { canvasBuffer = fs.readFileSync(customImage); } catch (error) { console.error("[Welcome image]", error.message); }
    }

    if (!canvasBuffer) {
      try {
        let profileUrl = config.assets?.["pp-kosong"] || "";
        try { profileUrl = await sock.profilePictureUrl(realParticipant, "image"); } catch { }
        canvasBuffer = await createWideDiscordCard(username, profileUrl, groupName, memberCount.toLocaleString());
      } catch (error) {
        console.error("[Welcome card]", error.message);
      }
    }

    if (canvasBuffer) {
      await sock.sendMessage(groupJid, { image: canvasBuffer, caption: text, mentions, contextInfo });
      return true;
    }

    const welcomeType = Number(db.setting("welcomeType") || 1);
    try {
      if (welcomeType === 5 && typeof sock.sendPreview === "function") {
        await sock.sendPreview(groupJid, {
          caption: `${config.info?.website || ""}\n${text}`,
          url: config.info?.website || "https://maro.site",
          title: `مرحباً بك في ${groupName}`,
          description: `👋 مرحباً ${username}!`,
          previewType: 0,
        }, { contextInfo });
      } else if (welcomeType === 6) {
        const video = getAssetBuffer("maro-mp4");
        if (!video) throw new Error("maro-mp4 غير متوفر");
        await sock.sendMessage(groupJid, { video, gifPlayback: true, caption: text, mentions, contextInfo });
      } else if (welcomeType === 2) {
        await sock.sendMessage(groupJid, { text: text, mentions, contextInfo });
      } else {
        await sock.sendMessage(groupJid, { text, mentions, contextInfo });
      }
      return true;
    } catch (sendError) {
      console.error("[Welcome fallback]", sendError.message);
      await sock.sendMessage(groupJid, { text, mentions, contextInfo });
      return true;
    }
  } catch (error) {
    console.error("[Welcome]", error.message);
    return false;
  }
}

async function getGroupIds(sock) {
  const groups = await sock.groupFetchAllParticipating();
  return Object.keys(groups || {}).filter((jid) => jid.endsWith("@g.us"));
}

async function setWelcomeForAll(sock, db, enabled) {
  const groupIds = await getGroupIds(sock);
  for (const groupId of groupIds) {
    db.setGroup(groupId, { welcome: enabled });
  }
  return groupIds.length;
}

async function handler(m, { sock }) {
  const db = getDatabase();
  const args = Array.isArray(m.args) ? m.args : [];
  const sub = normalizeToken(args[0]);
  const currentPrefix = getPrefix(m.prefix);
  const groupData = db.getGroup(m.chat) || {};
  const currentStatus = groupData.welcome === true;

  if (!sub) {
    const imagePath = getWelcomeImages()[m.chat];
    return m.reply(
      `🌟 *نظام الترحيب*\n\n` +
      `📊 *الحالة:* ${currentStatus ? "🟢 مفعل" : "🔴 معطل"}\n` +
      `🖼️ *الصورة:* ${imagePath && fs.existsSync(imagePath) ? "✅ موجودة" : "❌ غير موجودة"}\n` +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      "*📝 الأوامر:*\n" +
      `• *${currentPrefix}ترحيب تشغيل* أو *on*\n` +
      `• *${currentPrefix}ترحيب إيقاف* أو *off*\n` +
      `• *${currentPrefix}ترحيب تشغيل الكل* أو *on all* — للمالك\n` +
      `• *${currentPrefix}ترحيب إيقاف الكل* أو *off all* — للمالك\n` +
      `• *${currentPrefix}ترحيب ضبط [رسالة]*\n` +
      `• *${currentPrefix}ترحيب صورة* — رداً على صورة\n` +
      `• *${currentPrefix}ترحيب حذف_صورة*\n` +
      `• *${currentPrefix}ترحيب تجربة*\n\n` +
      "*📌 المتغيرات:*\n" +
      "`@منشن` `@اسم` `@قروب` `{user}` `{number}` `{group}` `{desc}` `{count}` `{owner}` `{date}` `{time}` `{day}` `{bot}` `{prefix}`",
    );
  }

  const globalAction = parseGlobalAction(args);
  if (globalAction) {
    if (!m.isOwner) return m.reply(OWNER_ONLY);
    try {
      await m.react("🕕");
      const count = await setWelcomeForAll(sock, db, globalAction === "on");
      await m.react("✅");
      return m.reply(globalAction === "on"
        ? `✅ *تم تفعيل الترحيب في ${count} مجموعة*`
        : `❌ *تم إيقاف الترحيب في ${count} مجموعة*`);
    } catch (error) {
      try { await m.react("❌"); } catch { }
      console.error("[Welcome all]", error.message);
      return m.reply(te(m.prefix, m.command, m.pushName));
    }
  }

  const action = parseAction(sub);
  if (action === "on") {
    if (currentStatus) return m.reply("⚠️ *الترحيب مفعل بالفعل*");
    db.setGroup(m.chat, { welcome: true });
    return m.reply("✅ *تم تفعيل الترحيب*");
  }

  if (action === "off") {
    if (!currentStatus) return m.reply("⚠️ *الترحيب معطل بالفعل*");
    db.setGroup(m.chat, { welcome: false });
    return m.reply("❌ *تم تعطيل الترحيب*");
  }

  if (["ضبط", "set"].includes(sub)) {
    const customMessage = args.slice(1).join(" ").trim();
    if (!customMessage) return m.reply(`⚠️ اكتب الرسالة. مثال: ${currentPrefix}ترحيب ضبط مرحباً @منشن في @قروب`);
    db.setGroup(m.chat, { welcome: true, welcomeMsg: customMessage });
    return m.reply("✅ *تم حفظ رسالة الترحيب وتفعيل النظام*");
  }

  if (["صورة", "image", "img"].includes(sub)) {
    if (!m.quoted?.message?.imageMessage) return m.reply("⚠️ *رد على صورة ثم اكتب أمر صورة الترحيب.*");
    try {
      const buffer = await m.quoted.download();
      if (!buffer?.length) throw new Error("تعذر تنزيل الصورة");
      const imageFile = path.join(DATA_DIR, `welcome_${m.chat.replace(/[^0-9a-z_-]/gi, "_")}.jpg`);
      fs.writeFileSync(imageFile, buffer);
      const images = getWelcomeImages();
      images[m.chat] = imageFile;
      saveWelcomeImages(images);
      return m.reply("✅ *تم حفظ صورة الترحيب*");
    } catch (error) {
      return m.reply(`❌ *تعذر حفظ الصورة*\n${error.message}`);
    }
  }

  if (["حذف_صورة", "delimage"].includes(sub)) {
    const images = getWelcomeImages();
    const imagePath = images[m.chat];
    if (!imagePath) return m.reply("⚠️ *لا توجد صورة ترحيب محفوظة.*");
    try { if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); } catch { }
    delete images[m.chat];
    saveWelcomeImages(images);
    return m.reply("✅ *تم حذف صورة الترحيب*");
  }

  if (["تجربة", "test", "try"].includes(sub)) {
    const metadata = await sock.groupMetadata(m.chat);
    const testGroup = db.getGroup(m.chat) || {};
    const text = await buildWelcomeMessage(
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

  return m.reply(`❌ *أمر غير معروف.*\nاستخدم ${currentPrefix}ترحيب للمساعدة`);
}

export { pluginConfig as config, handler, sendWelcomeMessage, buildWelcomeMessage, resolvePlaceholders };