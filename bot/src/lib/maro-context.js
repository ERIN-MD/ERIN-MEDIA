import fs from "fs"; // نظام الملفات
import path from "path"; // مسارات الملفات
import config from "../../config.js"; // إعدادات البوت
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import axios from "axios"; // مكتبة الطلبات
import { getAssetBuffer } from "./maro-asset-manager.js"; // جلب الصور المخزنة

// ═══════════════════════════════════════════════
// 🖼️ تحميل الصور المستخدمة في الألعاب
// ═══════════════════════════════════════════════
let gameThumbBuffer = null; // صورة الألعاب العامة
let rpgThumbBuffer = null; // صورة RPG
let winnerThumbBuffer = null; // صورة الفائز

const keys = [
  ["maro-games", (buf) => { gameThumbBuffer = buf; }], // تحميل صورة الألعاب
  ["maro-rpg", (buf) => { rpgThumbBuffer = buf; }], // تحميل صورة RPG
  ["maro-winner", (buf) => { winnerThumbBuffer = buf; }], // تحميل صورة الفائز
];
for (const [key, setter] of keys) {
  const buf = getAssetBuffer(key); // جلب الصورة من مدير الأصول
  if (buf) setter(buf); // تخزينها إذا وجدت
}

// ═══════════════════════════════════════════════
// 🏆 عبارات المديح للإجابة السريعة (معربة)
// ═══════════════════════════════════════════════
const FAST_ANSWER_PRAISES = [
  "⚡ سريع جداً! أنت عبقري!", // Lightning fast
  "🚀 سرعة خارقة! عقل متوقد!", // Super fast
  "🔥 وااو وحش! جاوبت بسرعة البرق!", // Monster
  "💫 مذهل! أنت فلاش!", // The flash
  "🎯 دقة عالية! أصبت مباشرة!", // Precision
  "⭐ نجم! ردود فعل أسطورية!", // Star
  "🏆 أسطورة! أقصى سرعة!", // Legend
  "💎 لاعب محترف! لا يوجد منافس!", // Premium
  "🦅 حاد كالنسر!", // Eagle
  "🧠 عقل كبير! نسبة ذكاء مرتفعة!", // Big brain
];

// ═══════════════════════════════════════════════
// ⚡ إعدادات الإجابة السريعة
// ═══════════════════════════════════════════════
const FAST_ANSWER_THRESHOLD = 4000; // الحد الأقصى للسرعة (4 ثواني)
const FAST_ANSWER_BONUS = {
  exp: 50, // مكافأة خبرة
  balance: 500, // مكافأة رصيد
  limit: 1, // مكافأة حد إضافي
};

/**
 * اختيار عبارة مديح عشوائية
 */
function getRandomPraise() {
  return FAST_ANSWER_PRAISES[
    Math.floor(Math.random() * FAST_ANSWER_PRAISES.length)
  ];
}

// ═══════════════════════════════════════════════
// 📢 تنسيق سياق القناة (Saluran)
// ═══════════════════════════════════════════════
function _saluranCtx() {
  const saluranId = config.saluran?.id || "120363400911374213@newsletter";
  const saluranName = config.saluran?.name || config.bot?.name || "Maro-AI";
  return {
    forwardingScore: 9, // درجة التوجيه
    isForwarded: true, // معاد توجيهه
    forwardedNewsletterMessageInfo: {
      newsletterJid: saluranId, // معرف القناة
      newsletterName: saluranName, // اسم القناة
      serverMessageId: 127,
    },
  };
}

/** سياق رسائل الألعاب */
function getGameContextInfo() {
  return _saluranCtx();
}

/** سياق رسائل الفائز */
function getWinnerContextInfo() {
  return _saluranCtx();
}

/** سياق رسائل RPG مع إعلان خارجي */
function getRpgContextInfo(title, body) {
  const base = _saluranCtx();
  if (title || body) {
    base.externalAdReply = {
      title: title || config.bot?.name || "Maro RPG",
      body: body || "",
      sourceUrl: config.saluran?.link || "",
      mediaType: 1,
      renderLargerThumbnail: false,
      thumbnail: rpgThumbBuffer, // صورة RPG المصغرة
    };
  }
  return base;
}

// ═══════════════════════════════════════════════
// 📤 دوال إرسال المعاينات (Link Previews)
// ═══════════════════════════════════════════════

/** إرسال معاينة للألعاب */
async function sendGamePreview(sock, jid, text, title, body, options) {
  const msgId = await sock.sendPreview(
    jid,
    {
      caption: `${config.info.website} ${text}`,
      url: `${config.info.website}`,
      title: title || "🎮 ألعاب Tarboo Bot",
      description: body || "استمتع باللعب!",
      jpegThumbnail: gameThumbBuffer,
      previewType: 0,
    },
    { contextInfo: _saluranCtx(), ...options },
  );
  return { key: { id: msgId, remoteJid: jid, fromMe: true } };
}

