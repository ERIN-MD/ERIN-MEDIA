import { getDatabase } from "../../src/lib/maro-database.js";
import ms from "ms";

const pluginConfig = {
  name: "صلاحية",
  alias: ["akses"],
  category: "owner",
  description: "منح صلاحية مؤقتة/دائمة لاستخدام أوامر معينة للمستخدمين",
  usage: ".اضف_صلاحية <الأمر> <المدة> <المستخدم>",
  example: ".اضف_صلاحية addowner 30d @المستخدم",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 0,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock, plugins }) {
  const db = getDatabase();
  const cmd = m.command.toLowerCase();
  const isAdd = ["اضف_صلاحية", "addakses", "addaccess"].includes(cmd);
  const isDel = ["delakses", "delaccess"].includes(cmd);
  const isList = ["listakses", "listaccess"].includes(cmd);
  let target = m.mentionedJid?.[0];
  if (!target && m.quoted) target = m.quoted.sender;
  if (!target && m.args.length > 0) {
    for (const arg of m.args) {
      if (/^\d{5,15}$/.test(arg)) {
        target = arg + "@s.whatsapp.net";
        break;
      } else if (/^@\d+/.test(arg)) {
        target = arg.replace("@", "") + "@s.whatsapp.net";
        break;
      }
    }
  }
  let commandTarget = null;
  let durationTarget = null;
  if (isAdd) {
    if (!target)
      return m.reply(
        `❌ *هدف غير صالح*\n\nمنشن المستخدم / رد على شات / اكتب رقم الهدف`,
      );
    const cleanArgs = m.args.filter(
      (a) => !a.includes("@") && !/^\d{10,}$/.test(a),
    );
    if (cleanArgs.length < 2) {
      return m.reply(
        `⚠️ *صيغة خاطئة*\n\n` +
          `الصيغة: \`${m.prefix}اضف_صلاحية <الأمر> <المدة> <الهدف>\`\n\n` +
          `*مثال:*\n` +
          `> \`${m.prefix}اضف_صلاحية addowner 30d @المستخدم\` (30 يوم)\n` +
          `> \`${m.prefix}اضف_صلاحية unban دائم @المستخدم\` (للأبد)\n\n` +
          `*المدد المدعومة:* 1h, 1d, 30d, 1y`,
      );
    }
    commandTarget = cleanArgs[0].toLowerCase();
    durationTarget = cleanArgs[1].toLowerCase();
  }

  const user = db.getUser(target) || {};
  if (!user.access) user.access = [];
  if (isList) {
    if (!target) target = m.sender;
    const targetData = db.getUser(target) || {};
    const accessList = targetData.access || [];
    const now = Date.now();
    const activeAccess = accessList.filter(
      (a) => a.expired === null || a.expired > now,
    );
    if (activeAccess.length !== accessList.length) {
      targetData.access = activeAccess;
      db.setUser(target, targetData);
    }

    if (activeAccess.length === 0) {
      return m.reply(
        `📊 *صلاحيات المستخدم*\n\nالهدف: @${target.split("@")[0]}\nالحالة: *لا يمتلك صلاحيات خاصة*`,
        {
          mentions: sock.parseMention(`@${target.split("@")[0]}`),
        },
      );
    }

    let txt = `📊 *صلاحيات المستخدم*\n\n`;
    txt += `الهدف: @${target.split("@")[0]}\n`;
    txt += `المجموع: *${activeAccess.length}* أوامر\n`;
    txt += `━━━━━━━━━━━━━━━\n\n`;

    activeAccess.forEach((acc, i) => {
      let expiredTxt = "♾️ دائم";
      if (acc.expired) {
        const timeLeft = acc.expired - now;
        if (timeLeft > 0) {
          expiredTxt = "🕕 " + ms(timeLeft, { long: true });
        } else {
          expiredTxt = "🔴 منتهي";
        }
      }

      txt += `${i + 1}. *${acc.cmd}*\n`;
      txt += `   └ ${expiredTxt}\n`;
    });

    return m.reply(txt, { mentions: [target] });
  }
  if (isAdd) {
    let expiredTime = null;
    if (durationTarget !== "permanent" && durationTarget !== "perm" && durationTarget !== "دائم") {
      try {
        const durationMs = ms(durationTarget);
        if (!durationMs)
          return m.reply(`❌ صيغة المدة خاطئة! استخدم: 1h, 1d, 30d`);
        expiredTime = Date.now() + durationMs;
      } catch {
        return m.reply(`❌ صيغة المدة غير معروفة!`);
      }
    }

    const existingIdx = user.access.findIndex((a) => a.cmd === commandTarget);
    if (existingIdx !== -1) {
      user.access[existingIdx].expired = expiredTime;
      db.setUser(target, user);
      return m.reply(
        `✅ *تم تحديث الصلاحية*\n\n` +
          `الأمر: \`${commandTarget}\`\n` +
          `المدة: *${durationTarget}*\n` +
          `الهدف: @${target.split("@")[0]}`,
      );
    }
    user.access.push({
      cmd: commandTarget,
      expired: expiredTime,
    });

    db.setUser(target, user);

    await m.reply(
      `✅ *تم منح الصلاحية*\n\n` +
        `┃ 🔑 الأمر: \`${commandTarget}\`\n` +
        `┃ ⏱️ المدة: *${durationTarget}*\n` +
        `┃ 👤 الهدف: @${target.split("@")[0]}\n`,
      { mentions: [target] },
    );
  }
  if (isDel) {
    if (!target) return m.reply(`❌ قم بمنشن المستخدم المراد حذف صلاحيته!`);
    const now = Date.now();
    const activeAccess = user.access.filter(
      (a) => a.expired === null || a.expired > now,
    );
    let specificCmd = m.args.find((a) => !a.includes("@") && !/^\d+$/.test(a));
    if (specificCmd) {
      specificCmd = specificCmd.toLowerCase();
      const idx = user.access.findIndex((a) => a.cmd === specificCmd);
      if (idx === -1)
        return m.reply(`❌ المستخدم لا يمتلك صلاحية الأمر \`${specificCmd}\``);

      user.access.splice(idx, 1);
      db.setUser(target, user);
      return m.reply(
        `✅ صلاحية \`${specificCmd}\` ألغيت بنجاح من @${target.split("@")[0]}`,
      );
    }

    if (activeAccess.length === 0) {
      return m.reply(`⚠️ هذا المستخدم لا يمتلك أي صلاحيات أوامر.`);
    }
    const rows = activeAccess.map((acc) => {
      const exp = acc.expired ? ms(acc.expired - now) : "دائم";
      return {
        title: `حذف: ${acc.cmd}`,
        description: `المدة المتبقية: ${exp}`,
        id: `${m.prefix}delakses ${acc.cmd} ${target}`,
      };
    });
    const listMessage = {
      text: `🔓 *إلغاء الصلاحية*\n\nاختر صلاحية الأمر المراد حذفها من @${target.split("@")[0]}`,
      title: "إدارة الصلاحيات",
      buttonText: "اختر الأمر",
      sections: [
        {
          title: "قائمة الصلاحيات النشطة",
          rows: rows,
        },
      ],
    };

    return sock.sendMessage(m.chat, listMessage, { quoted: m });
  }
}

export { pluginConfig as config, handler };