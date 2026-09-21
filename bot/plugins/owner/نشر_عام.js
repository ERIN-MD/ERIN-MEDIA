import { getDatabase } from "../../src/lib/maro-database.js";
import { fetchGroupsSafe } from "../../src/lib/maro-jpm-helper.js";
import { saluranCtx } from "../../src/lib/maro-context.js";
import config from "../../config.js";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "نشر_عام",
  alias: ["bcgc"],
  category: "owner",
  description: "نشر رسالة إلى جميع المجموعات مع دعم جميع أنواع الوسائط",
  usage: ".نشر_عام",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 0,
  isEnabled: true,
};

function parseDelay(input) {
  if (!input) return null;
  const match = input.match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return null;
  const val = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case "s":
      return val * 1000;
    case "m":
      return val * 60 * 1000;
    case "h":
      return val * 60 * 60 * 1000;
    case "d":
      return val * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}

function formatDelay(ms) {
  if (ms >= 86400000) return `${(ms / 86400000).toFixed(0)} يوم`;
  if (ms >= 3600000) return `${(ms / 3600000).toFixed(0)} ساعة`;
  if (ms >= 60000) return `${(ms / 60000).toFixed(0)} دقيقة`;
  return `${(ms / 1000).toFixed(0)} ثانية`;
}

