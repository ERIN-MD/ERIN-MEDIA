import { detectAgentIntent, buildAgentPlan } from "./maro-agent-intent.js";
import { executeAgentTool } from "./maro-agent-tools.js";
import { getToolCatalogText } from "./maro-agent-registry.js";
import { getProjectManifest } from "./maro-project-manifest.js";
import { buildMemoryContext, recordLesson } from "./maro-agent-memory.js";
import {
  assessPlan,
  createRunRecord,
  updateRunRecord,
  addApprovalRequest,
  verifyResult,
  getRunRecord,
  verificationStepsFor,
} from "./maro-agent-control.js";
import { appendAuditEvent } from "./maro-agent-audit.js";

function compactJson(value, max = 12_000) {
  try { return JSON.stringify(value, null, 2).slice(0, max); } catch { return String(value); }
}

function formatToolResult(result) {
  if (!result?.ok) return `❌ ${result?.tool || "tool"}: ${result?.error || "فشل غير معروف"}`;
  if (result.tool === "project.read_file") {
    return `✅ ${result.tool} (${result.path}:${result.start}-${result.end})\n${result.content}`;
  }
  return `✅ ${result.tool}\n${compactJson(result, 8_000)}`;
}

async function handleAgentRequest(m, { refresh = false } = {}) {
  const message = String(m?.body || "").trim();
  if (!message) return null;

  const isDeveloper = Boolean(m.isOwner);
  const intent = detectAgentIntent(message, { isDeveloper });
  if (!intent) return null;

  const memoryScope = isDeveloper ? "global" : `user:${m.sender || m.senderNumber || "unknown"}`;
  const plan = buildAgentPlan(intent, { isDeveloper, memoryScope, memoryOwner: m.sender || m.senderNumber || "" });
  if (!plan) return null;
  const assessedPlan = assessPlan(plan);
  const actor = m.sender || m.senderNumber || "unknown";
  const run = createRunRecord({
    message,
    intent: intent.intent,
    plan: assessedPlan,
    actor,
    isDeveloper,
  });
  appendAuditEvent({ type: "run_created", runId: run.id, actor, status: run.status, input: { intent: intent.intent, highestRisk: assessedPlan.highestRisk } });

  if (!plan.allowed) {
    updateRunRecord(run.id, { status: "blocked" });
    appendAuditEvent({ type: "run_blocked", runId: run.id, actor, status: "blocked", output: "أدوات المشروع للمطور فقط." });
    return {
      detected: true,
      blocked: true,
      intent,
      plan: assessedPlan,
      runId: run.id,
      context: `فهمت طلب المستخدم باعتباره ${intent.intent}، لكن أدوات المشروع والتعديل والتنفيذ متاحة للمطور فقط. لا تدّعِ أنك قرأت أو عدّلت أي ملف. أخبر المستخدم باحترام أن المطور وحده يستطيع تنفيذ هذا الطلب.`,
    };
  }

  if (assessedPlan.requiresApproval) {
    const approval = addApprovalRequest({
      runId: run.id,
      actor,
      reason: assessedPlan.approvalReason,
    });
    appendAuditEvent({ type: "approval_requested", runId: run.id, actor, status: "pending", output: approval.id, metadata: { reason: assessedPlan.approvalReason } });
    return {
      detected: true,
      blocked: false,
      pendingApproval: true,
      intent,
      plan: assessedPlan,
      runId: run.id,
      approvalId: approval.id,
      context: `تم إنشاء خطة للطلب، لكنها تنتظر موافقة المطور قبل أي تعديل أو تنفيذ. رقم التشغيل: ${run.id}. رقم الموافقة: ${approval.id}. اعرض الخطة ومستوى الخطر ولا تدّعِ تطبيقها.`,
    };
  }

  updateRunRecord(run.id, { status: "running" });
  const results = [];
  for (const step of plan.steps) {
    if (step.tool === "project.write_file" || step.tool === "project.execute" || step.tool === "project.diff") {
      results.push({ ok: false, tool: step.tool, error: "هذه الخطوة تحتاج مرحلة تعديل/تنفيذ صريحة للمطور ولم تُطبق تلقائياً بعد.", pending: true, input: step.input });
      continue;
    }
    const result = await executeAgentTool(step.tool, step.input, { isDeveloper });
    const verification = verifyResult(result, step);
    results.push({ ...result, verification });
    appendAuditEvent({ type: "tool_result", runId: run.id, tool: step.tool, actor, status: result.ok ? "success" : "failed", input: step.input, output: result.ok ? "ok" : result.error, metadata: { verified: verification.verified } });
    updateRunRecord(run.id, {
      steps: run.steps.map((runStep, index) => index === step.index ? { ...runStep, status: result.ok ? "completed" : "failed", verification: verification.verified } : runStep),
    });
  }

  const successCount = results.filter((result) => result.ok).length;
  const failedCount = results.length - successCount;
  const success = failedCount === 0;
  recordLesson({
    operation: intent.intent,
    success,
    summary: `${intent.original.slice(0, 160)} | نجح ${successCount} وفشل ${failedCount}`,
  });
  updateRunRecord(run.id, { status: success ? "completed" : "failed", success, resultCount: results.length });
  appendAuditEvent({ type: "run_finished", runId: run.id, actor, status: success ? "success" : "failed", metadata: { resultCount: results.length } });

  const manifest = refresh ? getProjectManifest({ refresh: true }) : null;
  return {
    detected: true,
    blocked: false,
    intent,
    plan: assessedPlan,
    runId: run.id,
    results,
    context: [
      "نتائج وكيل المشروع — استخدمها كمصدر الحقيقة ولا تدّعِ تنفيذ خطوة لم تنجح:",
      `النية: ${intent.intent}`,
      `الخطة: ${compactJson(plan.steps, 4_000)}`,
      results.map(formatToolResult).join("\n\n"),
      manifest ? `تم تحديث الفهرس: ${manifest.files?.length || 0} ملف.` : "",
      `الأدوات المعروفة حالياً:\n${getToolCatalogText()}`,
      buildMemoryContext(memoryScope) ? `ذاكرة الوكيل ذات الصلة:\n${buildMemoryContext(memoryScope)}` : "",
    ].filter(Boolean).join("\n\n"),
  };
}

