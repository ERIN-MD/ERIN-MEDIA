/**
 * check-syntax.mjs — node --check across EVERY source file, not just entrypoints.
 * Exit 1 on the first syntax error found (reports all of them first).
 */
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const SKIP = new Set(["node_modules", ".git", "reports", "temp", "tmp", "downloads", "storage", "session"]);
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(m|c)?js$/.test(e.name)) files.push(p);
  }
})(process.cwd());

const failures = [];
const CONCURRENCY = 16;
let cursor = 0;
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (cursor < files.length) {
      const f = files[cursor++];
      try {
        await execFileAsync(process.execPath, ["--check", f], { timeout: 20000 });
      } catch (error) {
        failures.push({ file: path.relative(process.cwd(), f), error: (error.stderr || error.message).split("\n")[0] });
      }
    }
  }),
);

for (const f of failures) console.error(`SYNTAX FAIL  ${f.file}\n             ${f.error}`);
console.error(`syntax: checked ${files.length} files, ${failures.length} failed`);
process.exit(failures.length ? 1 : 0);