async function handler(m, { sock }) {
  const db = getDatabase();
  const command = m.command?.toLowerCase() || "";
  const input = m.fullArgs?.trim() || m.text?.trim() || "";

  if (command === "stopbcgc" || command === "stopbroadcastgc") {
    if (!global.statusBcgc) {
      return m.reply(`❌ لا يوجد نشر عام قيد التشغيل.`);
    }
    global.stopBcgc = true;
    m.react("⏹️");
    return m.reply(
      `⏹️ *تم إيقاف النشر العام*\n\n> جاري إيقاف عملية النشر...`,
    );
  }

  if (
    command === "jedabcgc" ||
    command === "delaybcgc" ||
    command === "setjedabcgc"
  ) {
    return handleSetDelay(m, db, input);
  }

  if (input.toLowerCase() === "on") {
    db.setting("bcgcEnabled", true);
    return m.reply(
      `✅ *تم تفعيل النشر العام*\n\n> الآن يمكنك إرسال نشر إلى جميع المجموعات.`,
    );
  }

  if (input.toLowerCase() === "off") {
    db.setting("bcgcEnabled", false);
    return m.reply(
      `✅ *تم تعطيل النشر العام*\n\n> تم إيقاف النشر العام.`,
    );
  }

  if (!input && !m.quoted) {
    const enabled = db.setting("bcgcEnabled");
    const jeda = db.setting("jedaBcgc") || 5000;
    return m.reply(
      `📢 *النشر العام*\n\n` +
        `إرسال رسالة إلى جميع المجموعات دفعة واحدة.\n\n` +
        `*الحالة الحالية:*\n` +
        `> النشر: *${enabled ? "✅ مفعل" : "❌ معطل"}*\n` +
        `> التأخير: *${formatDelay(jeda)}* (*${jeda}ms*)\n\n` +
        `*الاستخدام:*\n` +
        `> *${m.prefix}نشر_عام on* — تفعيل النشر\n` +
        `> *${m.prefix}نشر_عام off* — تعطيل النشر\n` +
        `> *${m.prefix}نشر_عام <رسالة>* — إرسال نشر نصي\n` +
        `> *${m.prefix}نشر_عام* (رد على صورة/فيديو/صوت/ملف) — إرسال مع وسائط\n` +
        `> *${m.prefix}نشر_عام* (رد على رسالة نصية) — إرسال محتوى الرسالة المردود عليها\n\n` +
        `*التأخير:*\n` +
        `> *${m.prefix}jedabcgc 5s* — تعيين تأخير 5 ثواني\n` +
        `> *${m.prefix}jedabcgc 2m* — تعيين تأخير دقيقتين\n\n` +
        `*إيقاف:*\n` +
        `> *${m.prefix}stopbcgc* — إيقاف النشر الجاري`,
    );
  }

  if (global.statusBcgc) {
    return m.reply(
      `❌ *النشر قيد التشغيل*\n\n> اكتب *${m.prefix}stopbcgc* للإيقاف أولاً.`,
    );
  }

  const enabled = db.setting("bcgcEnabled");
  if (!enabled) {
    return m.reply(
      `❌ *النشر غير مفعل*\n\n> اكتب *${m.prefix}نشر_عام on* أولاً للتفعيل.`,
    );
  }

  m.react("📢");

  try {
    let mediaBuffer = null;
    let mediaType = null;
    let text = input || "";
    const qmsg = m.quoted || m;

    if (!text && m.quoted) {
      text = m.quoted.body || m.quoted.text || m.quoted.contentText || "";
    }

    if (qmsg.isImage) {
      try {
        mediaBuffer = await qmsg.download();
        mediaType = "image";
      } catch {}
    } else if (qmsg.isVideo) {
      try {
        mediaBuffer = await qmsg.download();
        mediaType = "video";
      } catch {}
    } else if (qmsg.isAudio || qmsg.mimetype?.startsWith("audio")) {
      try {
        mediaBuffer = await qmsg.download();
        mediaType = "audio";
      } catch {}
    } else if (qmsg.isSticker) {
      try {
        mediaBuffer = await qmsg.download();
        mediaType = "sticker";
      } catch {}
    } else if (
      qmsg.isDocument ||
      (qmsg.mimetype && !qmsg.mimetype.startsWith("text/plain"))
    ) {
      try {
        mediaBuffer = await qmsg.download();
        mediaType = "document";
      } catch {}
    }

    if (!text && !mediaBuffer) {
      m.react("❌");
      return m.reply(
        `❌ *لا يوجد محتوى*\n\n` +
          `أرسل رسالة، صورة، صوت، فيديو، أو ملف أولاً.\n\n` +
          `*الطريقة الصحيحة:*\n` +
          `1. أرسل نص/صورة/فيديو/صوت/ملف\n` +
          `2. ارد على الرسالة بـ *${m.prefix}نشر_عام*\n` +
          `3. سيقوم البوت بالنشر إلى جميع المجموعات`,
      );
    }

    const allGroups = await fetchGroupsSafe(sock);
    let groupIds = Object.keys(allGroups);

    const blacklist = db.setting("jpmBlacklist") || [];
    const blCount = groupIds.filter((id) => blacklist.includes(id)).length;
    groupIds = groupIds.filter((id) => !blacklist.includes(id));

    if (groupIds.length === 0) {
      m.react("❌");
      return m.reply(
        `❌ *لا توجد مجموعات*\n\n> لم يتم العثور على مجموعات متاحة${blCount > 0 ? ` (${blCount} مجموعة محظورة)` : ""}`,
      );
    }

    const jeda = db.setting("jedaBcgc") || 5000;
    const ctx = saluranCtx();

    await m.reply(
      `📢 *بدأ النشر العام*\n\n` +
        `> 📝 الرسالة: *${text.substring(0, 50)}${text.length > 50 ? "..." : ""}*\n` +
        `> 📷 الوسائط: *${mediaBuffer ? mediaType : "لا يوجد"}*\n` +
        `> 👥 المستهدفين: *${groupIds.length}* مجموعة\n` +
        `> ⏱️ التأخير: *${formatDelay(jeda)}*\n` +
        `> 📊 التقدير: *${Math.ceil((groupIds.length * jeda) / 60000)} دقيقة*\n\n` +
        `_جاري الإرسال إلى جميع المجموعات..._`,
    );

    global.statusBcgc = true;
    let success = 0;
    let failed = 0;

    for (const gid of groupIds) {
      if (global.stopBcgc) {
        delete global.stopBcgc;
        delete global.statusBcgc;
        await m.reply(
          `⏹️ *تم إيقاف النشر العام*\n\n` +
            `> ✅ ناجح: *${success}*\n` +
            `> ❌ فاشل: *${failed}*\n` +
            `> ⏸️ متبقي: *${groupIds.length - success - failed}*`,
        );
        return;
      }

      try {
        if (mediaType === "sticker") {
          await sock.sendMessage(
            gid,
            { sticker: mediaBuffer, contextInfo: ctx },
            { quoted: m },
          );
        } else if (mediaType === "audio") {
          await sock.sendMessage(
            gid,
            {
              audio: mediaBuffer,
              mimetype: qmsg.mimetype || "audio/mpeg",
              ptt: qmsg.ptt || false,
              contextInfo: ctx,
            },
            { quoted: m },
          );
        } else if (mediaType === "document") {
          await sock.sendMessage(
            gid,
            {
              document: mediaBuffer,
              mimetype: qmsg.mimetype || "application/octet-stream",
              fileName: qmsg.fileName || "file",
              caption: text || undefined,
              contextInfo: ctx,
            },
            { quoted: m },
          );
        } else if (mediaBuffer) {
          await sock.sendMessage(
            gid,
            {
              [mediaType]: mediaBuffer,
              caption: text,
              contextInfo: ctx,
            },
            { quoted: m },
          );
        } else {
          await sock.sendMessage(
            gid,
            { text, contextInfo: ctx },
            { quoted: m },
          );
        }
        success++;
      } catch {
        failed++;
      }

      await new Promise((r) => setTimeout(r, jeda));
    }

    delete global.statusBcgc;
    m.react("✅");
    await m.reply(
      `✅ *اكتمل النشر العام!*\n\n` +
        `> ✅ ناجح: *${success}*\n` +
        `> ❌ فاشل: *${failed}*\n` +
        `> 📊 المجموع: *${groupIds.length}*`,
    );
  } catch (e) {
    delete global.statusBcgc;
    m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

async function handleSetDelay(m, db, input) {
  const current = db.setting("jedaBcgc") || 5000;

  if (!input) {
    return m.reply(
      `⏱️ *تأخير النشر العام*\n\n` +
        `ضبط فترة التأخير بين كل إرسال إلى المجموعات.\n` +
        `كلما زاد التأخير، زاد الأمان من اكتشاف السبام.\n\n` +
        `> التأخير الحالي: *${formatDelay(current)}* (*${current}ms*)\n\n` +
        `*طريقة الاستخدام:*\n` +
        `> *${m.prefix}jedabcgc <رقم><وحدة>*\n\n` +
        `*الوحدات:*\n` +
        `> *s* — ثانية • *m* — دقيقة • *h* — ساعة • *d* — يوم\n\n` +
        `*مثال:*\n` +
        `> *${m.prefix}jedabcgc 5s* → 5 ثواني\n` +
        `> *${m.prefix}jedabcgc 2m* → دقيقتين\n` +
        `> *${m.prefix}jedabcgc 1h* → ساعة`,
    );
  }

  const ms = parseDelay(input);
  if (!ms || ms < 1000) {
    return m.reply(`❌ صيغة خاطئة. مثال: *5s*, *2m*, *1h*, *1d*`);
  }

  db.setting("jedaBcgc", ms);
  return m.reply(
    `✅ *تم تغيير تأخير النشر العام*\n\n` +
      `> السابق: *${formatDelay(current)}* (*${current}ms*)\n` +
      `> الحالي: *${formatDelay(ms)}* (*${ms}ms*)\n\n` +
      `> تقدير 100 مجموعة: *${Math.ceil((100 * ms) / 60000)} دقيقة*`,
  );
}

export { pluginConfig as config, handler };