import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "منع_مخصص",
  alias: ["anticustom"],
  category: "group",
  description: "إنشاء منع مخصص عبر جلسة خطوة بخطوة",
  usage: ".منع_مخصص <تشغيل/إيقاف/قائمة/اضافة/حذف/طريقة/إلغاء>",
  example: ".منع_مخصص",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  isAdmin: true,
  isBotAdmin: true,
  cooldown: 3,
  energi: 0,
  isEnabled: true,
};

if (!global.anticustomSessions) global.anticustomSessions = new Map();

const SESSION_TIMEOUT = 10 * 60 * 1000;

function normalizeRules(rules) { return Array.isArray(rules) ? rules.filter((rule) => rule && rule.pattern) : []; }

function formatRule(rule, index) {
  const type = rule.type === "regex" ? "regex" : "يحتوي";
  const action = rule.action === "kick" ? "طرد" : "حذف";
  const title = rule.groupName || rule.name || "-";
  return `${index + 1}. *${title}*\n> النمط: \`${rule.pattern}\`\n> النوع: *${type}*\n> الإجراء: *${action}*`;
}

function getSessionKey(m) { return `${m.chat}:${m.sender}`; }

function clearSession(sessionKey) {
  const session = global.anticustomSessions.get(sessionKey);
  if (session?.timeout) clearTimeout(session.timeout);
  global.anticustomSessions.delete(sessionKey);
}

function refreshSessionTimeout(sessionKey) {
  const session = global.anticustomSessions.get(sessionKey);
  if (!session) return;
  if (session.timeout) clearTimeout(session.timeout);
  session.timeout = setTimeout(() => { const current = global.anticustomSessions.get(sessionKey); if (current?.startedAt === session.startedAt) { global.anticustomSessions.delete(sessionKey); } }, SESSION_TIMEOUT);
}

function normalizeAction(action, fallback = "remove") {
  const value = String(action || fallback).toLowerCase();
  if (["طرد", "kick", "حذف", "remove", "delete", "مسح"].includes(value)) { return value === "delete" || value === "مسح" || value === "حذف" ? "remove" : value === "طرد" ? "kick" : value; }
  return fallback;
}

function formatAction(action) { return action === "kick" ? "طرد العضو" : "حذف الرسالة"; }

function parsePatternAnswer(text) {
  const raw = String(text || "").trim();
  if (!raw) return { error: "الإجابة فارغة." };
  if (/^regex\s*:/i.test(raw)) { const pattern = raw.replace(/^regex\s*:/i, "").trim(); if (!pattern) return { error: "Regex فارغ." }; try { new RegExp(pattern, "i"); } catch { return { error: "Regex غير صالح." }; } return { type: "regex", patterns: [pattern] }; }
  const cleaned = raw.replace(/^يحتوي\s*:/i, "").trim();
  const patterns = [...new Set(cleaned.split(/\n|,/).map((item) => item.trim()).filter(Boolean))];
  if (patterns.length === 0) { return { error: "لم أحصل على كلمات للكشف." }; }
  return { type: "contains", patterns };
}

function buildSummary(session) {
  return `> العنوان: *${session.title}*\n> نوع الكشف: *${session.type}*\n> النمط: ${session.patterns.map((item) => `\`${item}\``).join(", ")}\n> الإجراء: *${formatAction(session.action)}*`;
}

async function sendPrompt(sock, m, text) { const sent = await sock.sendMessage(m.chat, { text }, { quoted: m }); return sent?.key?.id || null; }

async function startWizard(m, sock, mode, isFirstSetup = false) {
  const sessionKey = getSessionKey(m);
  const existing = global.anticustomSessions.get(sessionKey);
  if (existing) { await m.reply(`⚠️ لديك جلسة منع مخصص غير مكتملة.\n\n> رد على آخر سؤال للمتابعة\n> أو ألغِ بـ \`${m.prefix}منع_مخصص إلغاء\``); return; }

  const session = { chat: m.chat, sender: m.sender, step: "title", title: "", type: "contains", patterns: [], action: normalizeAction(mode, "remove"), promptId: null, startedAt: Date.now(), timeout: null };
  global.anticustomSessions.set(sessionKey, session);
  refreshSessionTimeout(sessionKey);

  const intro = isFirstSetup
    ? `🛡️ *مرحباً بك في إعداد المنع المخصص*\n\nسأساعدك في إنشاء منع مخصص خطوة بخطوة.\n\n*الخطوات:*\n1. حدد عنوان القاعدة\n2. أدخل الكلمات المراد كشفها\n3. اختر الإجراء عند الكشف\n4. تأكيد التفاصيل\n\n`
    : `🛡️ *لنضف قاعدة منع مخصص جديدة*\n\n`;

  session.promptId = await sendPrompt(sock, m, intro + `*السؤال 1/4*\nما العنوان؟\n\n> رد على هذه الرسالة بعنوان القاعدة\n> مثال: \`منع الكلمات البذيئة\``);
}

