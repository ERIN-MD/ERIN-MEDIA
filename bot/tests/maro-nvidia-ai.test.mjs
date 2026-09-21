import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { getNvidiaKeys } from "../src/lib/maro-nvidia-ai.js";

assert.deepEqual(getNvidiaKeys("key-a, key-b;key-c"), ["key-a", "key-b", "key-c"]);
assert.deepEqual(getNvidiaKeys(""), []);

for (const file of ["ديب_برو4.js", "زد_اي.js", "نيمو_نانو.js", "نيموترون.js"]) {
  const source = await fs.readFile(new URL(`../plugins/ai/${file}`, import.meta.url), "utf8");
  assert.equal(source.includes("nvapi-"), false, `${file} must not embed an NVIDIA key`);
  assert.match(source, /askNvidia/);
}

console.log("maro-nvidia-ai test: OK");
