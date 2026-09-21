import assert from "node:assert/strict";
import fs from "fs/promises";
import path from "path";
import { applyPlan, createReview } from "../src/lib/maro-code-review.js";

const relativePath = "tests/fixtures/review-target.js";
const fullPath = path.join(process.cwd(), relativePath);
const original = await fs.readFile(fullPath, "utf8");

try {
  const analysts = [
    { name: "Gemini", run: async () => ({ text: "التغيير آمن." }) },
    { name: "Claude", run: async () => ({ answer: "تحسين بسيط مطلوب." }) },
    { name: "GPT", run: async () => ({ answer: "لا توجد مخاطر إضافية." }) },
  ];
  const planner = async () => ({
    summary: "خطة اختبار end-to-end.",
    issues: [],
    proposals: [{
      title: "تعديل قيمة الاختبار",
      reason: "للتحقق من المسار الكامل",
      edits: [{ search: 'export const reviewTarget = "before";', replace: 'export const reviewTarget = "after";', reason: "اختبار" }],
    }],
  });

  const plan = await createReview("owner@test", relativePath, { analysts, planner });
  assert.equal(plan.proposals.length, 1);
  const result = await applyPlan("owner@test", plan.id);
  assert.equal(result.file, relativePath);
  assert.equal(result.applied, 1);
  assert.match(await fs.readFile(fullPath, "utf8"), /"after"/);
  await fs.access(path.join(process.cwd(), result.backup));
  console.log("maro-code-review e2e test: OK");
} finally {
  await fs.writeFile(fullPath, original, "utf8");
}
