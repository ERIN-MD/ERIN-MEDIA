// جدولة - أمر لإدارة الرسائل المجدولة

import te from "../../src/lib/maro-error.js";
import {
  scheduleMessage,
  cancelScheduledMessage,
  getScheduledMessages,
  getSchedulerStatus,
  formatTimeRemaining,
  getMsUntilTime,
} from "../../src/lib/maro-scheduler.js";

/**
 * تكوين البلوقن
 */
const pluginConfig = {
  name: "جدولة",
  alias: ["schedule"],
  category: "owner",
  description: "إنشاء تذكير أو جدول مخصص بنص مخصص",
  usage:
    ".جدولة <إضافة/تعديل/قائمة/فئة/قالب/تفاصيل/حذف/حالة> [خيارات]",
  example: ".جدولة قالب مدرسة 06:30",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  energi: 0,
  isEnabled: true,
};

const repeatKeywords = new Set(["repeat", "daily", "harian", "ulang", "يومي", "مكرر"]);
const repeatOffKeywords = new Set([
  "once",
  "sekali",
  "off",
  "false",
  "no",
  "tidak",
  "0",
  "مرة",
  "إيقاف",
]);

const presetTemplates = {
  sekolah: {
    category: "sekolah",
    title: "الذهاب إلى المدرسة",
    customText: "استحم، تناول الإفطار، تحقق من الكتب، وانطلق في الوقت المحدد.",
    repeat: true,
    target: "me",
  },
  kerja: {
    category: "kerja",
    title: "بدء العمل",
    customText: "جهز الأجهزة، تحقق من المهام، وابدأ العمل في الوقت المحدد.",
    repeat: true,
    target: "me",
  },
  turnamen: {
    category: "turnamen",
    title: "الاستعداد للبطولة",
    customText: "تحقق من التشكيلة، الغرفة، الاتصال، وكن جاهزاً قبل بدء المباراة.",
    repeat: false,
    target: "here",
  },
  date: {
    category: "date",
    title: "موعد",
    customText: "تجهز، تحقق من الموقع، واحضر في الوقت المحدد.",
    repeat: false,
    target: "me",
  },
};

const presetAliases = {
  school: "sekolah",
  sekolah: "sekolah",
  work: "kerja",
  kerja: "kerja",
  tournament: "turnamen",
  turnamen: "turnamen",
  scrim: "turnamen",
  date: "date",
  ngedate: "date",
  dating: "date",
};