function buildGuideMessage(m, status, mode, rules) {
  return `🛡️ *المنع المخصص*\n\n> الحالة: *${status === "on" ? "مفعل" : "معطل"}*\n> الوضع الافتراضي: *${normalizeAction(mode) === "kick" ? "طرد" : "حذف"}*\n> عدد القواعد: *${rules.length}*\n\nلإضافة قاعدة جديدة:\n> \`${m.prefix}منع_مخصص اضافة\`\n\nللتحكم بالحالة:\n> \`${m.prefix}منع_مخصص تشغيل\`\n> \`${m.prefix}منع_مخصص إيقاف\`\n\nللعرض أو الحذف:\n> \`${m.prefix}منع_مخصص قائمة\`\n> \`${m.prefix}منع_مخصص حذف <عنوان>\`\n\nلتغيير الوضع الافتراضي:\n> \`${m.prefix}منع_مخصص طريقة طرد\`\n> \`${m.prefix}منع_مخصص طريقة حذف\``;
}

async function handler(m, { sock }) {
  const db = getDatabase();
  const args = m.args || [];
  const sub = args[0]?.toLowerCase();
  const groupData = db.getGroup(m.chat) || {};
  const rules = normalizeRules(groupData.anticustomRules);
  const mode = groupData.anticustomMode || "remove";
  const status = groupData.anticustom || "off";
  const sessionKey = getSessionKey(m);

  if (!sub) { if (rules.length === 0) { await startWizard(m, sock, mode, true); return; } await m.reply(buildGuideMessage(m, status, mode, rules)); return; }

  if (sub === "اضافة" || sub === "add" || sub === "جديد" || sub === "انشاء") { await startWizard(m, sock, mode); return; }
  if (sub === "الغاء" || sub === "cancel" || sub === "بطل") { if (!global.anticustomSessions.has(sessionKey)) { await m.reply("⚠️ لا توجد جلسة منع مخصص نشطة."); return; } clearSession(sessionKey); await m.reply("✅ تم إلغاء الجلسة."); return; }
  if (sub === "تشغيل" || sub === "on") { db.setGroup(m.chat, { anticustom: "on" }); await m.reply("✅ *تم تفعيل المنع المخصص*"); return; }
  if (sub === "ايقاف" || sub === "off") { db.setGroup(m.chat, { anticustom: "off" }); await m.reply("❌ *تم تعطيل المنع المخصص*"); return; }

  if (sub === "طريقة" || sub === "metode") {
    const action = normalizeAction(args[1], "");
    if (!action) { await m.reply("❌ استخدم: `.منع_مخصص طريقة طرد` أو `.منع_مخصص طريقة حذف`"); return; }
    db.setGroup(m.chat, { anticustom: "on", anticustomMode: action });
    await m.reply(`✅ *الوضع الافتراضي الآن: ${action === "kick" ? "طرد" : "حذف"}*`);
    return;
  }

  if (sub === "قائمة" || sub === "list") { if (rules.length === 0) { await m.reply("📋 لا توجد قواعد منع مخصص."); return; } await m.reply(`📋 *قائمة المنع المخصص*\n\n${rules.map(formatRule).join("\n\n")}`); return; }

  if (sub === "حذف" || sub === "del" || sub === "مسح") {
    const name = args.slice(1).join(" ").trim().toLowerCase();
    if (!name) { await m.reply("❌ الصيغة: `.منع_مخصص حذف <عنوان>`"); return; }
    const nextRules = rules.filter((rule) => { const ruleName = String(rule.name || "").toLowerCase(); const groupName = String(rule.groupName || "").toLowerCase(); return !(ruleName === name || groupName === name || ruleName.startsWith(`${name} #`)); });
    if (nextRules.length === rules.length) { await m.reply(`❌ قاعدة بعنوان \`${name}\` غير موجودة.`); return; }
    db.setGroup(m.chat, { anticustomRules: nextRules }); await m.reply(`✅ تم حذف القاعدة \`${name}\`.`); return;
  }

  await m.reply("❌ أمر غير صالح. استخدم: تشغيل، إيقاف، قائمة، اضافة، حذف، طريقة، إلغاء");
}

