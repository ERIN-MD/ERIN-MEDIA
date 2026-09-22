import assert from "node:assert/strict";
import { formatReview, runAnalysts } from "../src/lib/maro-code-review.js";

const reports = await runAnalysts("fixture.js", "const answer = 42;", [
  { name: "Gemini", run: async () => ({ text: "لا توجد مشكلة حرجة." }) },
  { name: "Claude", run: async () => ({ answer: "اقترح إضافة اختبار صغير." }) },
  { name: "GPT", run: async () => { throw new Error("فشل مزود تجريبي"); } },
]);

assert.equal(reports.length, 3);
assert.match(reports[0].text, /لا توجد مشكلة/);
assert.match(reports[1].text, /اختبار صغير/);
assert.match(reports[2].text, /تعذر التحليل/);

const report = formatReview({
  id: "MR-TEST-01",
  file: "fixture.js",
  summary: "تقرير موحد تجريبي.",
  issues: [{ severity: "low", title: "ملاحظة اختبار" }],
  proposals: [{ title: "تحسين اختبار", reason: "تغطية أفضل", edits: [] }],
  analyses: reports,
});

assert.match(report, /تحليل متعدد النماذج/);
assert.match(report, /MR-TEST-01/);
console.log("maro-code-review test: OK");
