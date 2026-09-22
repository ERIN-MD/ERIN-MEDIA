import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import {
  assessPlan,
  createRunRecord,
  addApprovalRequest,
  decideApproval,
  getRunRecord,
} from "../src/lib/maro-agent-control.js";
import { resumeAgentRun } from "../src/lib/maro-agent-runner.js";
import { listAuditEvents } from "../src/lib/maro-agent-audit.js";

const target = "tests/fixtures/agent-control-target.txt";
const absoluteTarget = path.join(process.cwd(), target);
await fs.mkdir(path.dirname(absoluteTarget), { recursive: true });
await fs.writeFile(absoluteTarget, "before\n", "utf8");

const plan = assessPlan({
  intent: "modify_project",
  requiresConfirmation: true,
  steps: [{ tool: "project.write_file", input: { path: target, content: "after\n" } }],
});
assert.equal(plan.requiresApproval, true);
assert.equal(plan.highestRisk, "write");

const run = createRunRecord({ message: "عدّل ملف اختبار", intent: "modify_project", plan, actor: "owner@test", isDeveloper: true });
const approval = addApprovalRequest({ runId: run.id, actor: "owner@test", reason: plan.approvalReason });
assert.equal(getRunRecord(run.id).status, "awaiting_approval");
assert.equal(decideApproval(approval.id, { approved: true, decidedBy: "owner@test" }).ok, true);

const resumed = await resumeAgentRun(run.id, { isDeveloper: true });
assert.equal(resumed.ok, true);
assert.equal(await fs.readFile(absoluteTarget, "utf8"), "after\n");
assert.ok(resumed.results[0].backup);
const audit = listAuditEvents({ runId: run.id, limit: 30 });
assert.ok(audit.some((event) => event.type === "approval_decided"));
assert.ok(audit.some((event) => event.type === "run_resume_finished"));

await fs.rm(absoluteTarget, { force: true });
await fs.rm(`${absoluteTarget}.agent-backup-${resumed.results[0].backup.split("-").at(-1)}`, { force: true }).catch(() => {});
console.log("agent control approval tests: passed");
