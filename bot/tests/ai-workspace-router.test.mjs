import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { initDatabase } from "../src/lib/maro-database.js";
import {
  addGroupMemory,
  buildGroupMemoryContext,
  createWorkPlan,
  getGroupMemories,
  listDecisions,
  recordDecision,
  removeGroupMemory,
  updateWorkPlan,
} from "../src/lib/maro-ai-workspace.js";
import { chooseProviderRoute, runRoutedChat } from "../src/lib/maro-ai-router.js";

const dbRoot = await fs.mkdtemp(path.join(os.tmpdir(), "marobot-ai-workspace-"));
const db = await initDatabase(path.join(dbRoot, "main"));
const chat = "workspace-test@g.us";
const owner = "201142324733@s.whatsapp.net";

const memory = addGroupMemory(db, chat, { content: "نستخدم العربية الفصحى في الشروحات التقنية.", author: owner, label: "أسلوب الرد" });
assert.equal(getGroupMemories(db, chat).length, 1);
assert.match(buildGroupMemoryContext(db, chat), /العربية الفصحى/);
assert.equal(removeGroupMemory(db, chat, memory.id).removed, 1);
assert.equal(getGroupMemories(db, chat).length, 0);

const plan = createWorkPlan(db, chat, { owner, goal: "حلل الخطأ ثم اقترح الإصلاح ثم افحص النتيجة" });
assert.equal(plan.steps.length, 3);
const updated = updateWorkPlan(db, chat, plan.id, 2);
assert.equal(updated.steps[1].status, "done");

recordDecision(db, { type: "اختبار", status: "planned", chat, owner, summary: "خطة تجريبية" });
assert.equal(listDecisions(db, { chat, owner }).length, 1);

// CONTRACT UPDATED — INTENTIONAL.
// The routing table in maro-ai-router.js was changed so that `code` (and
// `document`) lead with Claude for analysis/planning, keeping DeepSeek as the
// first fallback. This test still asserted the OLD table (primary DeepSeek).
// It never surfaced because the throw was swallowed by the global
// uncaughtException handler, so the suite reported a false PASS.
// Assert the CURRENT documented contract, including fallback ORDER.
const codeRoute = chooseProviderRoute({ text: "حلل خطأ JavaScript في البلوقن" });
assert.equal(codeRoute.task, "code");
assert.equal(codeRoute.primary, "Claude");
assert.deepEqual(codeRoute.fallbacks, ["DeepSeek", "GeminiAPI", "GPT"]);

// failover must walk primary -> fallbacks in order, skipping unavailable ones
const calls = [];
const routed = await runRoutedChat({
  route: codeRoute,
  payload: { message: "test", instruction: "test" },
  providers: {
    Claude: async () => { calls.push("Claude"); throw new Error("غير متاح"); },
    DeepSeek: async () => { calls.push("DeepSeek"); throw new Error("غير متاح"); },
    GeminiAPI: async () => { calls.push("GeminiAPI"); return { text: "حل بديل" }; },
  },
});
assert.equal(routed.provider, "GeminiAPI");
assert.deepEqual(calls, ["Claude", "DeepSeek", "GeminiAPI"]);

// the other documented routes
assert.equal(chooseProviderRoute({ text: "ارسم لي صورة قطة" }).task !== "code", true);
assert.equal(chooseProviderRoute({ hasImage: true, text: "ماذا ترى؟" }).primary, "GeminiAPI");

await fs.rm(dbRoot, { recursive: true, force: true });
console.log("ai workspace and router tests: passed");