async function replyHandler(m, { sock }) {
  if (!m.quoted) return false;
  if (m.isCommand) return false;
  const sessionKey = getSessionKey(m);
  const session = global.anticustomSessions.get(sessionKey);
  if (!session) return false;
  if (session.chat !== m.chat || session.sender !== m.sender) return false;
  const quotedId = m.quoted?.id || m.quoted?.key?.id;
  if (!quotedId || quotedId !== session.promptId) return false;
  const text = String(m.body || "").trim();
  if (!text) return false;
  refreshSessionTimeout(sessionKey);

  if (session.step === "title") {
    if (text.length < 2 || text.length > 40) { await m.reply("❌ العنوان يجب أن يكون بين 2-40 حرف."); return true; }
    session.title = text; session.step = "patterns";
    session.promptId = await sendPrompt(sock, m, `🛡️ *السؤال 2/4*\n\nحسناً، العنوان *${session.title}*.\n\nالآن، أدخل الكلمات المراد كشفها.\n\nيمكنك اختيار أحد التنسيقين:\n> *يحتوي*: أرسل الكلمات مفصولة بفواصل أو أسطر\n> *Regex*: ابدأ الإجابة بـ \`regex:\`\n\nمثال contains:\n> \`كلمة1, كلمة2, كلمة3\`\n\nمثال regex:\n> \`regex: (كلمة1|كلمة2)\`\n\n*رد على هذه الرسالة بإجابتك*`);
    return true;
  }

  if (session.step === "patterns") {
    const parsed = parsePatternAnswer(text);
    if (parsed.error) { await m.reply(`❌ ${parsed.error}`); return true; }
    session.type = parsed.type; session.patterns = parsed.patterns; session.step = "action";
    session.promptId = await sendPrompt(sock, m, `🛡️ *السؤال 3/4*\n\nتريد:\n${session.patterns.map((item, index) => `${index + 1}. \`${item}\``).join("\n")}\n\n> نوع الكشف: *${session.type}*\n\nعند اكتشاف هذه الكلمات، هل تريد *حذف* الرسالة أم *طرد* العضو؟\n\n*رد على هذه الرسالة بـ:* \`حذف\` أو \`طرد\``);
    return true;
  }

  if (session.step === "action") {
    const action = normalizeAction(text, "");
    if (!action) { await m.reply("❌ أجب بـ `حذف` أو `طرد`."); return true; }
    session.action = action; session.step = "confirm";
    session.promptId = await sendPrompt(sock, m, `🛡️ *السؤال 4/4*\n\nالتفاصيل:\n\n${buildSummary(session)}\n\nهل هذا صحيح؟\n\n*رد على هذه الرسالة بـ:* \`نعم\` للحفظ أو \`إلغاء\` للإلغاء`);
    return true;
  }

  if (session.step === "confirm") {
    if (/^(الغاء|بطل|لا|خطأ)$/i.test(text)) { clearSession(sessionKey); await m.reply("✅ تم إلغاء الجلسة. اكتب `.منع_مخصص اضافة` للبدء من جديد."); return true; }
    if (!/^(نعم|اي|صحيح|موافق|تم|حفظ| ok|yes)$/i.test(text)) { await m.reply("❌ أجب بـ `نعم` للحفظ أو `إلغاء` للإلغاء."); return true; }

    const db = getDatabase();
    const groupData = db.getGroup(m.chat) || {};
    const currentRules = normalizeRules(groupData.anticustomRules);
    const titleKey = session.title.toLowerCase();
    const filteredRules = currentRules.filter((rule) => { const ruleName = String(rule.name || "").toLowerCase(); const groupName = String(rule.groupName || "").toLowerCase(); return !(ruleName === titleKey || groupName === titleKey || ruleName.startsWith(`${titleKey} #`)); });

    const createdAt = new Date().toISOString();
    const generatedRules = session.patterns.map((pattern, index) => ({ name: session.patterns.length === 1 ? session.title : `${session.title} #${index + 1}`, groupName: session.title, pattern, type: session.type, action: session.action, flags: "i", createdAt }));

    db.setGroup(m.chat, { anticustom: "on", anticustomMode: session.action, anticustomRules: [...filteredRules, ...generatedRules] });
    clearSession(sessionKey);

    await sock.sendMessage(m.chat, { text: `✅ *تم إنشاء المنع المخصص*\n\n${buildSummary(session)}\n\n> الحالة تلقائياً: *مفعل*\n> عدد القواعد الجديدة: *${generatedRules.length}*\n\nلرؤية الدليل: \`${m.prefix}منع_مخصص\`` }, { quoted: m });
    return true;
  }

  return false;
}

export { pluginConfig as config, handler, replyHandler };