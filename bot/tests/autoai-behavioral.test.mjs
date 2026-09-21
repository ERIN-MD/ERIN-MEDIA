import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import config from "../config.js";
import { handleAutoAI } from "../src/lib/maro-auto-ai.js";
import { formatAutoAIStatus, handler as autoAiCommandHandler } from "../plugins/group/autoai.js";
import { initDatabase } from "../src/lib/maro-database.js";

const originalPrimary = config.bot.primaryNumber;
config.bot.primaryNumber = "201034648449";
const chat = "autoai-test@g.us";
const settings = { enabled: true, instruction: "أجب باختصار.", character: "assistant", responseType: "text", sessions: {} };
const dbRoot = await fs.mkdtemp(path.join(os.tmpdir(), "marobot-autoai-"));
const db = await initDatabase(path.join(dbRoot, "main"));
db.db.data.autoai = { [chat]: settings };
db.db.data.autoai_global = { enabled: false };
const replies = [];
const baseMessage = {
  isGroup: true, fromMe: false, isCommand: false, chat, sender: "201999999999@s.whatsapp.net", body: "رسالة اختبار عادية",
  groupMembers: [{ id: "201034648449@s.whatsapp.net" }], quoted: null,
  reply: async (text) => replies.push(text), react: async () => {},
};
const sock = { user: { id: "201034648449:1@s.whatsapp.net" }, sendPresenceUpdate: async () => {}, sendMessage: async () => {} };

const handled = await handleAutoAI(baseMessage, sock, { db, geminiChat: async () => ({ text: "تم الرد تلقائياً" }) });
assert.equal(handled, true);
assert.match(replies.at(-1), /تم الرد تلقائياً/);
assert.equal(settings.lastError, "", "تنظيف آخر خطأ بعد استجابة ناجحة");

const failureMessage = { ...baseMessage, sender: "201999999998@s.whatsapp.net", body: "رسالة تسبب اختبار فشل" };
await handleAutoAI(failureMessage, sock, { db, geminiChat: async () => { throw new Error("تعذر الوصول إلى المزود"); } });
assert.match(settings.lastError, /تعذر الوصول/);
// CONTRACT UPDATED — INTENTIONAL.
// formatAutoAIStatus() now renders through the AXION design system, so the
// old "key: value" literals ("آخر خطأ: ...", "الرد التلقائي: ...") no longer
// appear verbatim. The DATA contract is unchanged and is what we assert:
// every field the old panel exposed must still be surfaced.
const statusWithError = formatAutoAIStatus(settings);
assert.match(statusWithError, /آخر خطأ/, "the last-error field must still be shown");
assert.match(statusWithError, /تعذر الوصول/, "the actual error text must still be shown");
assert.match(statusWithError, /حالة Auto AI/);
for (const field of ["التفعيل", "وضع الرد", "النطاق", "الشخصية", "آخر رفض", "التشخيص"]) {
  assert.match(statusWithError, new RegExp(field), `status must still surface "${field}"`);
}
// reply-mode is now expressed by its label rather than an on/off literal
assert.match(formatAutoAIStatus({ enabled: true }), /كل الرسائل ضمن النطاق/);
assert.match(
  formatAutoAIStatus({ enabled: true, alwaysReply: false }),
  /عند منشن البوت أو الرد عليه فقط/,
);
// enabled/disabled is still distinguishable
assert.match(formatAutoAIStatus({ enabled: true }), /مفعّل/);
assert.match(formatAutoAIStatus({ enabled: false }), /معطّل/);

const privateOwnerReplies = [];
await autoAiCommandHandler({
  isGroup: false,
  isOwner: true,
  isAdmin: false,
  chat,
  args: ["حالة"],
  fullArgs: "حالة",
  text: "حالة",
  body: ".autoai حالة",
  reply: async (text) => privateOwnerReplies.push(text),
  react: async () => {},
});
assert.match(privateOwnerReplies[0], /حالة Auto AI/, "المالك يتجاوز قيد المجموعة المباشر لأمر الحالة");

delete db.db.data.autoai[chat];
db.db.data.autoai_global = { enabled: true, characterName: "Global", lastError: "خطأ عام محفوظ" };
const globalStatusReplies = [];
await autoAiCommandHandler({
  isGroup: false, isOwner: true, isAdmin: false, chat, args: ["حالة"], fullArgs: "حالة", text: "حالة", body: ".autoai حالة",
  reply: async (text) => globalStatusReplies.push(text), react: async () => {},
});
assert.match(globalStatusReplies[0], /المصدر: الإعداد العام/);
assert.match(globalStatusReplies[0], /آخر خطأ[\s\S]{0,40}خطأ عام محفوظ/);

db.db.data.autoai[chat] = { enabled: true, alwaysReply: false, lastError: "خطأ محلي محفوظ" };
const localStatusReplies = [];
await autoAiCommandHandler({
  isGroup: true, isOwner: true, isAdmin: false, chat, args: ["حالة"], fullArgs: "حالة", text: "حالة", body: ".autoai حالة",
  reply: async (text) => localStatusReplies.push(text), react: async () => {},
});
assert.match(localStatusReplies[0], /المصدر: إعداد المجموعة/);
assert.match(localStatusReplies[0], /عند منشن البوت أو الرد عليه فقط/);
assert.match(localStatusReplies[0], /آخر خطأ[\s\S]{0,40}خطأ محلي محفوظ/);

config.bot.primaryNumber = originalPrimary;
await fs.rm(dbRoot, { recursive: true, force: true });
console.log("autoai behavioral tests: passed");
process.exit(0);
