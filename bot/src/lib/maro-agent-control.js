import fs from "fs";
import path from "path";
import { DATA_DIR, getToolRegistry, redactSecrets } from "./maro-agent-registry.js";
import { appendAuditEvent } from "./maro-agent-audit.js";

const CONTROL_PATH = path.join(DATA_DIR, "agent-control.json");
const MAX_RUNS = 120;
const RISK_ORDER = ["read_only", "memory_write", "safe_execution", "write", "execution"];
const RISK_LABELS = {
  read_only: "قراءة فقط",
  memory_write: "كتابة ذاكرة محدودة",
  safe_execution: "تنفيذ آمن مسجل",
  write: "تعديل ملف",
  execution: "تنفيذ أمر",
};

function ensureControlDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadControlState() {
  ensureControlDir();
  try {
    const parsed = JSON.parse(fs.readFileSync(CONTROL_PATH, "utf8"));
    return {
      version: 1,
      runs: Array.isArray(parsed.runs) ? parsed.runs.slice(-MAX_RUNS) : [],
      approvals: Array.isArray(parsed.approvals) ? parsed.approvals.slice(-MAX_RUNS) : [],
      updatedAt: parsed.updatedAt || null,
    };
  } catch {
    return { version: 1, runs: [], approvals: [], updatedAt: null };
  }
}

function saveControlState(state) {
  ensureControlDir();
  const next = {
    version: 1,
    runs: Array.isArray(state.runs) ? state.runs.slice(-MAX_RUNS) : [],
    approvals: Array.isArray(state.approvals) ? state.approvals.slice(-MAX_RUNS) : [],
    updatedAt: new Date().toISOString(),
  };
  const temporary = `${CONTROL_PATH}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  fs.renameSync(temporary, CONTROL_PATH);
  return next;
}

function riskRank(risk) {
  const index = RISK_ORDER.indexOf(risk);
  return index === -1 ? 0 : index;
}

function riskForTool(toolName = "") {
  const tool = getToolRegistry()[toolName];
  return tool?.risk || (toolName.startsWith("project.") ? "read_only" : "memory_write");
}

function assessPlan(plan = {}) {
  const steps = Array.isArray(plan.steps) ? plan.steps : [];
  const annotatedSteps = steps.map((step, index) => ({
    ...step,
    index,
    risk: riskForTool(step.tool),
    label: RISK_LABELS[riskForTool(step.tool)] || riskForTool(step.tool),
  }));
  const highest = annotatedSteps.reduce((current, step) => riskRank(step.risk) > riskRank(current) ? step.risk : current, "read_only");
  const requiresApproval = annotatedSteps.some((step) => step.risk === "write" || step.risk === "execution") || Boolean(plan.requiresConfirmation);
  return {
    ...plan,
    steps: annotatedSteps,
    highestRisk: highest,
    highestRiskLabel: RISK_LABELS[highest] || highest,
    requiresApproval,
    approvalReason: requiresApproval ? "الخطة تتضمن تعديلاً أو تنفيذاً حساساً." : "الخطة لا تتضمن كتابة أو تنفيذ أمر حساس.",
  };
}

function verificationStepsFor(step = {}) {
  if (step.tool === "project.write_file" && /\.(?:m?js|cjs)$/i.test(String(step.input?.path || ""))) {
    return [{ tool: "project.syntax_check", input: { path: step.input.path }, reason: "التحقق من صياغة الملف بعد التعديل" }];
  }
  if (step.tool === "project.execute" && ["syntax", "test", "manifest"].includes(step.input?.command)) {
    return [{ tool: "project.project_manifest", input: { refresh: false }, reason: "تحديث سياق الفهرس بعد التنفيذ" }];
  }
  return [];
}

function createRunRecord({ message = "", intent = "", plan = {}, actor = "", isDeveloper = false } = {}) {
  const assessed = assessPlan(plan);
  const record = {
    id: `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: assessed.requiresApproval ? "awaiting_approval" : "running",
    message: redactSecrets(message).slice(0, 500),
    intent: String(intent).slice(0, 100),
    actor: String(actor).slice(0, 120),
    isDeveloper: Boolean(isDeveloper),
    highestRisk: assessed.highestRisk,
    requiresApproval: assessed.requiresApproval,
    steps: assessed.steps.map((step) => ({ tool: step.tool, input: step.input || {}, risk: step.risk, status: "pending" })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const state = loadControlState();
  state.runs.push(record);
  saveControlState(state);
  return record;
}

function updateRunRecord(runId, patch = {}) {
  const state = loadControlState();
  const run = state.runs.find((item) => item.id === runId);
  if (!run) return null;
  Object.assign(run, patch, { updatedAt: new Date().toISOString() });
  saveControlState(state);
  return run;
}

function getRunRecord(runId) {
  return loadControlState().runs.find((item) => item.id === runId) || null;
}

function listRunRecords(limit = 20) {
  return loadControlState().runs.slice(-Math.max(1, Math.min(Number(limit) || 20, MAX_RUNS))).reverse();
}

function addApprovalRequest({ runId, actor = "", reason = "", expiresInMs = 15 * 60 * 1000 } = {}) {
  const state = loadControlState();
  const approval = {
    id: `approval-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    runId,
    actor: String(actor).slice(0, 120),
    reason: redactSecrets(reason).slice(0, 500),
    status: "pending",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
  };
  state.approvals.push(approval);
  saveControlState(state);
  return approval;
}

function getApproval(approvalId) {
  return loadControlState().approvals.find((item) => item.id === approvalId) || null;
}

function decideApproval(approvalId, { approved = false, decidedBy = "", note = "" } = {}) {
  const state = loadControlState();
  const approval = state.approvals.find((item) => item.id === approvalId);
  if (!approval) return { ok: false, error: "طلب الموافقة غير موجود." };
  if (approval.status !== "pending") return { ok: false, error: "طلب الموافقة حُسم سابقاً." };
  if (Date.parse(approval.expiresAt) < Date.now()) {
    approval.status = "expired";
    saveControlState(state);
    return { ok: false, error: "انتهت صلاحية طلب الموافقة." };
  }
  approval.status = approved ? "approved" : "rejected";
  approval.decidedBy = String(decidedBy).slice(0, 120);
  approval.note = redactSecrets(note).slice(0, 300);
  approval.decidedAt = new Date().toISOString();
  saveControlState(state);
  appendAuditEvent({ type: "approval_decided", runId: approval.runId, actor: approval.decidedBy, status: approval.status, output: approval.note, metadata: { approvalId: approval.id } });
  if (approval.runId) updateRunRecord(approval.runId, { status: approved ? "approved" : "rejected" });
  return { ok: true, approval };
}

function verifyResult(result, step = {}) {
  if (!result || result.ok !== true) return { ok: false, verified: false, reason: result?.error || "لا توجد نتيجة ناجحة للتحقق." };
  if (step.tool === "project.write_file" && !result.backup) return { ok: false, verified: false, reason: "التعديل لم يُرجع نسخة احتياطية." };
  return { ok: true, verified: true, reason: "نتيجة الأداة صالحة مبدئياً." };
}

export {
  CONTROL_PATH,
  RISK_ORDER,
  RISK_LABELS,
  loadControlState,
  saveControlState,
  riskForTool,
  assessPlan,
  verificationStepsFor,
  createRunRecord,
  updateRunRecord,
  getRunRecord,
  listRunRecords,
  addApprovalRequest,
  getApproval,
  decideApproval,
  verifyResult,
};
