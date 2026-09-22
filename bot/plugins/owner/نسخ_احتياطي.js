import { enableAutoBackup, disableAutoBackup, getBackupStatus, triggerManualBackup, formatInterval } from '../../src/lib/maro-auto-backup.js'
import * as timeHelper from '../../src/lib/maro-time.js'
import config from '../../config.js'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
  name: "نسخ_احتياطي",
  alias: ["autobackup"],
  category: "owner",
  description: "إدارة نظام النسخ الاحتياطي التلقائي",
  usage: ".نسخ_احتياطي <on/off/status/now> [المدة]",
  example: ".نسخ_احتياطي on 5h",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const args = m.text?.trim().split(/\s+/) || [];
  const action = args[0]?.toLowerCase();

  if (!action) {
    const status = getBackupStatus();
    const ownerNum = config.owner?.number?.[0] || "غير محدد";

    let txt = `🗂️ *نظام النسخ الاحتياطي التلقائي*\n\n`;
    txt += `╭┈┈⬡「 📊 *الحالة* 」\n`;
    txt += `┃ 🔘 الحالة: ${status.enabled ? "✅ *مفعل*" : "❌ *معطل*"}\n`;
    txt += `┃ ⏱️ المدة: ${status.interval}\n`;
    txt += `┃ 📅 آخر نسخة: ${status.lastBackup ? timeHelper.fromTimestamp(status.lastBackup, "DD MMMM YYYY HH:mm:ss") : "-"}\n`;
    txt += `┃ #️⃣ المجموع: ${status.backupCount} نسخة\n`;
    txt += `┃ 📤 ترسل إلى: ${ownerNum}\n`;
    txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`;

    txt += `*طريقة الاستخدام:*\n`;
    txt += `> \`${m.prefix}نسخ_احتياطي on <المدة>\`\n`;
    txt += `> \`${m.prefix}نسخ_احتياطي off\`\n`;
    txt += `> \`${m.prefix}نسخ_احتياطي status\`\n`;
    txt += `> \`${m.prefix}نسخ_احتياطي now\`\n\n`;

    txt += `*صيغ المدة:*\n`;
    txt += `> • \`5m\` = 5 دقائق\n`;
    txt += `> • \`1h\` = 1 ساعة\n`;
    txt += `> • \`6h\` = 6 ساعات\n`;
    txt += `> • \`1d\` = 1 يوم\n\n`;

    txt += `*مثال:*\n`;
    txt += `> \`${m.prefix}نسخ_احتياطي on 6h\` - نسخ كل 6 ساعات`;

    return m.reply(txt);
  }

  switch (action) {
    case "on":
    case "enable":
    case "start": {
      const interval = args[1];

      if (!interval) {
        return m.reply(
          `⚠️ *المدة مطلوبة*\n\n` +
            `> \`${m.prefix}نسخ_احتياطي on <المدة>\`\n\n` +
            `*مثال:*\n` +
            `> \`${m.prefix}نسخ_احتياطي on 30m\` - كل 30 دقيقة\n` +
            `> \`${m.prefix}نسخ_احتياطي on 6h\` - كل 6 ساعات\n` +
            `> \`${m.prefix}نسخ_احتياطي on 1d\` - كل يوم`,
        );
      }

      const result = enableAutoBackup(interval, sock);

      if (!result.success) {
        return m.reply(`❌ *فشل*\n\n> ${result.error}`);
      }

      const ownerNum = config.owner?.number?.[0] || "المالك";

      await m.react("✅");
      return m.reply(
        `✅ *تم تفعيل النسخ الاحتياطي التلقائي*\n\n` +
          `╭┈┈⬡「 ⚙️ *الإعدادات* 」\n` +
          `┃ ⏱️ المدة: ${result.interval}\n` +
          `┃ 📤 ترسل إلى: ${ownerNum}\n` +
          `┃ 📦 مستثنى: node_modules, .git, storages, إلخ\n` +
          `╰┈┈┈┈┈┈┈┈⬡\n\n` +
          `> سيتم إرسال أول نسخة احتياطية خلال ${result.interval}`,
      );
    }

    case "off":
    case "disable":
    case "stop": {
      disableAutoBackup();

      await m.react("✅");
      return m.reply(
        `❌ *تم تعطيل النسخ الاحتياطي التلقائي*\n\n` +
          `> تم إيقاف النسخ الاحتياطي التلقائي.\n` +
          `> استخدم \`${m.prefix}نسخ_احتياطي on <المدة>\` لإعادة التفعيل.`,
      );
    }

    case "status":
    case "info": {
      const status = getBackupStatus();
      const ownerNum = config.owner?.number?.[0] || "غير محدد";

      let txt = `🗂️ *حالة النسخ الاحتياطي التلقائي*\n\n`;
      txt += `╭┈┈⬡「 📊 *معلومات* 」\n`;
      txt += `┃ 🔘 مفعل: ${status.enabled ? "✅ نعم" : "❌ لا"}\n`;
      txt += `┃ ⏱️ المدة: ${status.interval}\n`;
      txt += `┃ 🔄 يعمل: ${status.isRunning ? "✅ نعم" : "❌ لا"}\n`;
      txt += `┃ 📅 آخر نسخة: ${status.lastBackup ? timeHelper.fromTimestamp(status.lastBackup, "DD MMMM YYYY HH:mm:ss") : "-"}\n`;
      txt += `┃ #️⃣ المجموع: ${status.backupCount} نسخة\n`;
      txt += `┃ 📤 الهدف: ${ownerNum}\n`;
      txt += `╰┈┈┈┈┈┈┈┈⬡`;

      return m.reply(txt);
    }

    case "now":
    case "manual":
    case "trigger": {
      await m.react("🕕");
      await m.reply(
        `🕕 *جاري إنشاء نسخة احتياطية...*\n\n> انتظر من فضلك، جاري إنشاء النسخة الاحتياطية...`,
      );

      try {
        await triggerManualBackup(sock);
        await m.react("✅");
        return m.reply(
          `✅ *اكتملت النسخة الاحتياطية*\n\n> تم إرسال النسخة الاحتياطية إلى المالك!`,
        );
      } catch (error) {
        await m.react('☢');
        await m.reply(te(m.prefix, m.command, m.pushName));
      }
      break;
    }

    default:
      return m.reply(
        `⚠️ *إجراء غير صالح*\n\n` +
          `> اختر: \`on\`, \`off\`, \`status\`, أو \`now\`\n` +
          `> مثال: \`${m.prefix}نسخ_احتياطي on 6h\``,
      );
  }
}

export { pluginConfig as config, handler }