const formatClock = (hour, minute) =>
  `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

const truncateText = (text = "", max = 90) =>
  text.length > max ? `${text.slice(0, max)}...` : text;

const normalizeCategory = (value = "") => String(value).trim().toLowerCase();

const getTaskCategory = (task) => normalizeCategory(task.category) || "عام";

const getTaskTitle = (task) => task.title || "تذكير";

const getTaskText = (task, fallback = "-") =>
  task.customText || task.message?.text || fallback;

const getTaskTargetLabel = (task) => task.targetLabel || task.jid;

function parseTimeString(value = "") {
  const normalized = String(value).trim().replace(/\./g, ":");
  const parts = normalized.split(":");

  if (parts.length !== 2) return null;

  const hour = Number(parts[0]);
  const minute = Number(parts[1]);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return { hour, minute, label: formatClock(hour, minute) };
}

function isRepeatToken(value = "") {
  return repeatKeywords.has(String(value).trim().toLowerCase());
}

function isRepeatOffToken(value = "") {
  return repeatOffKeywords.has(String(value).trim().toLowerCase());
}

function parseRepeatValue(value = "") {
  if (isRepeatToken(value)) return true;
  if (isRepeatOffToken(value)) return false;
  throw new Error(
    "❌ يجب أن تكون قيمة التكرار: repeat, daily, harian, once, sekali, off",
  );
}

function looksLikeTarget(value = "") {
  const normalized = String(value).trim().toLowerCase();
  const digits = normalized.replace(/[^0-9]/g, "");
  return (
    ["me", "self", "here", "this", "أنا", "هنا"].includes(normalized) ||
    normalized.includes("@") ||
    digits.length >= 5
  );
}

function resolveTarget(targetValue, m) {
  const raw = String(targetValue || "here").trim();
  const normalized = raw.toLowerCase();

  if (!raw || normalized === "here" || normalized === "this" || normalized === "هنا") {
    return {
      jid: m.chat,
      label: m.isGroup ? "هنا (هذه المحادثة)" : "هنا (المحادثة الخاصة)",
    };
  }

  if (normalized === "me" || normalized === "self" || normalized === "أنا") {
    return {
      jid: m.sender,
      label: "أنا",
    };
  }

  if (raw.includes("@")) {
    return {
      jid: raw,
      label: raw,
    };
  }

  const digits = raw.replace(/[^0-9]/g, "");

  if (!digits) {
    return {
      jid: m.chat,
      label: m.isGroup ? "هنا (هذه المحادثة)" : "هنا (المحادثة الخاصة)",
    };
  }

  return {
    jid: `${digits}@s.whatsapp.net`,
    label: `${digits}@s.whatsapp.net`,
  };
}

function extractTailOptions(
  m,
  parts,
  defaultTargetToken = "here",
  defaultRepeat = false,
) {
  const tail = [...parts];
  let targetToken = defaultTargetToken;
  let repeat = defaultRepeat;

  while (tail.length > 1) {
    const last = tail[tail.length - 1];

    if (isRepeatToken(last)) {
      repeat = true;
      tail.pop();
      continue;
    }

    if (isRepeatOffToken(last)) {
      repeat = false;
      tail.pop();
      continue;
    }

    if (looksLikeTarget(last)) {
      targetToken = tail.pop();
      continue;
    }

    break;
  }

  return {
    content: tail.join(" | ").trim(),
    target: resolveTarget(targetToken, m),
    repeat,
  };
}

function resolvePresetTemplate(name = "") {
  const normalized = normalizeCategory(name);
  const key = presetAliases[normalized] || normalized;

  if (!key || !presetTemplates[key]) {
    return { key: "", config: null };
  }

  return { key, config: presetTemplates[key] };
}

function getTaskState(task) {
  return {
    hour: task.hour,
    minute: task.minute,
    label: formatClock(task.hour, task.minute),
    category: getTaskCategory(task),
    title: getTaskTitle(task),
    customText: getTaskText(task, ""),
    repeat: Boolean(task.repeat),
    target: {
      jid: task.jid,
      label: getTaskTargetLabel(task),
    },
    mode: task.mode || "planner",
  };
}

function buildTaskPayload(id, parsed, extra = {}) {
  return {
    id,
    jid: parsed.target.jid,
    message: { text: parsed.customText },
    hour: parsed.hour,
    minute: parsed.minute,
    repeat: parsed.repeat,
    category: normalizeCategory(parsed.category) || "عام",
    title: parsed.title || "تذكير",
    customText: parsed.customText,
    targetLabel: parsed.target.label,
    mode: parsed.mode || "planner",
    createdAt: extra.createdAt || null,
    ...(extra.meta || {}),
  };
}

function buildHelpText(m) {
  return `📅 *مخطط الجدولة*

هذه الميزة لإنشاء جداول أو تذكيرات مخصصة.
يمكن استخدامها للمدرسة، الدروس، العمل، الاجتماعات، المواعيد، البطولات، أو أي حدث.

سيتم إرسال الرسالة بنص *مخصص* من المالك.

*الصيغة الأساسية:*
\`.جدولة إضافة <HH:MM> | <الفئة> | <العنوان> | <الرسالة> | [الهدف] | [التكرار]\`

*تعديل الجدول:*
\`.جدولة تعديل <المعرف> <HH:MM> | <الفئة> | <العنوان> | <الرسالة> | [الهدف] | [التكرار]\`
\`.جدولة تعديل <المعرف> time=08:00 | text=رفع الاجتماع | repeat=off\`

*تصفية حسب الفئة:*
\`.جدولة فئة\`
\`.جدولة فئة مدرسة\`

*قوالب سريعة:*
\`.جدولة قالب قائمة\`
\`.جدولة قالب مدرسة 06:30\`
\`.جدولة قالب عمل 09:00 | اجتماع صباحي | ادخل غرفة الاجتماع | هنا | مكرر\`

*الأهداف الاختيارية:*
• \`هنا\` = إرسال إلى هذه المحادثة
• \`أنا\` = إرسال إلى محادثة المالك
• \`628xxx@s.whatsapp.net\` = إرسال إلى رقم معين

*التكرار الاختياري:*
• \`مكرر\`
• \`يومي\`

*أمثلة:*
\`.جدولة إضافة 06:30 | مدرسة | الذهاب للمدرسة | استحم، تناول الإفطار، تحقق من الكتب | أنا | مكرر\`
\`.جدولة إضافة 12:00 | عمل | اجتماع الفريق | ادخل غرفة الاجتماع الساعة 12 ظهراً | هنا | مكرر\`
\`.جدولة إضافة 19:00 | موعد | عشاء | لا تنسى الحضور وأنيق وفي الوقت المحدد | أنا\`
\`.جدولة إضافة 20:00 | بطولة | مباراة مسائية | الغرفة مفتوحة قبل 15 دقيقة من البداية | هنا\`

*الأوامر الفرعية:*
• \`.جدولة قائمة\`
• \`.جدولة فئة <الاسم>\`
• \`.جدولة قالب <الاسم> <HH:MM>\`
• \`.جدولة تعديل <المعرف> ...\`
• \`.جدولة تفاصيل <المعرف>\`
• \`.جدولة حذف <المعرف>\`
• \`.جدولة حالة\``;
}

