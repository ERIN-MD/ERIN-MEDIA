import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "ترحيب_المالك",
  alias: ["autosambut"],
  category: "group",
  description: "ضبط ميزة الترحيب التلقائي عند ظهور المالك بعد فترة غياب طويلة",
  usage: ".ترحيب_المالك on/off/delay/add/del/list",
  example: ".ترحيب_المالك on",
  isOwner: true,
  isGroup: true,
  cooldown: 3,
  isEnabled: true,
};

function parseTime(str) {
  const match = str.match(/^([\d.]+)([a-zA-Z]+)$/);
  if (!match) return null;
  const val = parseFloat(match[1]);
  const unit = match[2].toLowerCase();

  if (unit.startsWith('s')) return val * 1000;
  if (unit.startsWith('m')) return val * 60 * 1000;
  if (unit.startsWith('h')) return val * 60 * 60 * 1000;
  if (unit.startsWith('d')) return val * 24 * 60 * 60 * 1000;
  if (unit.startsWith('w')) return val * 7 * 24 * 60 * 60 * 1000;
  if (unit.startsWith('y')) return val * 365 * 24 * 60 * 60 * 1000;
  return null;
}

function formatTime(ms) {
  if (ms < 60000) return `${ms / 1000} ثانية`;
  if (ms < 3600000) return `${ms / 60000} دقيقة`;
  if (ms < 86400000) return `${ms / 3600000} ساعة`;
  if (ms < 604800000) return `${ms / 86400000} يوم`;
  return `${ms / 86400000} يوم`;
}

