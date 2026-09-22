import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { characters, handler as autoAiCommandHandler } from "../plugins/group/autoai.js";
import { initDatabase } from "../src/lib/maro-database.js";

const dbRoot = await fs.mkdtemp(path.join(os.tmpdir(), "marobot-autoai-personas-"));
const db = await initDatabase(path.join(dbRoot, "main"));
const chat = "arabic-persona-test@g.us";

assert.ok(characters["مريم"], "يجب دمج شخصية مريم العربية");
assert.ok(characters["سلمى"], "يجب إضافة شخصية سلمى التعليمية");
assert.ok(characters["فارس"], "يجب إضافة شخصية فارس التقنية");
assert.ok(characters["فلفل"], "يجب إضافة الشخصية المصرية الفكاهية");
assert.ok(characters["رزان"], "يجب إضافة الشخصية الحكيمة الجديدة");
assert.equal(characters.furina, undefined, "لا ينبغي إبقاء الشخصيات غير العربية المدمجة");
assert.equal(characters.zeta, undefined, "لا ينبغي إبقاء الشخصيات غير العربية المدمجة");
// TEST BUG FIXED: the guardrail IS present but its wording was edited from
// "نتائج" to "نتيجة". Assert the intent (no fabricated run/test results)
// rather than one exact phrasing, so wording edits do not fake a failure.
assert.match(characters["مريم"].instruction, /لا تختلقي\s+نتيج(ة|ـة)|لا تختلقي\s+نتائج/);
assert.match(characters["مريم"].instruction, /نسخة احتياطية/);
assert.match(characters["مريم"].instruction, /JavaScript/);
assert.match(characters["ليلى"].instruction, /لا تذكري القهوة أو الشعر أو الموسيقى تلقائياً/);
assert.match(characters["فارس"].instruction, /لا تشخّصي أي خطأ من دون دليل/);
assert.match(characters["فلفل"].instruction, /لا تكرر الإفيهات أو الضحك في كل رسالة/);
assert.match(characters["رزان"].instruction, /لا تلقي مواعظ/);

const replies = [];
await autoAiCommandHandler({
  isGroup: true,
  isOwner: true,
  isAdmin: false,
  chat,
  sender: "201142324733@s.whatsapp.net",
  prefix: ".",
  args: ["on"],
  fullArgs: "on --شخصية=مريم --نوع=نص --وضع=مساعد",
  text: "on --شخصية=مريم --نوع=نص --وضع=مساعد",
  body: ".autoai on --شخصية=مريم --نوع=نص --وضع=مساعد",
  reply: async (text) => replies.push(text),
  react: async () => {},
});

const local = db.db.data.autoai[chat];
assert.equal(local.enabled, true);
assert.equal(local.alwaysReply, true, "التفعيل المحلي يجب أن يضبط الرد التلقائي صراحةً");
assert.equal(local.character, "مريم");
assert.equal(local.characterName, characters["مريم"].name);
assert.equal(local.lastError, "", "التفعيل الجديد يجب أن يمسح الخطأ السابق");
assert.match(replies.at(-1), /تم تفعيل Auto AI/);

await autoAiCommandHandler({
  isGroup: false,
  isOwner: true,
  isAdmin: false,
  chat,
  sender: "201142324733@s.whatsapp.net",
  prefix: ".",
  args: ["عالمي", "تشغيل"],
  fullArgs: "عالمي تشغيل --شخصية=فارس --نوع=نص",
  text: "عالمي تشغيل --شخصية=فارس --نوع=نص",
  body: ".autoai عالمي تشغيل --شخصية=فارس --نوع=نص",
  reply: async (text) => replies.push(text),
  react: async () => {},
});

const global = db.db.data.autoai_global;
assert.equal(global.enabled, true);
assert.equal(global.alwaysReply, true, "التفعيل العام يجب أن يضبط الرد التلقائي صراحةً");
assert.equal(global.character, "فارس");
assert.equal(global.lastError, "", "التفعيل العام يجب أن يمسح الخطأ السابق");

await autoAiCommandHandler({
  isGroup: true,
  isOwner: true,
  isAdmin: false,
  chat,
  sender: "201142324733@s.whatsapp.net",
  prefix: ".",
  args: ["افتراضي", "سلمى"],
  fullArgs: "افتراضي سلمى --نوع=نص --وضع=مساعد",
  text: "افتراضي سلمى --نوع=نص --وضع=مساعد",
  body: ".autoai افتراضي سلمى --نوع=نص --وضع=مساعد",
  reply: async (text) => replies.push(text),
  react: async () => {},
});
assert.equal(db.db.data.autoai_defaults[chat].character, "سلمى");

await autoAiCommandHandler({
  isGroup: true,
  isOwner: true,
  isAdmin: false,
  chat,
  sender: "201142324733@s.whatsapp.net",
  prefix: ".",
  args: ["off"],
  fullArgs: "off",
  text: "off",
  body: ".autoai off",
  reply: async (text) => replies.push(text),
  react: async () => {},
});
await autoAiCommandHandler({
  isGroup: true,
  isOwner: true,
  isAdmin: false,
  chat,
  sender: "201142324733@s.whatsapp.net",
  prefix: ".",
  args: ["on"],
  fullArgs: "on",
  text: "on",
  body: ".autoai on",
  reply: async (text) => replies.push(text),
  react: async () => {},
});
assert.equal(db.db.data.autoai[chat].character, "سلمى", "يجب استخدام الشخصية الافتراضية عند التفعيل دون خيار شخصية");
assert.equal(db.db.data.autoai[chat].alwaysReply, true);

await autoAiCommandHandler({
  isGroup: true,
  isOwner: true,
  isAdmin: false,
  chat,
  sender: "201142324733@s.whatsapp.net",
  prefix: ".",
  args: ["شخصية", "ليلى"],
  fullArgs: "شخصية ليلى",
  text: "شخصية ليلى",
  body: ".autoai شخصية ليلى",
  reply: async (text) => replies.push(text),
  react: async () => {},
});
assert.equal(db.db.data.autoai[chat].character, "ليلى", "يجب تبديل الشخصية دون إيقاف AutoAI");
assert.equal(db.db.data.autoai[chat].alwaysReply, true);
assert.match(replies.at(-1), /تم تبديل شخصية AutoAI/);

for (const character of ["فلفل", "رزان"]) {
  await autoAiCommandHandler({
    isGroup: true,
    isOwner: true,
    isAdmin: false,
    chat,
    sender: "201142324733@s.whatsapp.net",
    prefix: ".",
    args: ["شخصية", character],
    fullArgs: `شخصية ${character}`,
    text: `شخصية ${character}`,
    body: `.autoai شخصية ${character}`,
    reply: async (text) => replies.push(text),
    react: async () => {},
  });
  assert.equal(db.db.data.autoai[chat].character, character);
  assert.equal(db.db.data.autoai[chat].alwaysReply, true);
}

await fs.rm(dbRoot, { recursive: true, force: true });
console.log("autoai arabic personas tests: passed");