async function resumeAgentRun(runId, { isDeveloper = false } = {}) {
  if (!isDeveloper) return { ok: false, error: "استئناف الخطط متاح للمطور فقط." };
  const run = getRunRecord(runId);
  if (!run) return { ok: false, error: "التشغيل غير موجود." };
  if (!["approved", "awaiting_approval"].includes(run.status)) return { ok: false, error: `حالة التشغيل لا تسمح بالاستئناف: ${run.status}` };
  if (run.status === "awaiting_approval") return { ok: false, error: "لم يتم تسجيل الموافقة بعد." };
  const results = [];
  appendAuditEvent({ type: "run_resumed", runId, actor: "owner", status: "running" });
  for (const step of run.steps || []) {
    if (step.status === "completed") continue;
    const result = await executeAgentTool(step.tool, { ...(step.input || {}), confirmation: "CONFIRM_MARO_WRITE" }, { isDeveloper: true });
    const verification = verifyResult(result, step);
    const checks = [];
    for (const checkStep of verificationStepsFor(step)) {
      const checkResult = await executeAgentTool(checkStep.tool, checkStep.input, { isDeveloper: true });
      checks.push({ ...checkResult, reason: checkStep.reason });
      appendAuditEvent({ type: "verification_result", runId, tool: checkStep.tool, actor: "owner", status: checkResult.ok ? "success" : "failed", input: checkStep.input, output: checkResult.ok ? "ok" : checkResult.error });
    }
    const checksPassed = checks.every((check) => check.ok);
    results.push({ ...result, verification: { ...verification, verified: verification.verified && checksPassed }, checks });
    appendAuditEvent({ type: "resumed_tool_result", runId, tool: step.tool, actor: "owner", status: result.ok && checksPassed ? "success" : "failed", input: step.input, output: result.ok ? "ok" : result.error, metadata: { verified: verification.verified && checksPassed } });
    step.status = result.ok && checksPassed ? "completed" : "failed";
    step.verification = verification.verified && checksPassed;
    if (!result.ok || !checksPassed) break;
  }
  const success = results.length > 0 && results.every((result) => result.ok && result.verification?.verified !== false);
  const updated = updateRunRecord(runId, { status: success ? "completed" : "failed", success, resumedAt: new Date().toISOString(), steps: run.steps });
  appendAuditEvent({ type: "run_resume_finished", runId, actor: "owner", status: success ? "success" : "failed", metadata: { resultCount: results.length } });
  return { ok: success, run: updated, results, message: success ? "تم استئناف الخطة والتحقق من نتائجها." : "تعذر استكمال الخطة؛ راجع النتائج." };
}

export { handleAgentRequest, formatToolResult, resumeAgentRun };
