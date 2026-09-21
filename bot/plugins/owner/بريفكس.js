import fs from "fs";
import path from "path";
import config from "../../config.js";
import { invalidatePrefixCache } from "../../src/lib/maro-serialize.js";

const PREF_DB_PATH = path.join(process.cwd(), "database", "prefix.json");
const DEFAULT_PREFIX = config.command?.prefix || ".";

function normalizeData(data = {}) {
  return {
    prefixes: Array.isArray(data.prefixes)
      ? [...new Set(data.prefixes.filter((prefix) => typeof prefix === "string" && prefix.length > 0 && prefix.length <= 5))]
      : [],
    noprefix: data.noprefix === true,
  };
}

function loadPrefixes() {
  try {
    if (fs.existsSync(PREF_DB_PATH)) {
      return normalizeData(JSON.parse(fs.readFileSync(PREF_DB_PATH, "utf8")));
    }
  } catch (error) {
    console.error("[Prefix] Failed to read prefix database:", error.message);
  }

  return { prefixes: [], noprefix: false };
}

function savePrefixes(data) {
  const normalized = normalizeData(data);
  const dir = path.dirname(PREF_DB_PATH);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(PREF_DB_PATH, JSON.stringify(normalized, null, 2), "utf8");

  // parseCommand يحتفظ بالبادئات مؤقتاً؛ يجب تحديثه مباشرة بعد كل تعديل.
  invalidatePrefixCache();
  return normalized;
}

function getAllPrefixes() {
  const data = loadPrefixes();
  return [...new Set([DEFAULT_PREFIX, ...data.prefixes])];
}

function isNoPrefix() {
  return loadPrefixes().noprefix;
}

function cleanAction(value = "") {
  return String(value).trim().toLowerCase();
}

function formatHeader(title, icon = "⚙️") {
  return `╭━━〔 ${icon} *${title}* 〕━━╮`;
}

function formatFooter() {
  return "╰━━〔 Tarboo Bot 〕━━╯";
}

function formatList(data) {
  const all = getAllPrefixes();
  const custom = data.prefixes.length
    ? data.prefixes.map((prefix, index) => `│ ${index + 1}. \`${prefix}\``).join("\n")
    : "│ لا توجد بادئات إضافية حالياً";

  return [
    formatHeader("إدارة البادئات", "🧭"),
    "│",
    `│ البادئة الأساسية: \`${DEFAULT_PREFIX}\``,
    `│ الوضع بدون بادئة: ${data.noprefix ? "🟢 مفعّل" : "🔴 معطّل"}`,
    "│",
    "├─〔 البادئات الإضافية 〕",
    custom,
    "│",
    `│ الإجمالي النشط: \`${all.length}\``,
    "│",
    "│ الأوامر: عرض • تفعيل • تعطيل • اضف • حذف • تصفير",
    formatFooter(),
  ].join("\n");
}

const pluginConfig = {
  name: "بريفكس",
  alias: ["بادئة", "بادئات"],
  category: "owner",
  description: "إدارة البادئة الأساسية والبادئات الإضافية ووضع الأوامر بلا بادئة",
  usage: ".بريفكس <عرض/تفعيل/تعطيل/اضف/حذف/تصفير>",
  example: ".بريفكس اضف ! #",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  energi: 0,
  isEnabled: true,
};