async function handler(m, { sock, db }) {
  const args = m.args || [];
  const action = args[0]?.toLowerCase();
  const isGlobal = args.includes("--global");

  const database = getDatabase();
  let groupData = database.getGroup(m.chat);
  if (!groupData.autoSambut) {
    groupData.autoSambut = {
      enabled: false,
      delayMs: 2 * 60 * 60 * 1000,
      pesanList: ["مرحباً {user}! نورت المجموعة 🙇‍♂️"],
      lastChats: {}
    };
    database.setGroup(m.chat, { autoSambut: groupData.autoSambut });
  }
  if (groupData.autoSambut.pesan !== undefined) {
    if (!groupData.autoSambut.pesanList) {
      groupData.autoSambut.pesanList = [groupData.autoSambut.pesan];
    }
    delete groupData.autoSambut.pesan;
    database.setGroup(m.chat, { autoSambut: groupData.autoSambut });
  }
  if (!Array.isArray(groupData.autoSambut.pesanList) || groupData.autoSambut.pesanList.length === 0) {
    groupData.autoSambut.pesanList = ["مرحباً {user}! نورت المجموعة 🙇‍♂️"];
  }

  if (!action) {
    const status = groupData.autoSambut.enabled ? "مفعل ✅" : "معطل ❌";
    const delayMs = groupData.autoSambut.delayMs || 7200000;
    const totalPesan = groupData.autoSambut.pesanList.length;

    return m.reply(
      `⚠️ *نظام ترحيب المالك*\n\n` +
      `نظام ترحيب تلقائي بالمالك في المجموعة بشكل عشوائي عند ظهوره بعد فترة غياب طويلة.\n` +
      `الحالة: *${status}*\n` +
      `حد وقت الغياب: *${formatTime(delayMs)}*\n` +
      `عدد رسائل الترحيب: *${totalPesan}*\n\n` +
      `*الاستخدام:*\n` +
      `• *${m.prefix}ترحيب_المالك on/off* — تشغيل/إيقاف الميزة\n` +
      `• *${m.prefix}ترحيب_المالك delay <الوقت>* — تغيير حد وقت الغياب\n\n` +
      `*إدارة رسائل الترحيب:*\n` +
      `• *${m.prefix}ترحيب_المالك list* — عرض جميع رسائل الترحيب\n` +
      `• *${m.prefix}ترحيب_المالك add <نص>* — إضافة رسالة ترحيب جديدة\n` +
      `• *${m.prefix}ترحيب_المالك del <رقم>* — حذف رسالة حسب الرقم\n\n` +
      `*ملاحظات:*\n` +
      `1. صيغ الوقت: *s* (ثانية), *m* (دقيقة), *h* (ساعة), *d* (يوم)\n` +
      `2. استخدم *{name}* لاسم المالك و *{user}* لمنشن المالك\n` +
      `3. أضف *--global* لتطبيق الإعدادات على جميع المجموعات`
    );
  }

  if (action === "on" || action === "off") {
    const isEnable = action === "on";
    if (isGlobal) {
      const groups = await sock.groupFetchAllParticipating();
      let count = 0;
      for (const jid of Object.keys(groups)) {
        let gData = database.getGroup(jid) || {};
        gData.autoSambut = {
          enabled: isEnable,
          delayMs: groupData.autoSambut.delayMs,
          pesanList: [...groupData.autoSambut.pesanList],
          lastChats: {}
        };
        database.setGroup(jid, { autoSambut: gData.autoSambut });
        count++;
      }
      return m.reply(`${isEnable ? '✅' : '❌'} *تم ${isEnable ? 'تفعيل' : 'تعطيل'} ترحيب المالك الشامل!*\n\nجميع المجموعات (${count}) تستخدم الآن نفس نظام الترحيب.`);
    }

    groupData.autoSambut.enabled = isEnable;
    database.setGroup(m.chat, { autoSambut: groupData.autoSambut });
    return m.reply(isEnable ? `✅ *تم تفعيل ترحيب المالك!*` : `❌ *تم تعطيل ترحيب المالك.*`);
  }

  if (action === "delay") {
    const timeInput = args[1];
    if (!timeInput) return m.reply(`يرجى تحديد الوقت! مثال: \`${m.prefix}ترحيب_المالك delay 2h\``);

    const parsedMs = parseTime(timeInput);
    if (!parsedMs) {
      return m.reply(`صيغة الوقت غير صالحة. استخدم: \`2h\` (ساعتين), \`30m\` (30 دقيقة).`);
    }

    if (isGlobal) {
      const groups = await sock.groupFetchAllParticipating();
      let count = 0;
      for (const jid of Object.keys(groups)) {
        let gData = database.getGroup(jid) || {};
        gData.autoSambut = {
          enabled: groupData.autoSambut.enabled,
          delayMs: parsedMs,
          pesanList: [...groupData.autoSambut.pesanList],
          lastChats: {}
        };
        database.setGroup(jid, { autoSambut: gData.autoSambut });
        count++;
      }
      return m.reply(`⏱️ *تم تغيير وقت الغياب الشامل إلى ${formatTime(parsedMs)} لـ ${count} مجموعة!*`);
    }

    groupData.autoSambut.delayMs = parsedMs;
    database.setGroup(m.chat, { autoSambut: groupData.autoSambut });
    return m.reply(`⏱️ *تم تغيير وقت الغياب!*\n\nالآن البوت سيرحب بك بعد عدم كتابتك لأي شيء في المجموعة لمدة *${formatTime(parsedMs)}*.`);
  }

  if (action === "list") {
    let listText = `📜 *قائمة رسائل ترحيب المالك*\n\nالمجموع *${groupData.autoSambut.pesanList.length}* رسالة:\n\n`;
    groupData.autoSambut.pesanList.forEach((text, index) => {
      listText += `*${index + 1}.* ${text}\n\n`;
    });
    listText += `_استخدم \`${m.prefix}ترحيب_المالك del <رقم>\` للحذف._`;
    return m.reply(listText);
  }

  if (action === "add") {
    const newMsg = args.slice(1).filter(v => v !== '--global').join(" ").trim();
    if (!newMsg) {
      return m.reply(`يرجى إدخال نص الترحيب.\nمثال: \`${m.prefix}ترحيب_المالك add مرحباً بك {user}!\``);
    }

    groupData.autoSambut.pesanList.push(newMsg);
    database.setGroup(m.chat, { autoSambut: groupData.autoSambut });

    if (isGlobal) {
      const groups = await sock.groupFetchAllParticipating();
      let count = 0;
      for (const jid of Object.keys(groups)) {
        let gData = database.getGroup(jid) || {};
        gData.autoSambut = {
          enabled: groupData.autoSambut.enabled,
          delayMs: groupData.autoSambut.delayMs,
          pesanList: [...groupData.autoSambut.pesanList],
          lastChats: {}
        };
        database.setGroup(jid, { autoSambut: gData.autoSambut });
        count++;
      }
      return m.reply(`💬 *تمت إضافة رسالة جديدة شاملة (${count} مجموعة)!*\n\nالرسالة:\n"${newMsg}"`);
    }

    return m.reply(`💬 *تمت إضافة الرسالة بنجاح!*\nالآن لديك ${groupData.autoSambut.pesanList.length} رسالة ترحيب.`);
  }

  if (action === "del") {
    const indexInput = parseInt(args[1]);
    if (isNaN(indexInput) || indexInput < 1 || indexInput > groupData.autoSambut.pesanList.length) {
      return m.reply(`يرجى إدخال رقم صحيح.\nلعرض الأرقام: \`${m.prefix}ترحيب_المالك list\`.`);
    }
    if (groupData.autoSambut.pesanList.length <= 1) {
      return m.reply(`لا يمكن الحذف! يجب وجود رسالة واحدة على الأقل.`);
    }

    const removedMsg = groupData.autoSambut.pesanList.splice(indexInput - 1, 1)[0];
    database.setGroup(m.chat, { autoSambut: groupData.autoSambut });

    if (isGlobal) {
      const groups = await sock.groupFetchAllParticipating();
      let count = 0;
      for (const jid of Object.keys(groups)) {
        let gData = database.getGroup(jid) || {};
        gData.autoSambut = {
          enabled: groupData.autoSambut.enabled,
          delayMs: groupData.autoSambut.delayMs,
          pesanList: [...groupData.autoSambut.pesanList],
          lastChats: {}
        };
        database.setGroup(jid, { autoSambut: gData.autoSambut });
        count++;
      }
      return m.reply(`🗑️ *تم حذف الرسالة شاملة (${count} مجموعة)!*\n\nالمحذوفة:\n"${removedMsg}"`);
    }

    return m.reply(`🗑️ *تم حذف الرسالة!*\n\nالمحذوفة:\n"${removedMsg}"\nالمتبقي: ${groupData.autoSambut.pesanList.length} رسالة`);
  }

  return m.reply(`أمر غير صالح. اكتب \`${m.prefix}ترحيب_المالك\` لعرض المساعدة.`);
}

export { pluginConfig as config, handler };