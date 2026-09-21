import assert from "node:assert/strict";
import { bratImage, splitLines } from "../src/lib/maro-brat.js";

// TEST BUG FIXED: "Tarboo Bot sticker" is 18 characters, so with maxLength 17
// it MUST wrap. The old expectation was arithmetically impossible; the
// implementation was right. Assert the real wrapping contract instead.
assert.equal("Tarboo Bot sticker".length, 18);
assert.deepEqual(splitLines("Tarboo Bot sticker", 17), ["Tarboo Bot", "sticker"]);
assert.deepEqual(splitLines("Tarboo Bot sticker", 18), ["Tarboo Bot sticker"]);
assert.deepEqual(splitLines("", 17), ["brat"], "empty input falls back");
assert.equal(splitLines("a b c d e f g h i j", 1).length <= 5, true, "maxLines is respected");
const svg = bratImage('<script>alert("x")</script>', "green").toString("utf8");
assert.match(svg, /&lt;script&gt;/);
assert.doesNotMatch(svg, /<script>/);
assert.match(svg, /#b7ff00/);
console.log("local brat image tests: passed");
