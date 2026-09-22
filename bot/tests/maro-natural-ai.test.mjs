import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { findProjectFiles, getProjectHealth, handleNaturalAIRequest } from "../src/lib/maro-natural-ai.js";

const root = await fs.mkdtemp(path.join(os.tmpdir(), "marobot-natural-"));
await fs.mkdir(path.join(root, "src"), { recursive: true });
await fs.mkdir(path.join(root, "case"), { recursive: true });
await fs.writeFile(path.join(root, "src", "handler.js"), "export const ok = true;\n", "utf8");
await fs.writeFile(path.join(root, "case", "maro.js"), "export const command = 'menu';\n", "utf8");
await fs.writeFile(path.join(root, "src", "broken.js"), "function broken( {\n", "utf8");

const commandMatches = await findProjectFiles("اوامر", { root });
assert.equal(commandMatches[0].path, "src/handler.js");
const audit = await getProjectHealth({ root, maxFiles: 10 });
assert.equal(audit.syntaxErrors.length, 1);
assert.equal(audit.syntaxErrors[0].file, "src/broken.js");

function message(body, extra = {}) {
  const replies = [];
  const reactions = [];
  return {
    body, chat: "group@g.us", sender: "201142324733@s.whatsapp.net", isGroup: true, isOwner: true, isAdmin: true,
    reply: async (text) => replies.push(text), react: async (emoji) => reactions.push(emoji),
    replies, reactions, ...extra,
  };
}

const sent = [];
const sock = {
  user: { id: "201034648449:1@s.whatsapp.net" },
  profilePictureUrl: async () => "https://example.test/profile.jpg",
  sendMessage: async (...args) => sent.push(args),
  groupMetadata: async () => ({ participants: [
    { id: "201142324733@s.whatsapp.net", admin: "admin" },
    { id: "201100000001@s.whatsapp.net", admin: null },
    { id: "201100000002@s.whatsapp.net", admin: "admin" },
  ] }),
};

assert.equal(await handleNaturalAIRequest(message("اعطيني صورة ملفي الشخصي"), sock, { db: { db: { data: {} } } }), true);
assert.equal(sent[0][1].image.url, "https://example.test/profile.jpg");

const tagMessage = message("منشن الأعضاء دون المشرفين");
assert.equal(await handleNaturalAIRequest(tagMessage, sock, { db: { db: { data: {} } } }), true);
assert.deepEqual(sent[1][1].mentions, ["201100000001@s.whatsapp.net"]);

const memoryMessage = message("حلل الذاكرة");
assert.equal(await handleNaturalAIRequest(memoryMessage, sock, { db: { db: { data: { autoai: {}, longTermMemory: {} } } } }), true);
assert.match(memoryMessage.replies[0], /تحليل ذاكرة Tarboo Bot/);

const groupChanges = [];
const groupDb = { db: { data: {} }, setGroup: (...args) => groupChanges.push(args) };
const changeRequest = message("فعل منع الروابط");
assert.equal(await handleNaturalAIRequest(changeRequest, sock, { db: groupDb }), true);
assert.equal(groupChanges.length, 0, "لا يطبق تغيير المجموعة قبل التأكيد");
const confirmationId = changeRequest.replies[0].match(/NAT-[A-Z0-9-]+/)?.[0];
assert.ok(confirmationId, "يُنشأ معرف تأكيد للإجراء المؤثر");
const confirmChange = message(`أكد ${confirmationId}`);
assert.equal(await handleNaturalAIRequest(confirmChange, sock, { db: groupDb }), true);
assert.equal(groupChanges.length, 1, "يطبق تغيير المجموعة بعد التأكيد فقط");
assert.deepEqual(groupChanges[0], ["group@g.us", { antilinkall: "on" }]);

