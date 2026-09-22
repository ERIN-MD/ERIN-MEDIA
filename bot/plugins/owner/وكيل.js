import { getToolCatalogText, loadAgentMemory } from "../../src/lib/maro-agent-registry.js";
import { executeAgentTool } from "../../src/lib/maro-agent-tools.js";
import { forgetPreference, getMemoryStats } from "../../src/lib/maro-agent-memory.js";
import { resumeAgentRun } from "../../src/lib/maro-agent-runner.js";
import { loadControlState, decideApproval } from "../../src/lib/maro-agent-control.js";
import { runAgentHealthCheck, formatAgentHealth } from "../../src/lib/maro-agent-health.js";

const pluginConfig = {
  name: "وكيل",
  alias: ["agent", "autoagent", "مارووكيل"],
  category: "owner",
  description: "إدارة وكيل AutoAI وفهرسة المشروع وذاكرته وأدواته",
  usage: ".وكيل فهرسة | قدرات | صحة | ذاكرة | نسيان <مفتاح> | صياغة | اختبارات",
  example: ".وكيل صحة",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 0,
  energi: 0,
  isEnabled: true,
};

const decoration = (title, body) =>
  `╭━━━〔 Tarboo Bot 〕━━━╮\n` +
  `┃ 🤖 ${title}\n` +
  `┃\n` +
  body.split("\n").map((line) => `┃ ${line}`).join("\n") +
  `\n╰━━━━━━━━━━━━━━━━━━╯`;

function memoryReport() {
  const memory = loadAgentMemory();
  const stats = getMemoryStats();
  const scopes = Object.keys(memory.preferences || {});
  const lessons = Array.isArray(memory.lessons) ? memory.lessons : [];
  const recentLessons = lessons.slice(-5).map((lesson) => `${lesson.success ? "✅" : "❌"} ${lesson.operation}: ${lesson.summary}`).join("\n") || "لا توجد دروس محفوظة بعد.";
  return decoration("ذاكرة الوكيل", [
    `التفضيلات: ${stats.preferences}`,
    `الحقائق: ${stats.facts}`,
    `القدرات المحفوظة: ${stats.capabilities}`,
    `القرارات: ${stats.decisions}`,
    `النطاقات: ${scopes.join(", ") || "لا يوجد"}`,
    `الدروس المسجلة: ${stats.lessons}`,
    "آخر الدروس:",
    recentLessons,
  ].join("\n"));
}