function parsePlannerInput(m, args) {
  const timeInfo = parseTimeString(args[1]);

  if (!timeInfo) {
    throw new Error(
      "❌ صيغة الوقت خاطئة. استخدم HH:MM أو HH.MM، مثال: 08:00",
    );
  }

  const raw = args.slice(2).join(" ").trim();

  if (!raw) {
    throw new Error(
      "❌ الصيغة: `.جدولة إضافة <HH:MM> | <الفئة> | <العنوان> | <الرسالة> | [الهدف] | [التكرار]`",
    );
  }

  if (!raw.includes("|")) {
    const target = resolveTarget(args[2], m);
    let repeat = false;
    let messageStart = 3;

    if (isRepeatToken(args[3])) {
      repeat = true;
      messageStart = 4;
    }

    const customText = args.slice(messageStart).join(" ").trim();

    if (!customText) {
      throw new Error("❌ نص التذكير لا يمكن أن يكون فارغاً");
    }

    return {
      ...timeInfo,
      category: "عام",
      title: "تذكير",
      customText,
      repeat,
      target,
      mode: "legacy",
    };
  }

  const segments = raw
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  if (segments.length < 3) {
    throw new Error(
      "❌ الصيغة الجديدة على الأقل: `.جدولة إضافة <HH:MM> | <الفئة> | <العنوان> | <الرسالة>`",
    );
  }

  const category = normalizeCategory(segments[0]) || "عام";
  const title = segments[1];
  const parsedTail = extractTailOptions(m, segments.slice(2));
  const customText = parsedTail.content;

  if (!customText) {
    throw new Error("❌ نص التذكير لا يمكن أن يكون فارغاً");
  }

  return {
    ...timeInfo,
    category,
    title,
    customText,
    repeat: parsedTail.repeat,
    target: parsedTail.target,
    mode: "planner",
  };
}

function parsePresetInput(m, args) {
  const { key, config } = resolvePresetTemplate(args[1]);

  if (!config) {
    throw new Error(
      "❌ القالب غير معروف. استخدم `.جدولة قالب قائمة` لعرض القوالب المتاحة.",
    );
  }

  const timeInfo = parseTimeString(args[2]);

  if (!timeInfo) {
    throw new Error(
      "❌ الصيغة: `.جدولة قالب <الاسم> <HH:MM> [| <العنوان> | <الرسالة> | [الهدف] | [التكرار]]`",
    );
  }

  const raw = args.slice(3).join(" ").trim();
  let title = config.title;
  let customText = config.customText;
  let repeat = config.repeat;
  let target = resolveTarget(config.target, m);

  if (raw) {
    const segments = raw
      .split("|")
      .map((part) => part.trim())
      .filter(Boolean);

    if (segments.length === 1) {
      customText = segments[0];
    } else if (segments.length > 1) {
      title = segments[0] || title;
      const parsedTail = extractTailOptions(
        m,
        segments.slice(1),
        config.target,
        config.repeat,
      );

      customText = parsedTail.content || customText;
      repeat = parsedTail.repeat;
      target = parsedTail.target;
    }
  }

  return {
    ...timeInfo,
    category: config.category,
    title,
    customText,
    repeat,
    target,
    mode: "preset",
    presetKey: key,
  };
}

