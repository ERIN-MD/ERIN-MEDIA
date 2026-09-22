import assert from "node:assert/strict";
import { handleLinkGuard } from "../src/lib/maro-link-guard.js";

const data = {};
const db = { getGroup: () => data, setGroup: (_chat, value) => Object.assign(data, value) };
const replies = [];
const message = (text = "") => ({ chat: "group@g.us", text, prefix: ".", command: "منع_كل_الروابط", reply: async (value) => replies.push(value) });
await handleLinkGuard(message("تشغيل"), db, { key: "antilinkall", title: "منع كل الروابط", detected: "الروابط" });
assert.equal(data.antilinkall, "on");
await handleLinkGuard(message("طريقة طرد"), db, { key: "antilinkall", title: "منع كل الروابط", detected: "الروابط" });
assert.equal(data.antilinkallMode, "kick");
await handleLinkGuard(message(""), db, { key: "antilinkall", title: "منع كل الروابط", detected: "الروابط" });
assert.match(replies.at(-1), /طرد العضو/);
console.log("link guard tests: passed");
