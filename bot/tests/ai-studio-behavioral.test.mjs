import assert from "node:assert/strict";
console.log("ai studio behavioral: loading");
const { handleAiStudioRequest } = await import("../src/lib/maro-ai-studio.js");
const { enqueueTask, getTaskStatus } = await import("../src/lib/maro-task-queue.js");

const ownerReplies = [];
const owner = {
  body: "انشئ صورة روبوت ذهبي بسيط",
  sender: "201142324733@s.whatsapp.net",
  chat: "test@s.whatsapp.net",
  isOwner: true,
  reply: async (text) => ownerReplies.push(text),
  react: async () => {},
};
const staged = await handleAiStudioRequest(owner, { sendMessage: async () => {} });
assert.equal(staged, true);
const id = ownerReplies[0].match(/IMG-[A-Z0-9-]+/)?.[0];
assert.ok(id, "يُنشأ معرف موافقة للصورة قبل أي مزود خارجي");

let locked = "";
const nonOwnerConfirm = {
  body: `وافق على الصورة ${id}`,
  sender: "201999999999@s.whatsapp.net",
  chat: "test@s.whatsapp.net",
  isOwner: false,
  reply: async () => {},
  react: async (emoji) => { locked = emoji; },
};
const rejected = await handleAiStudioRequest(nonOwnerConfirm, { sendMessage: async () => { throw new Error("لا يجب الاتصال بمزود الصورة"); } });
assert.equal(rejected, true);
assert.equal(locked, "🔒", "لا يسمح لغير المالك بتأكيد إنشاء الصورة");

const onePixelPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVR4nGNgYGAAAAAEAAH2FzhVAAAAAElFTkSuQmCC", "base64");
const enhanced = [];
const localEnhancement = {
  body: "حسن هذه الصورة",
  sender: "201142324733@s.whatsapp.net",
  chat: "test@s.whatsapp.net",
  isOwner: true,
  isImage: true,
  download: async () => onePixelPng,
  reply: async () => {},
  react: async () => {},
};
const enhancedHandled = await handleAiStudioRequest(localEnhancement, {
  sendMessage: async (chat, payload) => enhanced.push({ chat, payload }),
});
assert.equal(enhancedHandled, true);
assert.ok(Buffer.isBuffer(enhanced[0]?.payload?.image), "تحسين الصورة يرسل ملف الصورة المحسن محلياً");
assert.match(enhanced[0]?.payload?.caption || "", /Tarboo Bot/);

const trackedTask = enqueueTask({ type: "document-analysis", owner: owner.sender, cleanupMs: 40, run: async () => {
  await new Promise((resolve) => setTimeout(resolve, 25));
  return "done";
} });
const statusReplies = [];
const statusHandled = await handleAiStudioRequest({
  body: `حالة المهمة ${trackedTask.id}`,
  sender: owner.sender,
  chat: owner.chat,
  isOwner: true,
  reply: async (text) => statusReplies.push(text),
  react: async () => {},
}, { sendMessage: async () => {} });
assert.equal(statusHandled, true);
assert.match(statusReplies[0], new RegExp(trackedTask.id));
assert.match(statusReplies[0], /queued|running|completed/);
await trackedTask.done;

const longReplies = [];
let longTaskId = "";
let taskCreated;
const longMessage = {
  body: "حلل هذا الملف",
  sender: owner.sender,
  chat: owner.chat,
  isOwner: true,
  quoted: {
    isDocument: true,
    fileName: "sample.js",
    mimetype: "text/javascript",
    download: async () => Buffer.from("export const sample = true;\n"),
  },
  reply: async (text) => {
    longReplies.push(text);
    longTaskId ||= text.match(/TASK-[A-Z0-9-]+/)?.[0] || "";
  },
  react: async () => {},
};
const longRun = handleAiStudioRequest(longMessage, { sendMessage: async () => {} }, {
  enqueueTask: (options) => {
    taskCreated = enqueueTask({ ...options, cleanupMs: 35 });
    return taskCreated;
  },
  documentAnalyzer: async () => {
    await new Promise((resolve) => setTimeout(resolve, 25));
    return { text: "تحليل مستند تجريبي" };
  },
});
while (!longTaskId) await new Promise((resolve) => setTimeout(resolve, 2));
assert.match(longReplies[0], /رقم المهمة/);
const statusDuringLongRun = [];
await handleAiStudioRequest({
  body: `حالة المهمة ${longTaskId}`,
  sender: owner.sender,
  chat: owner.chat,
  isOwner: true,
  reply: async (text) => statusDuringLongRun.push(text),
  react: async () => {},
}, { sendMessage: async () => {} });
assert.match(statusDuringLongRun[0], /queued|running/);
await longRun;
await taskCreated.done;
await new Promise((resolve) => setTimeout(resolve, 50));
assert.equal(getTaskStatus(longTaskId), null, "تنظف مهمة AI Studio بعد اكتمالها ضمن المهلة المحددة");

const quoteReplies = [];
const quoteHandled = await handleAiStudioRequest({
  body: "اشرح هذه الرسالة",
  sender: owner.sender,
  chat: owner.chat,
  isOwner: true,
  quoted: { text: "TypeError: Cannot read properties of undefined" },
  reply: async (text) => quoteReplies.push(text),
  react: async () => {},
}, { sendMessage: async () => {} }, {
  documentAnalyzer: async () => ({ text: "هذه رسالة خطأ برمجية تحتاج إلى فحص القيمة غير المعرفة." }),
});
assert.equal(quoteHandled, true);
assert.match(quoteReplies.at(-1), /فهم الرسالة المقتبسة/);
assert.match(quoteReplies.at(-1), /قيمة غير المعرفة/);
console.log("ai studio behavioral tests: passed");
