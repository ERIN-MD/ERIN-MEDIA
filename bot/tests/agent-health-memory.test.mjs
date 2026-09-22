import assert from "node:assert/strict";
import { executeAgentTool } from "../src/lib/maro-agent-tools.js";
import { runAgentHealthCheck } from "../src/lib/maro-agent-health.js";
import {
  rememberStructured,
  getStructuredMemory,
  getMemoryStats,
  forgetPreference,
} from "../src/lib/maro-agent-memory.js";

const scope = `test:${Date.now()}`;
assert.equal(rememberStructured({ key: "fact", value: "اختبار حقيقة منظمة", scope, kind: "fact", confidence: 0.9 }).ok, true);
assert.equal(rememberStructured({ key: "capability", value: "فحص تجريبي", scope, kind: "capability", ttlMs: 60_000 }).ok, true);
const structured = getStructuredMemory(scope);
assert.equal(structured.facts.fact.value, "اختبار حقيقة منظمة");
assert.equal(structured.capabilities.capability.value, "فحص تجريبي");
assert.ok(getMemoryStats().facts >= 1);
assert.equal(forgetPreference("fact", { scope }).ok, true);
assert.equal(getStructuredMemory(scope).facts.fact, undefined);

const blockedHealth = await executeAgentTool("agent.health_check", {}, { isDeveloper: false });
assert.equal(blockedHealth.ok, false);
const health = await runAgentHealthCheck({ refresh: false, includeTests: false });
assert.equal(typeof health.ok, "boolean");
assert.ok(health.project.files > 0);

console.log("agent health and memory tests: passed");
