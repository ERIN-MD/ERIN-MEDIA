import assert from "node:assert/strict";
import { runAnalysts } from "../src/lib/maro-code-review.js";

const reports = await runAnalysts("fixture.js", "export const answer = 42;");
const healthy = reports.filter((report) => !report.text.startsWith("تعذر التحليل:"));

console.log(`live analysts available: ${healthy.map((report) => report.name).join(", ") || "none"}`);
assert.ok(healthy.length >= 1, "لم ينجح أي مزود تحليل فعلي");
console.log("maro-code-review live provider test: OK");