function parseEditInput(m, args, task) {
  const raw = args.slice(2).join(" ").trim();

  if (!raw) {
    throw new Error(
      "❌ صيغة التعديل: `.جدولة تعديل <المعرف> <HH:MM> | <الفئة> | <العنوان> | <الرسالة> | [الهدف] | [التكرار]` أو `.جدولة تعديل <المعرف> time=08:00 | text=... | repeat=off`",
    );
  }

  if (!raw.includes("=")) {
    const parsed = parsePlannerInput(m, ["add", ...args.slice(2)]);
    return {
      ...parsed,
      mode: task.mode || parsed.mode,
    };
  }

  const state = getTaskState(task);
  const segments = raw
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!segments.length) {
    throw new Error("❌ لا توجد حقول للتعديل.");
  }

  for (const segment of segments) {
    const separatorIndex = segment.indexOf("=");

    if (separatorIndex === -1) {
      throw new Error(
        "❌ صيغة التعديل الجزئي يجب أن تكون `field=value`، مثال: `time=08:00 | text=رفع الاجتماع`",
      );
    }

    const field = normalizeCategory(segment.slice(0, separatorIndex));
    const value = segment.slice(separatorIndex + 1).trim();

    if (!value) {
      throw new Error(`❌ قيمة الحقل \`${field}\` لا يمكن أن تكون فارغة`);
    }

    switch (field) {
      case "time":
      case "waktu":
      case "jam": {
        const timeInfo = parseTimeString(value);

        if (!timeInfo) {
          throw new Error(
            "❌ صيغة الوقت في التعديل خاطئة. استخدم HH:MM أو HH.MM",
          );
        }

        state.hour = timeInfo.hour;
        state.minute = timeInfo.minute;
        state.label = timeInfo.label;
        break;
      }
      case "category":
      case "kategori":
      case "فئة":
        state.category = normalizeCategory(value) || "عام";
        break;
      case "title":
      case "judul":
      case "عنوان":
        state.title = value;
        break;
      case "text":
      case "pesan":
      case "message":
      case "msg":
      case "نص":
        state.customText = value;
        break;
      case "target":
      case "tujuan":
      case "jid":
      case "هدف":
        state.target = resolveTarget(value, m);
        break;
      case "repeat":
      case "ulang":
      case "تكرار":
        state.repeat = parseRepeatValue(value);
        break;
      default:
        throw new Error(
          "❌ حقل التعديل غير معروف. استخدم: time, kategori, judul, text, target, repeat",
        );
    }
  }

  if (!state.customText) {
    throw new Error("❌ نص التذكير لا يمكن أن يكون فارغاً");
  }

  return state;
}

function findTaskById(taskId) {
  return getScheduledMessages().find((task) => task.id === taskId) || null;
}

function buildCategoryListText(tasks) {
  const categoryCounts = tasks.reduce((accumulator, task) => {
    const category = getTaskCategory(task);
    accumulator.set(category, (accumulator.get(category) || 0) + 1);
    return accumulator;
  }, new Map());

  const entries = [...categoryCounts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );

  let text = "🏷️ *فئات الجداول النشطة*\n\n";

  for (const [category, total] of entries) {
    text += `• ${category} (${total})\n`;
  }

  text += "\nاستخدم `.جدولة فئة <الاسم>` لتصفية قائمة الجداول.";
  return text;
}

function buildPresetListText() {
  let text = "⚡ *قوالب الجدولة السريعة*\n\n";

  for (const [name, preset] of Object.entries(presetTemplates)) {
    text += `• *${name}*\n`;
    text += `  📝 ${preset.title}\n`;
    text += `  🔄 ${preset.repeat ? "يومي" : "مرة واحدة"}\n`;
    text += `  📍 الهدف الافتراضي: ${preset.target}\n`;
    text += `  💬 ${truncateText(preset.customText, 100)}\n\n`;
  }

  text += "الاستخدام:\n";
  text += "`.جدولة قالب مدرسة 06:30`\n";
  text +=
    "`.جدولة قالب عمل 09:00 | اجتماع صباحي | ادخل غرفة الاجتماع | هنا | مكرر`";
  return text;
}

function buildListText(tasks, header = null) {
  const sorted = [...tasks].sort(
    (a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute),
  );
  let text = `${header || `📅 *مخطط الجدولة (${sorted.length})*`}\n\n`;

  for (const task of sorted) {
    const msUntil = getMsUntilTime(task.hour, task.minute);
    text += `• *${getTaskTitle(task)}*\n`;
    text += `  🆔 ${task.id}\n`;
    text += `  🏷️ ${getTaskCategory(task)}\n`;
    text += `  ⏰ ${formatClock(task.hour, task.minute)} WIB\n`;
    text += `  📍 ${getTaskTargetLabel(task)}\n`;
    text += `  🔄 ${task.repeat ? "يومي" : "مرة واحدة"}\n`;
    text += `  🕕 ${formatTimeRemaining(msUntil)} متبقٍ\n`;
    text += `  📝 ${truncateText(getTaskText(task))}\n\n`;
  }

  return text.trim();
}