async function handler(m) {
  const args = Array.isArray(m.args) ? m.args : [];
  const action = cleanAction(args[0]);
  const items = args.slice(1).map((item) => String(item).trim()).filter(Boolean);
  const data = loadPrefixes();

  if (!action || action === "عرض" || action === "قائمة") {
    await m.reply(formatList(data));
    return;
  }

  if (action === "تفعيل") {
    savePrefixes({ ...data, noprefix: true });
    await m.reply([
      formatHeader("تفعيل الوضع بلا بادئة", "🟢"),
      "│",
      "│ تم تفعيل استقبال الأوامر دون كتابة بادئة.",
      `│ جرّب الآن كتابة اسم أمر مثل: \`مساعدة\``,
      "│",
      formatFooter(),
    ].join("\n"));
    return;
  }

  if (action === "تعطيل") {
    savePrefixes({ ...data, noprefix: false });
    await m.reply([
      formatHeader("تعطيل الوضع بلا بادئة", "🔴"),
      "│",
      "│ تم تعطيل الأوامر بلا بادئة.",
      `│ استخدم البادئة الرسمية: \`${DEFAULT_PREFIX}\``,
      "│",
      formatFooter(),
    ].join("\n"));
    return;
  }

  if (action === "اضف" || action === "اضافة" || action === "إضافة" || action === "اضافه") {
    if (items.length === 0) {
      await m.reply([
        formatHeader("إضافة بادئة", "➕"),
        "│",
        "│ اكتب رمزاً واحداً أو أكثر بعد الأمر.",
        "│ مثال: `.بريفكس اضف ! #`",
        "│",
        formatFooter(),
      ].join("\n"));
      return;
    }

    const existing = new Set(data.prefixes);
    const added = items.filter((prefix) => prefix.length <= 5 && !existing.has(prefix));

    if (added.length === 0) {
      await m.reply("╭━━〔 ⚠️ *لا توجد إضافة جديدة* 〕━━╮\n│ الرموز غير صالحة أو مضافة مسبقاً.\n╰━━〔 Tarboo Bot 〕━━╯");
      return;
    }

    savePrefixes({ ...data, prefixes: [...data.prefixes, ...added] });
    await m.reply([
      formatHeader("إضافة بادئة", "✅"),
      "│",
      `│ تمت إضافة: ${added.map((prefix) => `\`${prefix}\``).join(" • ")}`,
      "│ أصبحت متاحة فوراً دون إعادة تشغيل.",
      "│",
      formatFooter(),
    ].join("\n"));
    return;
  }

  if (action === "حذف") {
    if (items.length === 0) {
      await m.reply([
        formatHeader("حذف بادئة", "🗑️"),
        "│",
        "│ اكتب الرمز المراد حذفه بعد الأمر.",
        "│ مثال: `.بريفكس حذف !`",
        "│",
        formatFooter(),
      ].join("\n"));
      return;
    }

    const requested = new Set(items);
    const deleted = data.prefixes.filter((prefix) => requested.has(prefix));
    const remaining = data.prefixes.filter((prefix) => !requested.has(prefix));
    savePrefixes({ ...data, prefixes: remaining });

    await m.reply([
      formatHeader("حذف بادئة", "🗑️"),
      "│",
      `│ المحذوف: ${deleted.length ? deleted.map((prefix) => `\`${prefix}\``).join(" • ") : "لا يوجد"}`,
      "│ البادئة الأساسية لا تُحذف من هذا الأمر.",
      "│",
      formatFooter(),
    ].join("\n"));
    return;
  }

  if (action === "تصفير") {
    savePrefixes({ prefixes: [], noprefix: false });
    await m.reply([
      formatHeader("تصفير البادئات", "♻️"),
      "│",
      "│ تم حذف البادئات الإضافية وتعطيل الوضع بلا بادئة.",
      `│ البادئة الأساسية الحالية: \`${DEFAULT_PREFIX}\``,
      "│",
      formatFooter(),
    ].join("\n"));
    return;
  }

  await m.reply([
    formatHeader("أداة غير معروفة", "⚠️"),
    "│",
    "│ الأدوات المتاحة:",
    "│ عرض • تفعيل • تعطيل • اضف • حذف • تصفير",
    "│ مثال: `.بريفكس عرض`",
    "│",
    formatFooter(),
  ].join("\n"));
}

export {
  pluginConfig as config,
  handler,
  getAllPrefixes,
  loadPrefixes,
  savePrefixes,
  isNoPrefix,
};

export default handler;
export { invalidatePrefixCache };