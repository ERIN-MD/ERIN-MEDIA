import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { findProjectFiles } from "./maro-code-review.js";
import { formatPluginDiagnostics, repairLegacyImports } from "./maro-plugin-diagnostics.js";
import { createPluginMovePlan, executePluginMovePlan, formatPluginMovePlan, rollbackPluginMove, testPluginFile } from "./maro-plugin-move.js";
import { diagnoseErrorText, formatErrorDiagnosis } from "./maro-error-diagnostics.js";
import {
  addGroupMemory,
  createWorkPlan,
  formatDecisions,
  formatGroupMemory,
  formatWorkPlan,
  listDecisions,
  recordDecision,
  removeGroupMemory,
  updateWorkPlan,
} from "./maro-ai-workspace.js";

const execFileAsync = promisify(execFile);
const MAX_AUDIT_FILES = 220;
const MAX_MENTION_TARGETS = 250;
const pendingAdminActions = new Map();

function stageAdminAction(m, action) {
  const id = `NAT-${Date.now().toString(36).toUpperCase()}`;
  pendingAdminActions.set(id, { ...action, sender: m.sender, chat: m.chat, createdAt: Date.now() });
  return id;
}

function normalizeArabic(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\p{C}/gu, " ")
    .replace(/[ً-ٟ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (value < 1024 * 1024) return `${Math.round(value / 1024)}KB`;
  return `${(value / (1024 * 1024)).toFixed(1)}MB`;
}

function hasAny(text, patterns) {
  return patterns.some((pattern) => text.includes(pattern));
}

function participantJid(participant) {
  return participant?.id || participant?.jid || participant?.participant || "";
}

function isGroupAdmin(participant) {
  return Boolean(participant?.admin || participant?.role === "admin" || participant?.role === "superadmin");
}

function botJid(sock) {
  const number = sock?.user?.id?.split(":")[0] || "";
  return number ? `${number}@s.whatsapp.net` : "";
}

async function getProjectHealth({ root = process.cwd(), healthEntries = [], maxFiles = MAX_AUDIT_FILES } = {}) {
  const candidates = await findProjectFiles("", { root, maxResults: maxFiles + 80 });
  const scripts = candidates.filter((item) => /\.(?:js|mjs|cjs)$/i.test(item.path)).slice(0, maxFiles);
  const syntaxErrors = [];

  for (const item of scripts) {
    try {
      await execFileAsync(process.execPath, ["--check", path.join(root, item.path)], { timeout: 15000 });
    } catch (error) {
      syntaxErrors.push({ file: item.path, error: String(error.stderr || error.message || "خطأ صياغة").split("\n")[0].slice(0, 180) });
      if (syntaxErrors.length >= 12) break;
    }
  }

  return {
    scanned: scripts.length,
    skipped: Math.max(0, candidates.filter((item) => /\.(?:js|mjs|cjs)$/i.test(item.path)).length - scripts.length),
    syntaxErrors,
    healthEntries: Array.isArray(healthEntries) ? healthEntries.slice(0, 8) : [],
  };
}

function getMemoryReport(db) {
  const data = db?.db?.data || {};
  const autoAi = data.autoai || {};
  const groupConfigs = Object.values(autoAi);
  const sessions = groupConfigs.reduce((total, config) => total + Object.keys(config?.sessions || {}).length, 0);
  const historyEntries = groupConfigs.reduce((total, config) => total + Object.values(config?.sessions || {}).reduce((sum, session) => sum + (session?.history?.length || 0), 0), 0);
  const longMemory = Object.values(data.longTermMemory || {}).reduce((total, entries) => total + (Array.isArray(entries) ? entries.length : 0), 0);
  const memory = process.memoryUsage();
  return { groups: groupConfigs.length, sessions, historyEntries, longMemory, rss: memory.rss, heapUsed: memory.heapUsed };
}

function formatHealthReport(report) {
  const errors = report.syntaxErrors.length
    ? report.syntaxErrors.map((item) => `• ${item.file}: ${item.error}`).join("\n")
    : "• لم تُكتشف أخطاء صياغة في الملفات المفحوصة.";
  const runtime = report.healthEntries.filter((item) => item.type === "error");
  const runtimeText = runtime.length
    ? runtime.map((item) => `• ${item.operation}: ${item.count} مرة`).join("\n")
    : "• لا توجد أخطاء تشغيل متكررة مسجلة في ذاكرة Auto AI.";
  return `🔎 *فحص صحة Tarboo Bot*\n\n• الملفات المفحوصة: ${report.scanned}${report.skipped ? ` (تم تجاوز ${report.skipped} بسبب الحد الآمن)` : ""}\n• أخطاء الصياغة: ${report.syntaxErrors.length}\n\n*نتيجة الصياغة:*\n${errors}\n\n*أخطاء التشغيل المسجلة:*\n${runtimeText}\n\n> هذا فحص آمن للقراءة فقط؛ لم يُعدّل أي ملف.`;
}

function formatMemoryReport(memory) {
  return `🧠 *تحليل ذاكرة Tarboo Bot*\n\n• مجموعات Auto AI: ${memory.groups}\n• جلسات المستخدمين المخزنة: ${memory.sessions}\n• رسائل السجل القصير: ${memory.historyEntries}\n• عناصر الذاكرة الطويلة: ${memory.longMemory}\n• ذاكرة العملية المستخدمة: ${formatBytes(memory.heapUsed)}\n• ذاكرة العملية الكلية: ${formatBytes(memory.rss)}\n\n> الأرقام تشغيلية لحظية ولا تعرض محتوى رسائل المستخدمين.`;
}

async function sendProfilePicture(m, sock) {
  const text = normalizeArabic(m.body);
  const wantsBot = hasAny(text, ["صورة البوت", "صوره البوت", "صورة ملف البوت", "صوره ملف البوت"]);
  const target = wantsBot ? botJid(sock) : m.sender;
  if (!target) throw new Error("تعذر تحديد الحساب المطلوب");
  const url = await sock.profilePictureUrl(target, "image");
  await sock.sendMessage(m.chat, { image: { url }, caption: wantsBot ? "🖼️ هذه صورة ملف Tarboo Bot." : "🖼️ هذه صورة ملفك الشخصي." }, { quoted: m });
}

async function sendSelectiveMention(m, sock, type) {
  if (!m.isGroup) throw new Error("هذه الميزة تعمل داخل المجموعات فقط");
  if (!m.isAdmin && !m.isOwner) throw new Error("هذه العملية للمشرفين أو مالك البوت فقط");
  const metadata = m.groupMetadata || await sock.groupMetadata(m.chat);
  const currentBot = botJid(sock);
  const participants = (metadata?.participants || []).filter((item) => participantJid(item) && participantJid(item) !== currentBot);
  const selected = participants.filter((item) => type === "admins" ? isGroupAdmin(item) : !isGroupAdmin(item)).slice(0, MAX_MENTION_TARGETS);
  if (!selected.length) throw new Error(type === "admins" ? "لا يوجد مشرفون آخرون للمنشن" : "لا يوجد أعضاء غير مشرفين للمنشن");
  const ids = selected.map(participantJid);
  const labels = ids.map((jid) => `@${jid.split("@")[0]}`).join(" ");
  const title = type === "admins" ? "المشرفون" : "الأعضاء دون المشرفين";
  await sock.sendMessage(m.chat, { text: `📣 *منشن ${title}*\n\n${labels}${participants.length > selected.length ? `\n\n> تم الاكتفاء بأول ${MAX_MENTION_TARGETS} عضواً لتفادي الإزعاج.` : ""}`, mentions: ids }, { quoted: m });
}

async function handleNaturalAIRequest(m, sock, {
  db,
  healthEntries = [],
  createPluginMovePlanFn = createPluginMovePlan,
  executePluginMovePlanFn = executePluginMovePlan,
} = {}) {
  const text = normalizeArabic(m?.body);
  if (!text) return false;

  const approval = text.match(/^(?:اكد|تاكيد|وافق على التغيير)\s+(NAT-[A-Z0-9-]+)$/i);
  if (approval) {
    const approvalId = approval[1].toUpperCase();
    const pending = pendingAdminActions.get(approvalId);
    if (!pending || pending.sender !== m.sender || pending.chat !== m.chat || Date.now() - pending.createdAt > 10 * 60 * 1000) {
      await m.reply("❌ طلب التغيير غير موجود أو انتهت صلاحيته.");
      return true;
    }
    pendingAdminActions.delete(approvalId);
    if (pending.type === "repair-imports") {
      const repairs = await repairLegacyImports();
      await m.reply(repairs.length ? `✅ تم إصلاح ${repairs.length} استيراد آمن بعد فحص الصياغة.` : "✦ لم أجد استيرادات قديمة قابلة للإصلاح الآمن.");
      return true;
    }
    if (pending.type === "link-guard") {
      db.setGroup(m.chat, { [pending.key]: pending.disabling ? "off" : "on" });
      await m.reply(`✦ *منع الروابط*\n\n> تم ${pending.disabling ? "إيقاف" : "تفعيل"} ${pending.whatsappOnly ? "منع روابط واتساب" : "منع كل الروابط"}.\n> Tarboo Bot`);
      return true;
    }
    if (pending.type === "plugin-move") {
      try {
        const result = await (pending.executePluginMovePlanFn || executePluginMovePlan)(pending.plan);
        recordDecision(db, {
          type: "نقل بلوقن",
          status: "executed",
          chat: m.chat,
          owner: m.sender,
          summary: `نُقل ${result.source} إلى ${result.destination}`,
          details: result,
        });
        await db.save?.();
        await m.reply(`✅ *تم نقل البلوقن بنجاح*\n\n• من: \`${result.source}\`\n• إلى: \`${result.destination}\`\n• النسخة الاحتياطية: \`${result.backup}\`\n• التحقق: ${result.checks.join("، ")} ✅\n\n> أعد تحميل البلوقنات لتفعيل المسار الجديد.\n> Tarboo Bot`);
      } catch (error) {
        await m.reply(`❌ تعذر تنفيذ نقل البلوقن: ${error.message}`);
      }
      return true;
    }
    if (pending.type === "plugin-rollback") {
      try {
        const result = await rollbackPluginMove(pending.decision.details);
        recordDecision(db, { type: "تراجع نقل بلوقن", status: "executed", chat: m.chat, owner: m.sender, summary: `استُعيد ${result.source} وحُذفت النسخة المنقولة ${result.removed}`, details: result });
        await db.save?.();
        await m.reply(`↩️ تم التراجع بنجاح.\n• استُعيد: \`${result.source}\`\n• أزيل: \`${result.removed}\`\n• النسخة الاحتياطية محفوظة: \`${result.backup}\``);
      } catch (error) {
        await m.reply(`❌ تعذر التراجع: ${error.message}`);
      }
      return true;
    }
    return false;
  }

  if (hasAny(text, ["صورة ملفي الشخصي", "صوره ملفي الشخصي", "هات صورتي الشخصيه", "ارسل صورتي الشخصيه", "صورة البوت", "صوره البوت"])) {
    try {
      await sendProfilePicture(m, sock);
      return true;
    } catch (error) {
      await m.react?.("❌");
      await m.reply(`تعذر إرسال الصورة: ${error.message}`);
      return true;
    }
  }

  const wantsMembersOnly = hasAny(text, ["دون المشرفين", "بدون المشرفين", "غير المشرفين", "الاعضاء فقط", "الاعضاء من دون"])
    && hasAny(text, ["منشن", "اشاره", "تاغ", "tag"]);
  const wantsAdminsOnly = hasAny(text, ["المشرفين فقط", "الادمن فقط", "المشرفون فقط"])
    && hasAny(text, ["منشن", "اشاره", "تاغ", "tag"]);
  if (wantsMembersOnly || wantsAdminsOnly) {
    try {
      await sendSelectiveMention(m, sock, wantsAdminsOnly ? "admins" : "members");
      return true;
    } catch (error) {
      await m.react?.("🔒");
      await m.reply(error.message);
      return true;
    }
  }

  const wantsAudit = hasAny(text, ["حلل جميع الملفات", "حلل كل الملفات", "افحص جميع الملفات", "افحص كل الملفات", "ابحث عن اخطاء", "حلل وجود اي خطا", "حلل وجود اخطاء"]);
  const wantsStatus = hasAny(text, ["حلل حاله البوت", "افحص حاله البوت", "حاله البوت", "صحه البوت"]);
  const wantsMemory = hasAny(text, ["حلل الذاكره", "افحص الذاكره", "حاله الذاكره"]);
  const wantsFileSearch = hasAny(text, ["ابحث عن ملف", "ابحث لي عن", "دور على ملف", "اين ملف"]);
  const wantsPluginDiagnostics = hasAny(text, ["اخطاء البلوقنات", "أخطاء البلوقنات", "اخطاء الاضافات", "أخطاء الاضافات", "لماذا البلوقنات لا تعمل", "شخص اخطاء البلوقنات"]);
  const isGroupManager = Boolean(m.isOwner || m.isAdmin);
  const memoryAdd = String(m.body || "").match(/^(?:احفظ|تذكر)\s+(?:في\s+)?ذاكرة\s+المجموعة\s*[:：\-]?\s*(.+)$/iu);
  const memoryRemove = String(m.body || "").match(/^(?:احذف|امسح|انس)\s+(?:من\s+)?ذاكرة\s+المجموعة\s*(.*)$/iu);
  const wantsGroupMemory = hasAny(text, ["ذاكره المجموعه", "ذاكرة المجموعة", "اعرض ذاكره المجموعه", "اعرض ذاكرة المجموعة"]);
  const workComplete = String(m.body || "").match(/^(?:اكمل|أكمل|انجز|أنجز)\s+(WORK-[A-Z0-9-]+)\s+(\d+)$/i);
  const wantsWorkPlan = hasAny(text, ["وضع العمل", "خطه عمل", "خطة عمل", "خطط لي", "قسم هذه المهمه", "قسم هذه المهمة"]);
  const wantsDecisionLog = hasAny(text, ["سجل القرارات", "سجل قرارات", "قرارات الذكاء", "اخر قرارات"]);
  const pluginTestRequest = String(m.body || "").match(/^(?:اختبر|افحص)\s+(?:بلوقن|بلجن|اضافة|إضافة)\s+(.+)$/iu);
  const rollbackRequest = String(m.body || "").match(/^(?:تراجع|ارجع|استرجع)\s+(?:عن\s+)?(?:القرار\s+)?(DEC-[A-Z0-9-]+)$/i);
  const errorDiagnosisRequest = String(m.body || "").match(/^(?:حلل|شخص|شخّص)\s+(?:هذا\s+)?(?:الخطا|الخطأ)\s*[:：\-]?\s*(.*)$/iu);

  if (memoryAdd || memoryRemove || wantsGroupMemory) {
    if (!m.isGroup || !isGroupManager) {
      await m.react?.("🔒");
      return true;
    }
    if (memoryAdd) {
      const entry = addGroupMemory(db, m.chat, { content: memoryAdd[1], author: m.sender });
      recordDecision(db, { type: "ذاكرة مجموعة", status: "saved", chat: m.chat, owner: m.sender, summary: `حُفظت معلومة: ${entry.content}`, details: { memoryId: entry.id } });
      await db.save?.();
      await m.reply(`✅ حُفظت في ذاكرة المجموعة.\n> المعرف: \`${entry.id}\`\n> استخدم «احذف من ذاكرة المجموعة ${entry.id}» لإزالتها.`);
      return true;
    }
    if (memoryRemove) {
      const result = removeGroupMemory(db, m.chat, memoryRemove[1]);
      await db.save?.();
      await m.reply(result.removed ? `✅ أزيلت ${result.removed} معلومة من ذاكرة المجموعة.` : "لم أجد معلومة مطابقة لإزالتها.");
      return true;
    }
    await m.reply(formatGroupMemory(db, m.chat));
    return true;
  }

  if (workComplete || wantsWorkPlan) {
    if (!isGroupManager) {
      await m.react?.("🔒");
      return true;
    }
    if (workComplete) {
      try {
        const plan = updateWorkPlan(db, m.chat, workComplete[1].toUpperCase(), workComplete[2]);
        await db.save?.();
        await m.reply(formatWorkPlan(plan));
      } catch (error) {
        await m.reply(`❌ تعذر تحديث وضع العمل: ${error.message}`);
      }
      return true;
    }
    const goal = String(m.body || "").replace(/^(?:وضع\s+العمل|خط[هة]\s+عمل|خطط\s+لي|قسم\s+هذه\s+المهم[هة])\s*[:：\-]?\s*/iu, "").trim();
    try {
      const plan = createWorkPlan(db, m.chat, { owner: m.sender, goal });
      await db.save?.();
      await m.reply(formatWorkPlan(plan));
    } catch (error) {
      await m.reply(`❌ تعذر إنشاء خطة العمل: ${error.message}`);
    }
    return true;
  }

  if (wantsDecisionLog) {
    if (!m.isOwner) {
      await m.react?.("🔒");
      return true;
    }
    await m.reply(formatDecisions(listDecisions(db, { owner: m.sender, limit: 10 })));
    return true;
  }

  if (pluginTestRequest) {
    if (!m.isOwner) {
      await m.react?.("🔒");
      return true;
    }
    try {
      const result = await testPluginFile(pluginTestRequest[1].trim());
      await m.reply(`🧪 *فحص البلوقن ناجح*\n\n• الملف: \`${result.file}\`\n• الفئة: ${result.category}\n• صلاحية المالك: ${result.ownerOnly}\n• الحجم: ${result.size} بايت\n• صياغة JavaScript: سليمة ✅\n• الاستيرادات المحلية: سليمة ✅`);
    } catch (error) {
      await m.reply(`❌ فشل اختبار البلوقن: ${error.message}`);
    }
    return true;
  }

  if (errorDiagnosisRequest) {
    if (!m.isOwner) {
      await m.react?.("🔒");
      return true;
    }
    const quotedText = m.quoted?.text || m.quoted?.body || m.quoted?.caption || "";
    const evidence = errorDiagnosisRequest[1] || quotedText;
    if (!evidence) {
      await m.reply("⚠️ اكتب رسالة الخطأ بعد الأمر أو رد على رسالة الخطأ ثم اكتب: حلل هذا الخطأ.");
      return true;
    }
    await m.reply(formatErrorDiagnosis(diagnoseErrorText(evidence)));
    return true;
  }

  if (rollbackRequest) {
    if (!m.isOwner) {
      await m.react?.("🔒");
      return true;
    }
    const decision = listDecisions(db, { owner: m.sender, limit: 80 }).find((entry) => entry.id === rollbackRequest[1].toUpperCase() && entry.type === "نقل بلوقن" && entry.status === "executed");
    if (!decision) {
      await m.reply("❌ لم أجد قرار نقل بلوقن منفذاً بهذا المعرف ضمن سجلك.");
      return true;
    }
    const id = stageAdminAction(m, { type: "plugin-rollback", decision });
    recordDecision(db, { type: "تراجع نقل بلوقن", status: "planned", chat: m.chat, owner: m.sender, summary: `خطة استعادة ${decision.details.source} وحذف ${decision.details.destination}`, details: { confirmationId: id, decisionId: decision.id } });
    await db.save?.();
    await m.reply(`⚠️ *تأكيد التراجع عن نقل البلوقن*\n\n> سيُستعاد \`${decision.details.source}\` من النسخة الاحتياطية، وتُحذف النسخة المنقولة \`${decision.details.destination}\`.\n> للتأكيد اكتب: \`أكد ${id}\``);
    return true;
  }

  if (wantsPluginDiagnostics) {
    if (!m.isOwner) {
      await m.react?.("🔒");
      return true;
    }
    await m.reply(formatPluginDiagnostics());
    return true;
  }

  const wantsImportRepair = hasAny(text, ["اصلح استيرادات البلوقنات", "أصلح استيرادات البلوقنات", "اصلح اخطاء الاستيراد", "أصلح أخطاء الاستيراد"]);
  if (wantsImportRepair) {
    if (!m.isOwner) {
      await m.react?.("🔒");
      return true;
    }
    const id = stageAdminAction(m, { type: "repair-imports" });
    await m.reply(`⚠️ *تأكيد إصلاح الاستيرادات*\n\n> قد يُعدل هذا الإجراء ملفات البلوقنات بعد إنشاء نسخة احتياطية وفحص الصياغة.\n> للتأكيد اكتب: \`أكد ${id}\`\n> Tarboo Bot`);
    return true;
  }

  try {
    const pluginMovePlan = await createPluginMovePlanFn(m.body);
    if (pluginMovePlan) {
      if (!m.isOwner) {
        await m.react?.("🔒");
        return true;
      }
      const id = stageAdminAction(m, { type: "plugin-move", plan: pluginMovePlan, executePluginMovePlanFn });
      recordDecision(db, {
        type: "نقل بلوقن",
        status: "planned",
        chat: m.chat,
        owner: m.sender,
        summary: `خطة نقل ${pluginMovePlan.source} إلى ${pluginMovePlan.destination}`,
        details: { confirmationId: id, source: pluginMovePlan.source, destination: pluginMovePlan.destination },
      });
      await db.save?.();
      await m.reply(formatPluginMovePlan(pluginMovePlan, id));
      return true;
    }
  } catch (error) {
    if (/(?:انقل|نقل|حو[ّ]?ل|غير\s+فئ|انقله)/u.test(text) && /(?:بلوقن|بلجن|اضافه|plugin|ملف)/u.test(text)) {
      if (!m.isOwner) {
        await m.react?.("🔒");
        return true;
      }
      await m.reply(`❌ تعذر إعداد خطة نقل البلوقن: ${error.message}`);
      return true;
    }
  }

  const wantsLinkGuard = hasAny(text, ["فعل منع الروابط", "فعّل منع الروابط", "شغل منع الروابط", "أوقف منع الروابط", "اقفل منع الروابط", "عطل منع الروابط"]);
  if (wantsLinkGuard) {
    if (!m.isGroup) {
      await m.react?.("🔒");
      return true;
    }
    if (!m.isOwner && !m.isAdmin) {
      await m.react?.("🔒");
      return true;
    }
    const disabling = hasAny(text, ["اوقف", "أوقف", "اقفل", "عطل"]);
    const whatsappOnly = hasAny(text, ["واتساب", "واتس"]);
    const key = whatsappOnly ? "antilinkgc" : "antilinkall";
    const id = stageAdminAction(m, { type: "link-guard", key, disabling, whatsappOnly });
    await m.reply(`⚠️ *تأكيد تغيير منع الروابط*\n\n> سيتم ${disabling ? "إيقاف" : "تفعيل"} ${whatsappOnly ? "منع روابط واتساب" : "منع كل الروابط"}.\n> للتأكيد اكتب: \`أكد ${id}\`\n> Tarboo Bot`);
    return true;
  }

  if (wantsAudit || wantsStatus || wantsMemory || wantsFileSearch) {
    if (!m.isOwner) {
      await m.react?.("🔒");
      return true;
    }
    if (wantsMemory) {
      await m.reply(formatMemoryReport(getMemoryReport(db)));
      return true;
    }
    if (wantsAudit) {
      await m.react?.("⏳");
      const report = await getProjectHealth({ healthEntries });
      await m.reply(formatHealthReport(report));
      return true;
    }
    if (wantsStatus) {
      const memory = getMemoryReport(db);
      const runtimeErrors = healthEntries.filter((item) => item.type === "error").length;
      await m.reply(`📊 *حالة Tarboo Bot*\n\n• وقت التشغيل: ${Math.floor(process.uptime() / 60)} دقيقة\n• ذاكرة العملية: ${formatBytes(memory.heapUsed)} من ${formatBytes(memory.rss)}\n• جلسات Auto AI: ${memory.sessions}\n• أخطاء تشغيل متكررة: ${runtimeErrors}\n\n> اكتب «حلل جميع الملفات بحثاً عن أخطاء» لفحص صياغة ملفات المشروع.`);
      return true;
    }
    const query = text.replace(/.*?(?:ابحث عن ملف|ابحث لي عن|دور على ملف|اين ملف)\s*/i, "").trim();
    const files = await findProjectFiles(query, { maxResults: 8 });
    await m.reply(files.length
      ? `📂 *نتائج البحث عن «${query || "ملف"}»*\n\n${files.map((item, index) => `${index + 1}. \`${item.path}\``).join("\n")}\n\nاكتب مثلاً: «حلل ملف أوامر» أو «حلل ${files[0].path.split("/").at(-1)}».`
      : "لم أجد ملفاً مناسباً بهذا الوصف.");
    return true;
  }
  return false;
}

export { findProjectFiles, getProjectHealth, getMemoryReport, handleNaturalAIRequest, normalizeArabic };
