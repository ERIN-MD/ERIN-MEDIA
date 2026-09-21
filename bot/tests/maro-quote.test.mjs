import assert from "node:assert/strict";
import { quoteImage, isDark } from "../src/lib/maro-quote.js";

assert.equal(isDark("#000000"), true);
assert.equal(isDark("#ffffff"), false);
const svg = quoteImage({ name: "<مالك>", text: "نص <آمن>", color: "#ffffff" }).toString("utf8");
assert.match(svg, /&lt;مالك&gt;/);
assert.match(svg, /#111827/);
console.log("local quote image tests: passed");
