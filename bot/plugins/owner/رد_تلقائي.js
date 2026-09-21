import { getDatabase } from "../../src/lib/maro-database.js";

function normalizeReplyMode(value, fallback = "all") {
  const input = String(value || "").trim().toLowerCase();
  if (["mention", "منشن", "رد", "اقتباس"].includes(input)) return "mention";
  if (["all", "كل", "الجميع", "تلقائي"].includes(input)) return "all";
  return fallback;
}

function normalizeReplyScope(value, fallback = "groups") {
  const input = String(value || "").trim().toLowerCase();
  if (["all", "كل", "الجميع"].includes(input)) return "all";
  if (["private", "خاص", "الخاص"].includes(input)) return "private";
  if (["groups", "group", "مجموعات", "مجموعة"].includes(input)) return "groups";
  return fallback;
}

function formatAutoAIReplyPolicy(current = {}) {
  const replyMode = normalizeReplyMode(current.replyMode, current.alwaysReply === false ? "mention" : "all");
  const replyScope = normalizeReplyScope(current.replyScope, "groups");
  return {
    replyMode,
    replyScope,
    modeLabel: replyMode === "mention" ? "عند منشن البوت أو الرد عليه فقط" : "كل الرسائل ضمن النطاق",
    scopeLabel: replyScope === "all" ? "المجموعات والخاص" : replyScope === "private" ? "الخاص فقط" : "المجموعات فقط",
  };
}

const pluginConfig = {
  name: "رد_تلقائي",
  alias: ["autorespond", "auto_reply"],
  category: "owner",
  description: "تحديد نطاق وطريقة رد AutoAI في المجموعات والخاص",
  usage: ".رد_تلقائي <الجميع|مجموعات|خاص> [كل|منشن]",
  example: ".رد_تلقائي الجميع منشن",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  energi: 0,
  isEnabled: true,
};

function getChoice(args = [], isGroup) {
  const values = args.map((value) => String(value || "").trim().toLowerCase()).filter(Boolean);
  const scopeToken = values.find((value) => ["الجميع", "كل", "all", "مجموعات", "مجموعة", "groups", "group", "خاص", "private"].includes(value));
  const modeToken = values.find((value) => ["منشن", "رد", "mention", "كل", "تلقائي", "all"].includes(value));
  const replyScope = normalizeReplyScope(scopeToken, isGroup ? "groups" : "private");
  const replyMode = normalizeReplyMode(modeToken, "all");
  return { replyScope, replyMode };
}

async function handler(m) {
  if (!m.isOwner) return m.react?.("🔒");
  const db = getDatabase();
  if (!db?.db?.data) return m.reply("❌ قاعدة البيانات غير جاهزة بعد.");
  if (!db.db.data.autoai) db.db.data.autoai = {};
  if (!db.db.data.autoai_global) db.db.data.autoai_global = { enabled: false };

  const args = m.args || [];
  const command = String(args[0] || "").toLowerCase();
  if (["حالة", "status", "?", "مساعدة", "help"].includes(command) || !command) {
    const global = db.db.data.autoai_global;
    const policy = formatAutoAIReplyPolicy(global, { isGroup: true });
    return m.reply(`🤖 *إعداد الرد التلقائي*\n\n> التفعيل العام: ${global.enabled ? "مفعّل ✅" : "معطّل ❌"}\n> وضع الرد: ${policy.modeLabel}\n> النطاق: ${policy.scopeLabel}\n\n*أمثلة:*\n> .رد_تلقائي الجميع\n> .رد_تلقائي مجموعات منشن\n> .رد_تلقائي خاص كل\n> .رد_تلقائي إيقاف\n\n> «منشن» يعني الرد فقط عند منشن البوت أو الرد على إحدى رسائله.`);
  }

  if (["ايقاف", "إيقاف", "off", "تعطيل"].includes(command)) {
    db.db.data.autoai_global.enabled = false;
    await db.save();
    return m.reply("✅ تم إيقاف الرد التلقائي العام. الإعدادات المحلية للمجموعات تبقى محفوظة.");
  }

  const { replyMode, replyScope } = getChoice(args, Boolean(m.isGroup));
  const global = db.db.data.autoai_global;
  global.replyMode = replyMode;
  global.replyScope = replyScope;
  global.alwaysReply = replyMode === "all";

  let updatedGroups = 0;
  for (const groupConfig of Object.values(db.db.data.autoai)) {
    if (!groupConfig?.enabled) continue;
    groupConfig.replyMode = replyMode;
    groupConfig.replyScope = replyScope;
    groupConfig.alwaysReply = replyMode === "all";
    updatedGroups += 1;
  }
  await db.save();

  const policy = formatAutoAIReplyPolicy({ replyMode, replyScope }, { isGroup: Boolean(m.isGroup) });
  const activationNote = global.enabled ? "سيُطبق الإعداد فوراً على AutoAI العام." : "فعّل AutoAI العام لاحقاً عبر .autoai عالمي تشغيل مع اختيار شخصية.";
  return m.reply(`✅ *تم ضبط الرد التلقائي*\n\n> وضع الرد: ${policy.modeLabel}\n> النطاق: ${policy.scopeLabel}\n> تم تحديث إعدادات ${updatedGroups} مجموعة مفعلة.\n> ${activationNote}`);
}

export { pluginConfig as config, handler };