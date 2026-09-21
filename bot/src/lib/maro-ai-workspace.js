import crypto from "crypto";

const MAX_GROUP_MEMORIES = 30;
const MAX_WORK_PLANS = 24;
const MAX_DECISIONS = 80;

function getData(db) {
  if (!db?.db?.data) throw new Error("قاعدة بيانات Tarboo Bot غير جاهزة");
  return db.db.data;
}

function compact(value, max = 500) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

function getGroupMemories(db, chat) {
  const data = getData(db);
  return Array.isArray(data.aiGroupMemory?.[chat]) ? data.aiGroupMemory[chat].map((entry) => ({ ...entry })) : [];
}

function addGroupMemory(db, chat, { content, author, label = "تفضيل المجموعة" } = {}) {
  const clean = compact(content, 500);
  if (clean.length < 3) throw new Error("اكتب معلومة واضحة لا تقل عن 3 أحرف لحفظها");
  const data = getData(db);
  if (!data.aiGroupMemory) data.aiGroupMemory = {};
  const entries = data.aiGroupMemory[chat] || [];
  const entry = { id: createId("MEM"), label: compact(label, 80) || "تفضيل المجموعة", content: clean, author, createdAt: Date.now() };
  entries.push(entry);
  data.aiGroupMemory[chat] = entries.slice(-MAX_GROUP_MEMORIES);
  return { ...entry };
}

function removeGroupMemory(db, chat, selector = "") {
  const data = getData(db);
  const entries = data.aiGroupMemory?.[chat] || [];
  const normalized = compact(selector, 120).toLowerCase();
  if (!normalized || ["الكل", "كل", "all"].includes(normalized)) {
    const removed = entries.length;
    if (data.aiGroupMemory) delete data.aiGroupMemory[chat];
    return { removed, all: true };
  }
  const kept = entries.filter((entry) => !entry.id.toLowerCase().includes(normalized) && !entry.content.toLowerCase().includes(normalized));
  const removed = entries.length - kept.length;
  if (kept.length) data.aiGroupMemory[chat] = kept;
  else if (data.aiGroupMemory) delete data.aiGroupMemory[chat];
  return { removed, all: false };
}

function formatGroupMemory(db, chat) {
  const entries = getGroupMemories(db, chat);
  if (!entries.length) return "🧠 *ذاكرة المجموعة*\n\n> لا توجد تفضيلات أو قواعد محفوظة لهذه المجموعة.";
  return `🧠 *ذاكرة المجموعة*\n\n${entries.map((entry, index) => `${index + 1}. *${entry.label}* — ${entry.content}\n> المعرف: \`${entry.id}\``).join("\n\n")}\n\n> يمكن للمشرف أو المالك إضافة أو إزالة المعلومات الصريحة فقط.`;
}

function buildGroupMemoryContext(db, chat) {
  const entries = getGroupMemories(db, chat).slice(-8);
  if (!entries.length) return "";
  return `ذاكرة المجموعة المتفق عليها (استخدمها عند صلتها بالسؤال فقط):\n${entries.map((entry) => `- ${entry.label}: ${entry.content}`).join("\n")}`;
}

function inferWorkSteps(goal) {
  const cleanGoal = compact(goal, 600);
  const pieces = cleanGoal.split(/(?:\s+ثم\s+|\s+وبعدها\s+|\s+بعد ذلك\s+|[،؛;])/).map((item) => compact(item, 180)).filter(Boolean);
  const steps = pieces.slice(0, 5);
  if (steps.length >= 2) return steps.map((title, index) => ({ id: index + 1, title, status: "pending" }));
  return [
    { id: 1, title: "تحديد المطلوب والقيود قبل البدء", status: "pending" },
    { id: 2, title: cleanGoal || "تنفيذ المهمة المطلوبة", status: "pending" },
    { id: 3, title: "فحص النتيجة وتقديم ملخص قابل للمراجعة", status: "pending" },
  ];
}

function createWorkPlan(db, chat, { owner, goal } = {}) {
  const cleanGoal = compact(goal, 600);
  if (cleanGoal.length < 3) throw new Error("اكتب الهدف المطلوب لوضع العمل");
  const data = getData(db);
  if (!data.aiWorkPlans) data.aiWorkPlans = {};
  const plan = { id: createId("WORK"), chat, owner, goal: cleanGoal, steps: inferWorkSteps(cleanGoal), createdAt: Date.now(), updatedAt: Date.now() };
  const plans = data.aiWorkPlans[chat] || [];
  plans.push(plan);
  data.aiWorkPlans[chat] = plans.slice(-MAX_WORK_PLANS);
  return { ...plan, steps: plan.steps.map((step) => ({ ...step })) };
}

function updateWorkPlan(db, chat, id, stepNumber, status = "done") {
  const plans = getData(db).aiWorkPlans?.[chat] || [];
  const plan = plans.find((item) => item.id === id);
  if (!plan) throw new Error("خطة العمل غير موجودة أو تخص مجموعة أخرى");
  const step = plan.steps.find((item) => item.id === Number(stepNumber));
  if (!step) throw new Error("رقم خطوة العمل غير موجود");
  step.status = status === "done" ? "done" : "pending";
  plan.updatedAt = Date.now();
  return { ...plan, steps: plan.steps.map((item) => ({ ...item })) };
}

function formatWorkPlan(plan) {
  const steps = plan.steps.map((step) => `${step.status === "done" ? "✅" : "▫️"} ${step.id}. ${step.title}`).join("\n");
  return `🗂️ *وضع العمل*\n\n*الهدف:* ${plan.goal}\n\n${steps}\n\n> المعرف: \`${plan.id}\`\n> لتحديث خطوة: \`أكمل WORK-... 2\``;
}

function recordDecision(db, entry = {}) {
  const data = getData(db);
  if (!data.aiDecisionLog) data.aiDecisionLog = [];
  const item = {
    id: createId("DEC"),
    type: compact(entry.type, 80) || "إجراء AI",
    status: compact(entry.status, 40) || "planned",
    chat: entry.chat || "",
    owner: entry.owner || "",
    summary: compact(entry.summary, 500),
    details: entry.details && typeof entry.details === "object" ? entry.details : {},
    createdAt: Date.now(),
  };
  data.aiDecisionLog.push(item);
  data.aiDecisionLog = data.aiDecisionLog.slice(-MAX_DECISIONS);
  return { ...item, details: { ...item.details } };
}

function listDecisions(db, { chat, owner, limit = 8 } = {}) {
  const entries = getData(db).aiDecisionLog || [];
  return entries.filter((entry) => (!chat || entry.chat === chat) && (!owner || entry.owner === owner)).slice(-limit).reverse().map((entry) => ({ ...entry, details: { ...entry.details } }));
}

function formatDecisions(entries) {
  if (!entries.length) return "📜 *سجل قرارات AI*\n\n> لا توجد إجراءات مسجلة بعد.";
  return `📜 *سجل قرارات AI*\n\n${entries.map((entry, index) => `${index + 1}. *${entry.type}* — ${entry.status}\n> ${entry.summary || "لا يوجد ملخص"}\n> المعرف: \`${entry.id}\``).join("\n\n")}`;
}

export {
  addGroupMemory,
  buildGroupMemoryContext,
  createWorkPlan,
  formatDecisions,
  formatGroupMemory,
  formatWorkPlan,
  getGroupMemories,
  listDecisions,
  recordDecision,
  removeGroupMemory,
  updateWorkPlan,
};
