// نظام التسجيل - أمر لإدارة نظام التسجيل الإجباري وإحصائيات التسجيل

import { getDatabase } from "../../src/lib/maro-database.js";
import config from "../../config.js";

function getRegistrationContextInfo() {
  const saluranId = config.saluran?.id || "120363400911374213@newsletter";
  const saluranName = config.saluran?.name || config.bot?.name || "Maro-AI";

  return {
    forwardingScore: 9999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: saluranId,
      newsletterName: saluranName,
      serverMessageId: 127,
    },
  };
}

function toDateKey(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getRegistrationStats(db) {
  const users = Object.values(db.getAllUsers() || {});
  const todayKey = toDateKey(new Date());

  return {
    totalRegistered: users.filter((user) => user?.isRegistered).length,
    registeredToday: users.filter(
      (user) =>
        toDateKey(user?.lastRegisteredAt || user?.registeredAt) === todayKey,
    ).length,
    unregisteredToday: users.filter(
      (user) => toDateKey(user?.unregisteredAt) === todayKey,
    ).length,
    activeSessions: Object.keys(global.registrationSessions || {}).length,
  };
}

const pluginConfig = {
  name: "نظام_التسجيل",
  alias: ["sistemdaftar"],
  category: "owner",
  description: "إدارة نظام التسجيل الإجباري وإحصائيات التسجيل",
  usage: ".نظام_التسجيل <تشغيل/إيقاف/إحصائيات>",
  example: ".نظام_التسجيل إحصائيات",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const args = m.text?.trim() || "";
  const normalizedArgs = args.toLowerCase();

  const currentStatus =
    db.setting("registrationRequired") ?? config.registration?.enabled ?? false;
  const stats = getRegistrationStats(db);

  // عرض الحالة
  if (!normalizedArgs) {
    return m.reply(
      `⚙️ *نظام التسجيل*\n\n` +
        `الحالة: ${currentStatus ? "✅ مفعل (تسجيل إجباري)" : "❌ معطل"}\n\n` +
        `*الإحصائيات:*\n` +
        `> إجمالي المسجلين: *${stats.totalRegistered}*\n` +
        `> المسجلين اليوم: *${stats.registeredToday}*\n` +
        `> إلغاء التسجيل اليوم: *${stats.unregisteredToday}*\n` +
        `> الجلسات النشطة: *${stats.activeSessions}*\n\n` +
        `*طريقة الاستخدام:*\n` +
        `> \`${m.prefix}نظام_التسجيل تشغيل\` - تفعيل التسجيل الإجباري\n` +
        `> \`${m.prefix}نظام_التسجيل إيقاف\` - تعطيل التسجيل الإجباري\n` +
        `> \`${m.prefix}نظام_التسجيل إحصائيات\` - عرض الإحصائيات\n\n` +
        `> إذا كان مفعلاً، يجب على المستخدم كتابة \`${m.prefix}تسجيل\` قبل استخدام الأوامر`,
    );
  }

  // عرض الإحصائيات
  if (normalizedArgs === "stats" || normalizedArgs === "إحصائيات") {
    await sock.sendMessage(
      m.chat,
      {
        text:
          `📊 *إحصائيات التسجيل*\n\n` +
          `حالة النظام: ${currentStatus ? "✅ مفعل (تسجيل إجباري)" : "❌ معطل"}\n\n` +
          `╭┈┈⬡「 📈 *الإحصائيات* 」\n` +
          `┃ إجمالي المسجلين: *${stats.totalRegistered}*\n` +
          `┃ المسجلين اليوم: *${stats.registeredToday}*\n` +
          `┃ إلغاء التسجيل اليوم: *${stats.unregisteredToday}*\n` +
          `┃ الجلسات النشطة: *${stats.activeSessions}*\n` +
          `╰┈┈┈┈┈┈┈┈⬡`,
        contextInfo: getRegistrationContextInfo(),
      },
      { quoted: m },
    );

    await m.react("📊");
    return;
  }

  // تفعيل
  if (
    normalizedArgs === "on" ||
    normalizedArgs === "1" ||
    normalizedArgs === "true" ||
    normalizedArgs === "تشغيل"
  ) {
    db.setting("registrationRequired", true);
    await db.save();

    await sock.sendMessage(
      m.chat,
      {
        text:
          `✅ *تم تفعيل نظام التسجيل!*\n\n` +
          `يجب على المستخدمين الآن التسجيل قبل استخدام الأوامر!\n\n` +
          `> الأمر: \`${m.prefix}تسجيل\``,
        contextInfo: getRegistrationContextInfo(),
      },
      { quoted: m },
    );

    await m.react("✅");
    return;
  }

  // تعطيل
  if (
    normalizedArgs === "off" ||
    normalizedArgs === "0" ||
    normalizedArgs === "false" ||
    normalizedArgs === "إيقاف"
  ) {
    db.setting("registrationRequired", false);
    await db.save();

    await sock.sendMessage(
      m.chat,
      {
        text:
          `❌ *تم تعطيل نظام التسجيل!*\n\n` +
          `لم يعد المستخدمون بحاجة إلى التسجيل لاستخدام الأوامر.`,
        contextInfo: getRegistrationContextInfo(),
      },
      { quoted: m },
    );

    await m.react("❌");
    return;
  }

  return m.reply(
    `❌ خيار غير صالح!\n\n> استخدم: \`تشغيل\`, \`إيقاف\`, أو \`إحصائيات\``,
  );
}

export { pluginConfig as config, handler };