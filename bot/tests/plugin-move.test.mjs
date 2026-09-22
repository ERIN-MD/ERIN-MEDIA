import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createPluginMovePlan, executePluginMovePlan, parseMoveRequest, rollbackPluginMove, testPluginFile } from "../src/lib/maro-plugin-move.js";

const root = await fs.mkdtemp(path.join(os.tmpdir(), "marobot-plugin-move-"));
await fs.mkdir(path.join(root, "plugins", "owner"), { recursive: true });
await fs.mkdir(path.join(root, "plugins", "main"), { recursive: true });
await fs.writeFile(path.join(root, "config.js"), "export default {};\n", "utf8");
const sourcePath = path.join(root, "plugins", "owner", "تست.js");
await fs.writeFile(sourcePath, `import config from "../../config.js";
const pluginConfig = {
  name: "تست",
  category: "owner",
  isOwner: true,
};
async function handler() { return config; }
export { pluginConfig as config, handler };
`, "utf8");

assert.equal(parseMoveRequest("انقل بلوقن تست من owner إلى main واجعله عاماً").targetCategory, "main");
const plan = await createPluginMovePlan("انقل بلوقن تست من owner إلى main واجعله عاماً", { root });
assert.equal(plan.source, "plugins/owner/تست.js");
assert.equal(plan.destination, "plugins/main/تست.js");
assert.match(plan.transformedSource, /category: "main"/);
assert.match(plan.transformedSource, /isOwner: false/);
assert.equal(await fs.access(sourcePath).then(() => true), true, "لا ينقل التحليل الملف قبل التأكيد");
const testBeforeMove = await testPluginFile("تست", { root });
assert.equal(testBeforeMove.file, "plugins/owner/تست.js");

const result = await executePluginMovePlan(plan, { root });
const destinationPath = path.join(root, "plugins", "main", "تست.js");
assert.equal(await fs.access(sourcePath).then(() => true).catch(() => false), false);
assert.equal(await fs.access(destinationPath).then(() => true), true);
assert.equal(await fs.access(path.join(root, result.backup)).then(() => true), true);
const moved = await fs.readFile(destinationPath, "utf8");
assert.match(moved, /category: "main"/);
assert.match(moved, /isOwner: false/);

const rollback = await rollbackPluginMove(result, { root });
assert.equal(rollback.source, "plugins/owner/تست.js");
assert.equal(await fs.access(sourcePath).then(() => true), true);
assert.equal(await fs.access(destinationPath).then(() => true).catch(() => false), false);

await fs.rm(root, { recursive: true, force: true });
console.log("plugin move tests: passed");
