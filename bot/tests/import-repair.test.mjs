import assert from "node:assert/strict";

const modules = [
  "../plugins/ai/gpt55.js",
  "../plugins/ai/شخصية.js",
  "../plugins/owner/شكل_مسج.js",
  "../plugins/tts/ايلون.js",
  "../plugins/tts/تكلم.js",
  "../plugins/search/ساوند_تحميل.js",
  "../plugins/clan/أعضاء_العشيرة.js",
  "../plugins/clan/إنشاء_عشيرة.js",
  "../plugins/clan/انضمام_عشيرة.js",
  "../plugins/clan/حرب_عشائر.js",
  "../plugins/clan/دعوة_عشيرة.js",
  "../plugins/clan/طرد_عشيرة.js",
  "../plugins/clan/لوحة_العشائر.js",
  "../plugins/clan/معلومات_العشيرة.js",
  "../plugins/clan/مغادرة_عشيرة.js",
];

for (const file of modules) {
  const module = await import(file);
  assert.equal(typeof module.handler, "function", `${file} يجب أن يصدّر handler`);
  assert.ok(module.config, `${file} يجب أن يصدّر config`);
}

console.log("import repair tests: passed");
