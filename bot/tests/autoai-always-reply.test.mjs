import assert from "node:assert/strict";
import fs from "node:fs/promises";

const handler = await fs.readFile(new URL("../src/lib/maro-auto-ai.js", import.meta.url), "utf8");
const command = await fs.readFile(new URL("../plugins/group/autoai.js", import.meta.url), "utf8");
assert.match(handler, /autoai\.alwaysReply === false/);
assert.match(handler, /alwaysReply: globalCfg\.alwaysReply !== false/);
assert.match(command, /function createAutoAIConfig/);
// CONTRACT UPDATED — INTENTIONAL.
// `alwaysReply` is no longer a hard-coded literal: it is now DERIVED from the
// richer `replyMode` setting ("all" | "mention"), which is the current source
// of truth. Assert that derivation instead of the old literal.
assert.match(command, /alwaysReply: normalizedReplyMode === "all"/);
assert.match(command, /function normalizeReplyMode/);
assert.match(command, /alwaysReply === false \? "mention" : "all"/);
assert.match(command, /createAutoAIConfig\(/);
assert.match(command, /"حالة Auto AI"/, "the status panel keeps its title");
// CONTRACT UPDATED — INTENTIONAL.
// The status text moved from an alwaysReply-centric wording ("alwaysReply معطّل")
// to the richer replyMode labels, and the panel now renders through the AXION
// design system. Assert the CURRENT source of truth.
assert.match(command, /modeLabel/, "status must surface the reply-mode label");
assert.match(command, /عند منشن البوت أو الرد عليه فقط/);
assert.match(command, /كل الرسائل ضمن النطاق/);
assert.match(command, /ui\.card\(/, "status must render through the design system");
console.log("auto ai always reply tests: passed");