async function handler(m) {
  const optionText = String(m.text || "").trim();
  const [rawAction = "", ...rest] = optionText.split(/\s+/);
  const action = rawAction.toLowerCase();
  const argument = rest.join(" ").trim();

  if (!action || ["مساعدة", "help", "?"].includes(action)) {
    return m.reply(decoration("أوامر الوكيل", [
      ".وكيل فهرسة — تحديث فهرس المشروع",
      ".وكيل قدرات — عرض الأدوات المسجلة",
      ".وكيل تشغيلات — عرض آخر تشغيلات الوكيل",
      ".وكيل تدقيق — عرض سجل التدقيق",
      ".وكيل صحة — إحصائيات الفهرس والاختبارات",
      ".وكيل ذاكرة — عرض الذاكرة والدروس",
      ".وكيل نسيان <مفتاح> — حذف تفضيل محفوظ",
      ".وكيل موافقات — عرض الخطط التي تنتظر موافقة",
      ".وكيل موافقة <معرف> — موافقة واحدة ثم استئناف الخطة",
      ".وكيل رفض <معرف> — رفض خطة معلقة",
      ".وكيل تشغيل <runId> — استئناف خطة تمت الموافقة عليها",
      ".وكيل صياغة — فحص صياغة المشروع",
      ".وكيل اختبارات — تشغيل الاختبارات المحلية",
      ".وكيل موافقات — عرض الخطط الحساسة المعلقة",
      ".وكيل تشغيلات — عرض سجل الخطط",
      ".وكيل تدقيق — عرض سجل الأحداث",
    ].join("\n")));
  }

  if (["فهرسة", "index", "manifest"].includes(action)) {
    const result = await executeAgentTool("project.project_manifest", { refresh: true }, { isDeveloper: true });
    return m.reply(decoration("فهرسة المشروع", result.ok
      ? [`الملفات: ${result.fileCount}`, `البلوقنات: ${result.pluginCount}`, `القدرات: ${(result.capabilities || []).length}`, `وقت الفهرسة: ${result.generatedAt}`].join("\n")
      : `❌ ${result.error}`));
  }

  if (["قدرات", "أدوات", "tools", "capabilities"].includes(action)) {
    return m.reply(decoration("قدرات الوكيل", getToolCatalogText()));
  }

  if (["تشغيلات", "runs", "history"].includes(action)) {
    const result = await executeAgentTool("agent.list_runs", { limit: 12 }, { isDeveloper: true });
    const body = result.ok && result.runs.length
      ? result.runs.map((run) => `${run.id}\n${run.intent} | ${run.status} | الخطر: ${run.highestRisk}`).join("\n\n")
      : "لا توجد تشغيلات مسجلة.";
    return m.reply(decoration("تشغيلات الوكيل", body));
  }

  if (["تدقيق", "audit", "سجل"].includes(action)) {
    const result = await executeAgentTool("agent.list_audit", { limit: 20 }, { isDeveloper: true });
    const body = result.ok && result.events.length
      ? result.events.map((event) => `${event.timestamp}\n${event.type} | ${event.status} | ${event.tool || "agent"}\n${event.output || ""}`).join("\n\n")
      : "لا توجد أحداث تدقيق مسجلة.";
    return m.reply(decoration("سجل تدقيق الوكيل", body));
  }

  if (["صحة", "health", "status"].includes(action)) {
    const report = await runAgentHealthCheck({ refresh: false, includeTests: true });
    const memory = loadAgentMemory();
    return m.reply(decoration("صحة الوكيل", [
      formatAgentHealth(report),
      `الذاكرة: ✅ ${Object.keys(memory.preferences || {}).length} نطاق، ${(memory.lessons || []).length} درس`,
      "الصلاحيات: ✅ أدوات المشروع للمطور فقط",
      "التعديلات الحساسة: ✅ لا تُطبق دون تأكيد صريح",
    ].join("\n")));
  }

  if (["ذاكرة", "memory"].includes(action)) return m.reply(memoryReport());

  if (["موافقات", "approvals", "pending"].includes(action)) {
    const pending = loadControlState().approvals.filter((item) => item.status === "pending");
    const body = pending.length
      ? pending.slice(-12).map((item) => `${item.id}\nالتشغيل: ${item.runId}\nالسبب: ${item.reason}\nتنتهي: ${item.expiresAt}`).join("\n\n")
      : "لا توجد خطط تنتظر الموافقة.";
    return m.reply(decoration("الموافقات المعلقة", body));
  }

  if (["موافقة", "approve", "قبول"].includes(action)) {
    if (!argument) return m.reply(decoration("موافقة خطة", "اكتب معرف الموافقة بعد الأمر."));
    const current = loadControlState().approvals.find((item) => item.id === argument);
    if (!current) return m.reply(decoration("موافقة خطة", "معرف الموافقة غير موجود."));
    const decision = decideApproval(argument, { approved: true, decidedBy: m.sender || "owner", note: "موافقة المطور عبر واتساب" });
    if (!decision.ok) return m.reply(decoration("موافقة خطة", `❌ ${decision.error}`));
    const resumed = await resumeAgentRun(current.runId, { isDeveloper: true });
    return m.reply(decoration("استئناف الخطة", [decision.approval.status === "approved" ? "✅ تمت الموافقة مرة واحدة." : "", resumed.message, `الحالة: ${resumed.ok ? "مكتملة" : "تحتاج مراجعة"}`].filter(Boolean).join("\n")));
  }

  if (["رفض", "reject", "deny"].includes(action)) {
    if (!argument) return m.reply(decoration("رفض خطة", "اكتب معرف الموافقة بعد الأمر."));
    const decision = decideApproval(argument, { approved: false, decidedBy: m.sender || "owner", note: "رفض المطور للخطة" });
    return m.reply(decoration("رفض خطة", decision.ok ? "❌ تم رفض الخطة ولن تُنفذ." : `❌ ${decision.error}`));
  }

  if (["تشغيل", "استئناف", "resume", "run"].includes(action)) {
    if (!argument) return m.reply(decoration("استئناف خطة", "اكتب runId بعد الأمر."));
    const resumed = await resumeAgentRun(argument, { isDeveloper: true });
    return m.reply(decoration("استئناف خطة", `${resumed.message || resumed.error}\nالحالة: ${resumed.ok ? "مكتملة" : "تحتاج مراجعة"}`));
  }

  if (["نسيان", "forget", "حذف"].includes(action)) {
    if (!argument) return m.reply(decoration("ذاكرة الوكيل", "اكتب المفتاح المراد حذفه بعد الأمر، مثال: .وكيل نسيان أسلوب الرد"));
    const result = forgetPreference(argument, { scope: "global" });
    return m.reply(decoration("ذاكرة الوكيل", result.ok ? `✅ تم حذف المفتاح: ${result.key}` : "لم يتم العثور على هذا المفتاح."));
  }

  if (["صياغة", "syntax"].includes(action)) {
    const result = await executeAgentTool("project.run_tests", { script: "test:syntax" }, { isDeveloper: true });
    return m.reply(decoration("فحص الصياغة", result.ok ? `✅ اكتمل الفحص بنجاح\n${result.output || ""}` : `❌ فشل الفحص\n${result.error || ""}`));
  }

  if (["اختبارات", "test", "tests"].includes(action)) {
    const result = await executeAgentTool("project.run_tests", { script: "test:local" }, { isDeveloper: true });
    return m.reply(decoration("اختبارات الوكيل والمشروع", result.ok ? `✅ اكتملت الاختبارات\n${result.output || ""}` : `❌ فشلت الاختبارات\n${result.error || ""}`));
  }

  return m.reply(decoration("أمر غير معروف", `استخدم ${m.prefix || "."}وكيل مساعدة`));
}

export { pluginConfig as config, handler };