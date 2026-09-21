// بوت الإيجار - أمر لتفعيل وإدارة نظام إيجار البوت

import { getDatabase } from "../../src/lib/maro-database.js";
import fs from "fs";
import te from "../../src/lib/maro-error.js";
import { saluranCtx } from "../../src/lib/maro-context.js";

const pluginConfig = {
  name: "إيجار_البوت",
  alias: ["sewabot"],
  category: "owner",
  description: "تفعيل وإدارة نظام إيجار البوت",
  usage: ".إيجار_البوت <تشغيل/إيقاف/مغادرة/حالة>",
  example: ".إيجار_البوت تشغيل",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

const pendingConfirmations = new Map();

async function handler(m, { sock }) {
  const db = getDatabase();
  const args = m.text?.trim()?.toLowerCase();
  
  if (!db.db.data.sewa) {
    db.db.data.sewa = { enabled: false, groups: {} };
    db.db.write();
  }

  const currentStatus = db.db.data.sewa.enabled;
  const sewaGroups = Object.keys(db.db.data.sewa.groups || {});

  // عرض الحالة
  if (!args || args === "status" || args === "حالة") {
    return m.reply(
      `🔧 *نظام إيجار البوت*\n\n` +
        `الحالة: *${currentStatus ? "✅ مفعل" : "❌ معطل"}*\n` +
        `المجموعات المسجلة: *${sewaGroups.length}*\n\n` +
        `*الأوامر المتاحة:*\n` +
        `• *${m.prefix}إيجار_البوت تشغيل* — تفعيل نظام الإيجار\n` +
        `• *${m.prefix}إيجار_البوت إيقاف* — تعطيل نظام الإيجار\n` +
        `• *${m.prefix}إيجار_البوت مغادرة* — مغادرة جميع المجموعات غير المسجلة\n\n` +
        `*إدارة الإيجار:*\n` +
        `• *${m.prefix}إضافة_الإيجار <الرابط> <المدة>* — إضافة مجموعة + انضمام تلقائي\n` +
        `• *${m.prefix}حذف_الإيجار <الرابط/المعرف>* — حذف مجموعة من القائمة البيضاء\n` +
        `• *${m.prefix}تجديد_الإيجار <الرابط/المعرف> <المدة>* — تمديد الإيجار\n` +
        `• *${m.prefix}قائمة_الإيجار* — عرض جميع المجموعات المسجلة\n` +
        `• *${m.prefix}فحص_الإيجار* — فحص المدة المتبقية (داخل المجموعة)\n\n` +
        `*صيغ المدة:*\n` +
        `30i (دقيقة) \u2022 12h (ساعة) \u2022 7d (يوم) \u2022 1m (شهر) \u2022 1y (سنة) \u2022 دائم\n\n` +
        `*طريقة العمل:*\n` +
        `1. أضف مجموعة باستخدام *${m.prefix}إضافة_الإيجار*\n` +
        `2. ينضم البوت تلقائياً إذا استخدمت رابطاً\n` +
        `3. فعّل باستخدام *${m.prefix}إيجار_البوت تشغيل*\n` +
        `4. سيغادر البوت جميع المجموعات غير المسجلة\n` +
        `5. انتهاء الإيجار → يغادر البوت تلقائياً`,
    );
  }

  // إيقاف
  if (args === "off" || args === "إيقاف") {
    db.db.data.sewa.enabled = false;
    db.db.write();
    await m.react("✅");
    return m.reply(
      `✅ تم تعطيل نظام الإيجار\n\nلن يغادر البوت أي مجموعة.`,
    );
  }

  // تشغيل
  if (args === "on" || args === "تشغيل") {
    const pending = pendingConfirmations.get(m.sender);
    if (
      pending &&
      pending.type === "sewabot_on" &&
      Date.now() - pending.timestamp < 60000
    ) {
      return m.reply(
        `🕕 يوجد طلب قيد الانتظار\n\nاكتب *${m.prefix}إيجار_البوت تأكيد* للمتابعة\nاكتب *${m.prefix}إيجار_البوت إلغاء* للإلغاء`,
      );
    }

    pendingConfirmations.set(m.sender, {
      type: "sewabot_on",
      timestamp: Date.now(),
    });

    setTimeout(() => {
      if (pendingConfirmations.get(m.sender)?.type === "sewabot_on")
        pendingConfirmations.delete(m.sender);
    }, 60000);

    return m.reply(
      `⚠️ *تأكيد تفعيل الإيجار*\n\n` +
        `إذا تم التفعيل:\n` +
        `• ✅ ${sewaGroups.length} مجموعة في القائمة البيضاء ستبقى آمنة\n` +
        `• ❌ جميع المجموعات الأخرى سيتم مغادرتها!\n\n` +
        `اكتب *${m.prefix}إيجار_البوت تأكيد* للمتابعة\nاكتب *${m.prefix}إيجار_البوت إلغاء* للإلغاء\n\n` +
        `💡 تأكد من إضافة المجموعات المهمة إلى القائمة البيضاء باستخدام:\n*${m.prefix}إضافة_الإيجار <رابط المجموعة> <المدة>*`,
    );
  }

  // تأكيد
  if (args === "confirm" || args === "yes" || args === "y" || args === "تأكيد") {
    const pending = pendingConfirmations.get(m.sender);
    if (!pending || pending.type !== "sewabot_on") {
      return m.reply(
        `❌ لا يوجد طلب قيد الانتظار\nاكتب *${m.prefix}إيجار_البوت تشغيل* أولاً`,
      );
    }

    pendingConfirmations.delete(m.sender);

    db.db.data.sewa.enabled = true;
    db.db.write();
    await m.react("🕕");
    await m.reply(`🕕 تم تفعيل نظام الإيجار، جاري معالجة المغادرة التلقائية...`);

    try {
      global.isFetchingGroups = true;
      const allGroups = await sock.groupFetchAllParticipating();
      global.isFetchingGroups = false;
      
      const allGroupIds = Object.keys(allGroups);
      const unlistedGroups = allGroupIds.filter(
        (id) => !sewaGroups.includes(id),
      );

      let leftCount = 0;
      let failedCount = 0;

      for (const groupId of unlistedGroups) {
        try {
          await sock.sendText(
            groupId,
            `⛔ هذه المجموعة غير مسجلة في نظام الإيجار.\nسيغادر البوت هذه المجموعة.\n\nتواصل مع المالك لإيجار البوت.`,
            null,
            {
              contextInfo: saluranCtx(),
            },
          );
          await new Promise((r) => setTimeout(r, 2000));
          await sock.groupLeave(groupId);
          leftCount++;
          await new Promise((r) => setTimeout(r, 3000));
        } catch {
          failedCount++;
        }
      }

      await m.react("✅");
      return m.reply(
        `✅ *نظام الإيجار مفعل*\n\n` +
          `المجموعات في القائمة البيضاء: *${sewaGroups.length}*\n` +
          `تم المغادرة من: *${leftCount}* مجموعة\n` +
          `فشل: *${failedCount}* مجموعة`,
      );
    } catch (e) {
      await m.react("✅");
      return m.reply(te(m.prefix, m.command, m.pushName));
    }
  }

  // مغادرة
  if (args === "leave" || args === "مغادرة") {
    if (!currentStatus)
      return m.reply(`❌ فعّل نظام الإيجار أولاً باستخدام *${m.prefix}إيجار_البوت تشغيل*`);

    await m.react("🕕");
    await m.reply(`🕕 جاري جلب قائمة المجموعات...`);
    
    global.sewaLeaving = true;
    try {
      global.isFetchingGroups = true;
      const allGroups = await sock.groupFetchAllParticipating();
      global.isFetchingGroups = false;
      
      const allGroupIds = Object.keys(allGroups);
      const unlistedGroups = allGroupIds.filter(
        (id) => !sewaGroups.includes(id),
      );

      if (unlistedGroups.length === 0) {
        delete global.sewaLeaving;
        await m.react("✅");
        return m.reply(`✅ لا توجد مجموعات للمغادرة منها`);
      }

      await m.reply(
        `📊 الإجمالي: ${allGroupIds.length} مجموعة\nالقائمة البيضاء: ${sewaGroups.length}\nسيتم المغادرة من: ${unlistedGroups.length} مجموعة`,
      );

      let leftCount = 0;
      let failedCount = 0;

      for (const groupId of unlistedGroups) {
        try {
          await sock.sendText(
            groupId,
            `👋 هذه المجموعة غير مسجلة في نظام الإيجار.\nسيغادر البوت هذه المجموعة.\n\nتواصل مع المالك لإيجار البوت.`,
            null,
            {
              contextInfo: saluranCtx(),
            },
          );
          await new Promise((r) => setTimeout(r, 3000));
          await sock.groupLeave(groupId);
          leftCount++;
          await new Promise((r) => setTimeout(r, 5000));
        } catch {
          failedCount++;
        }
      }

      delete global.sewaLeaving;
      await m.react("✅");
      return m.reply(
        `✅ انتهى\n\nتم المغادرة بنجاح: *${leftCount}* مجموعة\nفشل: *${failedCount}* مجموعة`,
      );
    } catch (e) {
      delete global.sewaLeaving;
      await m.react("☢");
      await m.reply(te(m.prefix, m.command, m.pushName));
    }
  }

  // إلغاء
  if (args === "cancel" || args === "no" || args === "n" || args === "إلغاء") {
    const pending = pendingConfirmations.get(m.sender);
    if (!pending || pending.type !== "sewabot_on")
      return m.reply(`❌ لا يوجد طلب قيد الانتظار`);
    
    pendingConfirmations.delete(m.sender);
    await m.react("❌");
    return m.reply(
      `❌ تم إلغاء التفعيل\nأضف المجموعات إلى القائمة البيضاء باستخدام *${m.prefix}إضافة_الإيجار*`,
    );
  }

  return m.reply(
    `❌ أمر غير صالح\n\nاكتب *${m.prefix}إيجار_البوت* لعرض الدليل الكامل`,
  );
}

export { pluginConfig as config, handler, pendingConfirmations };