/**
 * run-tests.mjs — runs every tests/*.test.mjs (except live ones) and reports
 * an honest summary. A test that exits 0 without printing anything is treated
 * as SUSPECT, not as a pass: that is exactly how the old global
 * uncaughtException handler produced false green runs.
 */
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const LIVE = new Set(["ai-provider-smoke.test.mjs", "maro-code-review.live.test.mjs"]);
const dir = path.join(process.cwd(), "tests");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".test.mjs") && !LIVE.has(f)).sort();

const run = (file) =>
  new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(dir, file)], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), 200000);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("close", (code) => {
      clearTimeout(timer);
      const meaningful = out
        .split("\n")
        .filter((l) => l.trim() && !/^\[\s*(OK|INFO|WARN)/.test(l) && !/Emoji/.test(l));
      resolve({ file, code, out, lastLine: meaningful.at(-1) || "" });
    });
  });

const results = [];
for (const f of files) results.push(await run(f));

const passed = results.filter((r) => r.code === 0 && r.lastLine);
const suspect = results.filter((r) => r.code === 0 && !r.lastLine);
const failed = results.filter((r) => r.code !== 0);

for (const r of failed) {
  console.error(`FAIL(${r.code})  ${r.file}`);
  console.error(r.out.split("\n").filter((l) => /AssertionError|Error:|expected:|actual:/.test(l)).slice(0, 4).map((l) => "        " + l).join("\n"));
}
for (const r of suspect) console.error(`SUSPECT      ${r.file} — exited 0 but produced no output`);

console.error(`\ntests: ${passed.length} passed · ${failed.length} failed · ${suspect.length} suspect · ${results.length} total`);
process.exit(failed.length || suspect.length ? 1 : 0);
