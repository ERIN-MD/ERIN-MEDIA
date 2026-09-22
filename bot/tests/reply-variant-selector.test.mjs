import assert from "node:assert/strict";
import { handler } from "../plugins/owner/تعيين_نوع_الرد.js";

for (let id = 1; id <= 13; id += 1) {
  const settings = new Map();
  const replies = [];
  const db = {
    setting(key, value) {
      if (arguments.length === 2) settings.set(key, value);
      return settings.get(key);
    },
    async save() {},
  };
  const m = {
    text: `V${id}`,
    async reply(text) {
      replies.push(text);
    },
  };

  await handler(m, { sock: {}, db });
  assert.equal(settings.get("replyVariant"), id);
  assert.match(replies[0], new RegExp(`V${id}`));
}

console.log("reply variant selector tests: passed");