function buildDetailText(task) {
  const msUntil = getMsUntilTime(task.hour, task.minute);
  return `📌 *تفاصيل الجدول*

🆔 المعرف: \`${task.id}\`
🏷️ الفئة: ${getTaskCategory(task)}
📝 العنوان: ${getTaskTitle(task)}
⏰ الوقت: ${formatClock(task.hour, task.minute)} WIB
📍 الهدف: ${getTaskTargetLabel(task)}
🔄 الوضع: ${task.repeat ? "يومي" : "مرة واحدة"}
🕕 التشغيل التالي: ${formatTimeRemaining(msUntil)} متبقٍ
🗓️ تاريخ الإنشاء: ${task.createdAt || "-"}

الرسالة المخصصة:
${getTaskText(task)}`;
}

/**
 * معالج أمر الجدولة
 */
async function handler(m, { sock, args }) {
  const subCommand = args[0]?.toLowerCase();

  if (!subCommand || ["help", "menu", "مساعدة"].includes(subCommand)) {
    await m.reply(buildHelpText(m));
    return;
  }

  switch (subCommand) {
    case "add":
    case "إضافة": {
      try {
        const parsed = parsePlannerInput(m, args);
        const id = `sched_${Date.now()}`;

        await scheduleMessage(buildTaskPayload(id, parsed), sock);

        const msUntil = getMsUntilTime(parsed.hour, parsed.minute);

        await m.reply(`✅ *تم إنشاء الجدول بنجاح*

🆔 المعرف: \`${id}\`
🏷️ الفئة: ${parsed.category}
📝 العنوان: ${parsed.title}
⏰ الوقت: ${parsed.label} WIB
📍 الهدف: ${parsed.target.label}
🔄 الوضع: ${parsed.repeat ? "يومي" : "مرة واحدة"}
🕕 التشغيل التالي: ${formatTimeRemaining(msUntil)} متبقٍ

الرسالة المخصصة:
${truncateText(parsed.customText, 180)}`);
      } catch (error) {
        await m.reply(
          error.message?.startsWith("❌")
            ? error.message
            : te(m.prefix, m.command, m.pushName),
        );
      }
      break;
    }

    case "preset":
    case "قالب": {
      if (!args[1] || ["list", "all", "قائمة"].includes(normalizeCategory(args[1]))) {
        await m.reply(buildPresetListText());
        return;
      }

      try {
        const parsed = parsePresetInput(m, args);
        const id = `sched_${Date.now()}`;

        await scheduleMessage(
          buildTaskPayload(id, parsed, {
            meta: { presetKey: parsed.presetKey },
          }),
          sock,
        );

        const msUntil = getMsUntilTime(parsed.hour, parsed.minute);

        await m.reply(`✅ *تم إنشاء جدول القالب بنجاح*

🆔 المعرف: \`${id}\`
⚡ القالب: ${parsed.presetKey}
🏷️ الفئة: ${parsed.category}
📝 العنوان: ${parsed.title}
⏰ الوقت: ${parsed.label} WIB
📍 الهدف: ${parsed.target.label}
🔄 الوضع: ${parsed.repeat ? "يومي" : "مرة واحدة"}
🕕 التشغيل التالي: ${formatTimeRemaining(msUntil)} متبقٍ

الرسالة المخصصة:
${truncateText(parsed.customText, 180)}`);
      } catch (error) {
        await m.reply(
          error.message?.startsWith("❌")
            ? error.message
            : te(m.prefix, m.command, m.pushName),
        );
      }
      break;
    }

    case "edit":
    case "تعديل": {
      const taskId = args[1];

      if (!taskId) {
        await m.reply("❌ الصيغة: `.جدولة تعديل <المعرف> ...`");
        return;
      }

      const task = findTaskById(taskId);

      if (!task) {
        await m.reply(`❌ الجدول بالمعرف \`${taskId}\` غير موجود`);
        return;
      }

      try {
        const parsed = parseEditInput(m, args, task);

        await scheduleMessage(
          buildTaskPayload(task.id, parsed, {
            createdAt: task.createdAt,
            meta: { presetKey: task.presetKey || null },
          }),
          sock,
        );

        const msUntil = getMsUntilTime(parsed.hour, parsed.minute);

        await m.reply(`✅ *تم تحديث الجدول بنجاح*

🆔 المعرف: \`${task.id}\`
🏷️ الفئة: ${parsed.category}
📝 العنوان: ${parsed.title}
⏰ الوقت: ${parsed.label} WIB
📍 الهدف: ${parsed.target.label}
🔄 الوضع: ${parsed.repeat ? "يومي" : "مرة واحدة"}
🕕 التشغيل التالي: ${formatTimeRemaining(msUntil)} متبقٍ

الرسالة المخصصة:
${truncateText(parsed.customText, 180)}`);
      } catch (error) {
        await m.reply(
          error.message?.startsWith("❌")
            ? error.message
            : te(m.prefix, m.command, m.pushName),
        );
      }
      break;
    }

    case "list":
    case "قائمة": {
      const tasks = getScheduledMessages();

      if (tasks.length === 0) {
        await m.reply(
          "📅 لا توجد جداول نشطة. استخدم `.جدولة` لعرض صيغة المخطط.",
        );
        return;
      }

      await m.reply(buildListText(tasks));
      break;
    }

    case "kategori":
    case "category":
    case "فئة": {
      const tasks = getScheduledMessages();

      if (tasks.length === 0) {
        await m.reply(
          "📅 لا توجد جداول نشطة. استخدم `.جدولة` لعرض صيغة المخطط.",
        );
        return;
      }

      const categoryName = normalizeCategory(args.slice(1).join(" "));

      if (!categoryName) {
        await m.reply(buildCategoryListText(tasks));
        return;
      }

      const filteredTasks = tasks.filter(
        (task) => getTaskCategory(task) === categoryName,
      );

      if (!filteredTasks.length) {
        await m.reply(
          `❌ لا توجد جداول نشطة للفئة \`${categoryName}\``,
        );
        return;
      }

      await m.reply(
        buildListText(
          filteredTasks,
          `🏷️ *الفئة: ${categoryName.toUpperCase()} (${filteredTasks.length})*`,
        ),
      );
      break;
    }

    case "detail":
    case "show":
    case "view":
    case "تفاصيل": {
      const taskId = args[1];

      if (!taskId) {
        await m.reply("❌ الصيغة: `.جدولة تفاصيل <المعرف>`");
        return;
      }

      const task = findTaskById(taskId);

      if (!task) {
        await m.reply(`❌ الجدول بالمعرف \`${taskId}\` غير موجود`);
        return;
      }

      await m.reply(buildDetailText(task));
      break;
    }

    case "del":
    case "delete":
    case "remove":
    case "حذف": {
      const taskId = args[1];

      if (!taskId) {
        await m.reply("❌ الصيغة: `.جدولة حذف <المعرف>`");
        return;
      }

      const existingTask = findTaskById(taskId);
      const cancelled = cancelScheduledMessage(taskId);

      if (cancelled) {
        await m.reply(
          `✅ تم حذف الجدول \`${taskId}\`${existingTask?.title ? `\n\n📝 ${existingTask.title}` : ""}`,
        );
      } else {
        await m.reply(`❌ الجدول \`${taskId}\` غير موجود`);
      }
      break;
    }

    case "status":
    case "حالة": {
      const status = getSchedulerStatus();
      const tasks = getScheduledMessages();
      const categories = [
        ...new Set(tasks.map((task) => getTaskCategory(task))),
      ];

      const text = `📊 *حالة مخطط الجدولة*

📝 الجداول النشطة: ${status.scheduledMessagesCount}
🏷️ الفئات النشطة: ${categories.length ? categories.join(", ") : "-"}
📨 التذكيرات المرسلة: ${status.totalMessagesSent}
🔄 إعادة تعيين الحد اليومي: ${status.dailyResetEnabled ? "✅ نشط" : "❌ غير نشط"}
📅 آخر إعادة تعيين: ${status.lastLimitReset}

استخدم \`.جدولة قائمة\` لعرض جميع الجداول النشطة.`;

      await m.reply(text);
      break;
    }

    default:
      await m.reply(
        "❌ الأمر الفرعي غير معروف. استخدم: إضافة, تعديل, قائمة, فئة, قالب, تفاصيل, حذف, حالة",
      );
  }
}

export { pluginConfig as config, handler };