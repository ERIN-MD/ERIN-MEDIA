import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { diagnosePluginError, recordPluginLoadFailure, formatPluginDiagnostics, repairLegacyImports } from "../src/lib/maro-plugin-diagnostics.js";

const item = diagnosePluginError("plugins/test.js", new Error("Cannot find module '../lib/ourin-database.js'"));
assert.match(item.cause, /غير موجود/);
assert.match(item.suggestion, /maro/);
recordPluginLoadFailure("plugins/test.js", new Error("Cannot find module '../lib/ourin-database.js'"));
assert.match(formatPluginDiagnostics(), /أخطاء البلوقنات/);

const root = await fs.mkdtemp(path.join(os.tmpdir(), "marobot-plugin-diagnostics-"));
await fs.mkdir(path.join(root, "plugins"), { recursive: true });
await fs.mkdir(path.join(root, "lib"), { recursive: true });
await fs.writeFile(path.join(root, "plugins", "repair-test.js"), "import db from '../lib/ourin-database.js';\nconsole.log(db);\n");
await fs.writeFile(path.join(root, "lib", "maro-database.js"), "export default {};\n");
recordPluginLoadFailure("plugins/repair-test.js", new Error("Cannot find module '../lib/ourin-database.js'"));
const repairs = await repairLegacyImports({ root });
const repair = repairs.find((item) => item.file === "plugins/repair-test.js");
assert.equal(repair?.syntaxChecked, true);
assert.match(await fs.readFile(path.join(root, "plugins", "repair-test.js"), "utf8"), /maro-database/);
await fs.access(path.join(root, repair.backup));
await fs.rm(root, { recursive: true, force: true });
console.log("plugin diagnostics tests: passed");