/** إرسال معاينة للفائز */
async function sendWinnerPreview(sock, jid, text, title, body, options) {
  const msgId = await sock.sendPreview(
    jid,
    {
      caption: `${config.info.website} ${text}`,
      url: `${config.info.website}`,
      title: title || "🏆 فائز!",
      description: body || "مبروك أنت الفائز!",
      jpegThumbnail: winnerThumbBuffer || gameThumbBuffer,
      previewType: 0,
    },
    { contextInfo: _saluranCtx(), ...options },
  );
  return { key: { id: msgId, remoteJid: jid, fromMe: true } };
}

/** إرسال معاينة RPG */
async function sendRpgPreview(sock, jid, text, title, body, options) {
  const msgId = await sock.sendPreview(
    jid,
    {
      caption: `${config.info.website} ${text}`,
      url: `${config.info.website}`,
      title: title || "⚔️ Tarboo Bot RPG",
      description: body || "المغامرة في انتظارك!",
      jpegThumbnail: rpgThumbBuffer,
      previewType: 0,
    },
    { contextInfo: _saluranCtx(), ...options },
  );
  return { key: { id: msgId, remoteJid: jid, fromMe: true } };
}

/** إرسال معاينة للأدوات */
async function sendToolsPreview(sock, jid, text, title, body, options) {
  const msgId = await sock.sendPreview(
    jid,
    {
      caption: `${config.info.website} ${text}`,
      url: `${config.info.website}`,
      title: title || "🛠️ أدوات Tarboo Bot",
      description: body || "أدوات وخدمات مفيدة",
      jpegThumbnail: gameThumbBuffer,
      previewType: 0,
    },
    { contextInfo: _saluranCtx(), ...options },
  );
  return { key: { id: msgId, remoteJid: jid, fromMe: true } };
}

/** تصدير سياق القناة */
function saluranCtx() {
  return _saluranCtx();
}

// ═══════════════════════════════════════════════
// ⚡ التحقق من سرعة الإجابة
// ═══════════════════════════════════════════════
function checkFastAnswer(session) {
  if (!session?.startTime) return { isFast: false }; // لا يوجد وقت بداية

  const elapsed = Date.now() - session.startTime; // حساب الوقت المنقضي

  if (elapsed <= FAST_ANSWER_THRESHOLD) { // إذا كانت الإجابة سريعة
    return {
      isFast: true,
      elapsed: elapsed, // الوقت المستغرق
      praise: getRandomPraise(), // عبارة مديح عشوائية
      bonus: FAST_ANSWER_BONUS, // المكافآت
    };
  }

  return { isFast: false, elapsed: elapsed };
}

// ═══════════════════════════════════════════════
// 📝 إنشاء رسالة مقتبسة وهمية (للشكل الاحترافي)
// ═══════════════════════════════════════════════
function createFakeQuoted(botName = "Tarboo Bot|BOT", verified = true) {
  return {
    key: {
      fromMe: false,
      participant: "0@s.whatsapp.net",
      remoteJid: "status@broadcast", // كأنها من حالة واتساب
    },
    message: {
      contactMessage: {
        displayName: verified ? `✅ ${botName}` : botName,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${botName}\nORG:${verified ? "بوت موثق" : "بوت"}\nEND:VCARD`,
      },
    },
  };
}

// ═══════════════════════════════════════════════
// 📦 تصدير الدوال والثوابت
// ═══════════════════════════════════════════════
export {
  getGameContextInfo, // سياق الألعاب
  getWinnerContextInfo, // سياق الفائز
  getRpgContextInfo, // سياق RPG
  sendGamePreview, // إرسال معاينة لعبة
  sendWinnerPreview, // إرسال معاينة فائز
  sendRpgPreview, // إرسال معاينة RPG
  sendToolsPreview, // إرسال معاينة أدوات
  saluranCtx, // سياق القناة
  createFakeQuoted, // اقتباس وهمي
  checkFastAnswer, // التحقق من السرعة
  getRandomPraise, // مديح عشوائي
  gameThumbBuffer, // صورة الألعاب
  rpgThumbBuffer, // صورة RPG
  winnerThumbBuffer, // صورة الفائز
  FAST_ANSWER_THRESHOLD, // حد السرعة
  FAST_ANSWER_BONUS, // مكافآت السرعة
  FAST_ANSWER_PRAISES, // عبارات المديح
};