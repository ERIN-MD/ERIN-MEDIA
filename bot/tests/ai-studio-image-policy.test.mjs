import assert from "node:assert/strict";
import fs from "node:fs/promises";

const studio = await fs.readFile(new URL("../src/lib/maro-ai-studio.js", import.meta.url), "utf8");
const limits = await fs.readFile(new URL("../AI_STUDIO_IMAGE_LIMITS.md", import.meta.url), "utf8");
assert.match(studio, /pendingImageGenerations/);
assert.match(studio, /وافق على الصورة/);
assert.match(studio, /حسن هذه الصورة/);
assert.match(limits, /موافقة المالك/);
console.log("ai studio image policy tests: passed");