let movePlanCalls = 0;
let moveExecutionCalls = 0;
const plannedMove = {
  source: "plugins/owner/تست.js",
  destination: "plugins/main/تست.js",
  changes: ["الفئة: owner ← main", "صلاحية المالك: true ← false"],
  importsChecked: true,
};
const moveRequest = message("انقل بلوقن تست من owner إلى main واجعله عاماً");
assert.equal(await handleNaturalAIRequest(moveRequest, sock, {
  db: { db: { data: {} } },
  createPluginMovePlanFn: async () => {
    movePlanCalls += 1;
    return plannedMove;
  },
  executePluginMovePlanFn: async (plan) => {
    moveExecutionCalls += 1;
    assert.equal(plan, plannedMove);
    return {
      source: plan.source,
      destination: plan.destination,
      backup: "backup/ai-plugin-move/تست.js.test.bak",
      checks: ["فحص صياغة JavaScript", "فحص الاستيرادات المحلية"],
    };
  },
}), true);
assert.equal(movePlanCalls, 1);
assert.equal(moveExecutionCalls, 0, "لا ينقل AutoAI البلوقن قبل موافقة المالك");
const moveConfirmationId = moveRequest.replies[0].match(/NAT-[A-Z0-9-]+/)?.[0];
assert.ok(moveConfirmationId, "ينشئ AutoAI معرف تأكيد لخطة النقل");
const confirmMove = message(`أكد ${moveConfirmationId}`);
assert.equal(await handleNaturalAIRequest(confirmMove, sock, { db: { db: { data: {} } } }), true);
assert.equal(moveExecutionCalls, 1, "ينفذ AutoAI خطة النقل بعد تأكيد المالك فقط");
assert.match(confirmMove.replies[0], /تم نقل البلوقن بنجاح/);

const workspaceDb = { db: { data: {} }, save: async () => {} };
const memoryAdd = message("احفظ في ذاكرة المجموعة: نشرح البرمجة بالعربية الفصحى");
assert.equal(await handleNaturalAIRequest(memoryAdd, sock, { db: workspaceDb }), true);
assert.match(memoryAdd.replies[0], /حُفظت في ذاكرة المجموعة/);
const memoryList = message("اعرض ذاكرة المجموعة");
assert.equal(await handleNaturalAIRequest(memoryList, sock, { db: workspaceDb }), true);
assert.match(memoryList.replies[0], /نشرح البرمجة بالعربية الفصحى/);

const workPlan = message("خطط لي: حلل الخطأ ثم اختبر البلوقن");
assert.equal(await handleNaturalAIRequest(workPlan, sock, { db: workspaceDb }), true);
const workId = workPlan.replies[0].match(/WORK-[A-Z0-9-]+/)?.[0];
assert.ok(workId, "ينشئ وضع العمل معرفاً للخطة");
const completeStep = message(`أكمل ${workId} 1`);
assert.equal(await handleNaturalAIRequest(completeStep, sock, { db: workspaceDb }), true);
assert.match(completeStep.replies[0], /✅ 1\./);
const decisions = message("سجل القرارات");
assert.equal(await handleNaturalAIRequest(decisions, sock, { db: workspaceDb }), true);
assert.match(decisions.replies[0], /ذاكرة مجموعة/);

const errorDiagnosis = message("حلل هذا الخطأ", {
  quoted: { text: "TypeError: Cannot read properties of undefined at src/lib/test.js:14:7" },
});
assert.equal(await handleNaturalAIRequest(errorDiagnosis, sock, { db: workspaceDb }), true);
assert.match(errorDiagnosis.replies[0], /تشخيص أولي للخطأ/);
assert.match(errorDiagnosis.replies[0], /src\/lib\/test.js/);

const unauthorizedMove = message("انقل بلوقن تست من owner إلى main واجعله عاماً", {
  isOwner: false,
  sender: "201100000001@s.whatsapp.net",
});
assert.equal(await handleNaturalAIRequest(unauthorizedMove, sock, {
  db: { db: { data: {} } },
  createPluginMovePlanFn: async () => plannedMove,
}), true);
assert.deepEqual(unauthorizedMove.reactions, ["🔒"], "يرفض AutoAI خطط نقل البلوقن لغير المالك");

await fs.rm(root, { recursive: true, force: true });
console.log("maro-natural-ai test: OK");
