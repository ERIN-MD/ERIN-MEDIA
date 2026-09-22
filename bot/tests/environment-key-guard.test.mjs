import assert from "node:assert/strict";

delete process.env.SOUNDCLOUD_CLIENT_ID;
delete process.env.FIXCODE_API_KEY;

const { default: searchSoundCloud } = await import("../src/scraper/soundcloud.js");
const missingSoundCloudKey = await searchSoundCloud("test");
assert.equal(missingSoundCloudKey.success, false);
assert.match(missingSoundCloudKey.message, /SOUNDCLOUD_CLIENT_ID/);

const { handler } = await import("../plugins/ai/gpt55.js");
const replies = [];
await handler({ reply: async (text) => replies.push(text) }, { text: "اختبار", args: [], sock: {} });
assert.match(replies[0], /FIXCODE_API_KEY/);

console.log("environment key guard tests: passed");
