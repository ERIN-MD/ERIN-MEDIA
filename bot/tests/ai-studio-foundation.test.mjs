import assert from "node:assert/strict";
import { getAiStudioCapabilities } from "../src/lib/maro-ai-capabilities.js";
import { readTextAttachment, looksLikePlugin } from "../src/lib/maro-file-intelligence.js";

const capabilities = getAiStudioCapabilities();
assert.ok(capabilities.some((item) => item.id === "file_analysis"));
const attachment = readTextAttachment(Buffer.from('export const pluginConfig = {};\nexport function handler() {}'), { fileName: "test-plugin.js", mimetype: "application/javascript" });
assert.equal(attachment.fileName, "test-plugin.js");
assert.equal(looksLikePlugin(attachment), true);
assert.throws(() => readTextAttachment(Buffer.from([0, 1, 2]), { fileName: "photo.png", mimetype: "image/png" }), /غير مدعوم/);
console.log("ai studio foundation tests: passed");
