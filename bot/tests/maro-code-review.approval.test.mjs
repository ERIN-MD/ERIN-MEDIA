import assert from "node:assert/strict";
import { handleCodeReviewFlow } from "../src/lib/maro-code-review.js";

const replies = [];
const m = {
  isOwner: true,
  sender: "owner@test",
  body: "حلل ملف: tests/fixtures/review-target.js",
  reply: async (text) => { replies.push(text); },
};

const plan = {
  id: "MR-APPROVAL-01",
  file: "tests/fixtures/review-target.js",
  summary: "خطة اختبار الموافقة.",
  issues: [],
  proposals: [{ title: "تعديل تجريبي", reason: "اختبار", edits: [{ search: "a", replace: "b" }] }],
  analyses: [{ name: "Gemini", text: "تم" }],
};
let appliedId = null;
const dependencies = {
  createReviewFn: async () => plan,
  applyPlanFn: async (_owner, id) => {
    appliedId = id;
    return { file: plan.file, backup: "backup/test.bak", applied: 1 };
  },
  getOwnerPlansFn: () => [plan],
};

assert.equal(await handleCodeReviewFlow(m, dependencies), true);
assert.match(replies.at(-1), /MR-APPROVAL-01/);

m.body = "نعم";
assert.equal(await handleCodeReviewFlow(m, dependencies), true);
assert.equal(appliedId, "MR-APPROVAL-01");
assert.match(replies.at(-1), /تم تطبيق/);
console.log("maro-code-review approval test: OK");
