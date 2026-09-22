import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { initDatabase } from "../src/lib/maro-database.js";

// TEST BUG FIXED: checkPermission() reads the database, so the suite must
// initialise it first. Without this the test threw immediately — and the old
// global uncaughtException handler swallowed the throw, so it reported a
// false PASS while asserting nothing at all.
await initDatabase(path.join(await fs.mkdtemp(path.join(os.tmpdir(), "marobot-owner-bypass-")), "main"));

const { checkPermission } = await import("../src/lib/maro-middleware.js");

const result = checkPermission({ sender: "201142324733@s.whatsapp.net", command: "اختبار", isOwner: true, isGroup: false, isAdmin: false, isBotAdmin: false, isPremium: false, isPartner: false }, {
  isOwner: false, isPremium: true, isGroup: true, isPrivate: true, isAdmin: true, isBotAdmin: true, category: "game",
});
assert.equal(result.allowed, true);
const ownerInGroup = checkPermission({ sender: "201142324733@s.whatsapp.net", command: "اختبار", isOwner: true, isGroup: true, isAdmin: false, isBotAdmin: false, isPremium: false, isPartner: false }, {
  isOwner: false, isPremium: true, isGroup: false, isPrivate: true, isAdmin: true, isBotAdmin: true, category: "owner",
});
assert.equal(ownerInGroup.allowed, true);
const handlerSource = await fs.readFile(new URL("../src/handler.js", import.meta.url), "utf8");
const autoAiCommandSource = await fs.readFile(new URL("../plugins/group/autoai.js", import.meta.url), "utf8");
assert.match(handlerSource, /checkSpam && handleSpamAction && !m\.isAdmin && !m\.isOwner/);
assert.match(autoAiCommandSource, /if \(!m\.isGroup && !m\.isOwner\)/);
console.log("owner bypass tests: passed");
