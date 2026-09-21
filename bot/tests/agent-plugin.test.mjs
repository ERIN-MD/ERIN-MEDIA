import assert from "node:assert/strict";
import { handler } from "../plugins/owner/وكيل.js";

async function invoke(text) {
  const replies = [];
  await handler({
    text,
    prefix: ".",
    sender: "201142324733@s.whatsapp.net",
    isOwner: true,
    reply: async (value) => replies.push(String(value)),
  });
  return replies.at(-1) || "";
}

assert.match(await invoke("قدرات"), /قدرات الوكيل/);
assert.match(await invoke("موافقات"), /الموافقات المعلقة/);
assert.match(await invoke("تدقيق"), /سجل تدقيق الوكيل/);
assert.match(await invoke("صحة"), /صحة الوكيل/);
console.log("agent plugin command tests: passed");
