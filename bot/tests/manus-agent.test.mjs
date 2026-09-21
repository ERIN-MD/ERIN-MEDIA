import assert from "node:assert/strict";
import { ManusAgent } from "../src/scraper/manus-agent.js";

const calls = [];
const fetchImpl = async (url, options = {}) => {
  calls.push({ url, options });
  const payload = url.includes("task.create")
    ? { ok: true, task_id: "task-maro-test" }
    : {
        ok: true,
        messages: [
          { type: "status_update", status_update: { agent_status: "stopped" } },
          { type: "assistant_message", assistant_message: { content: "تقرير Manus التجريبي" } },
        ],
      };
  return { ok: true, status: 200, json: async () => payload };
};

const result = await ManusAgent("حلل هذا الملف", { apiKey: "test-key", baseUrl: "https://api.example.test", fetchImpl, pollIntervalMs: 1, timeoutMs: 15000 });
assert.equal(result.status, true);
assert.equal(result.text, "تقرير Manus التجريبي");
assert.equal(result.taskId, "task-maro-test");
assert.equal(calls.length, 2);
assert.equal(calls[0].options.headers["x-manus-api-key"], "test-key");
assert.match(JSON.parse(calls[0].options.body).message.content, /لا تعدل ملفات/);

const missingKey = await ManusAgent("اختبار", { apiKey: "" });
assert.equal(missingKey.status, false);
assert.match(missingKey.error, /MANUS_API_KEY/);

console.log("manus-agent test: OK");
