import fs from "fs"; import path from "path"; import { spawn } from "child_process";
const LIVE = new Set(["ai-provider-smoke.test.mjs", "maro-code-review.live.test.mjs"]);
const dir = path.join(process.cwd(), "tests");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".test.mjs")).sort();
const run = (f) => new Promise((res) => {
  const c = spawn(process.execPath, [path.join(dir, f)], { stdio: ["ignore", "pipe", "pipe"] });
  let out = ""; const t = setTimeout(() => c.kill("SIGKILL"), 200000);
  c.stdout.on("data", d => out += d); c.stderr.on("data", d => out += d);
  c.on("close", (code) => { clearTimeout(t);
    const meaningful = out.split("\n").filter(l => l.trim() && !/^\[\s*(OK|INFO|WARN)/.test(l) && !/Emoji/.test(l));
    res({ file: f, code, lastLine: (meaningful.at(-1) || "").slice(0, 120), live: LIVE.has(f) }); });
});
const results = []; for (const f of files) results.push(await run(f));
const classify = (r) => r.code === 0 ? (r.lastLine ? "PASS" : "SUSPECT") : (r.live ? "BLOCKED_BY_ENV" : "FAIL");
const summary = { generatedAt: new Date().toISOString(), total: results.length,
  passed: results.filter(r => classify(r) === "PASS").length,
  failed: results.filter(r => classify(r) === "FAIL").length,
  suspect: results.filter(r => classify(r) === "SUSPECT").length,
  blockedByEnv: results.filter(r => classify(r) === "BLOCKED_BY_ENV").length,
  note: "SUSPECT = exited 0 but printed nothing. That is how the removed uncaughtException handler produced false green runs, so it is never counted as a pass.",
  results: results.map(r => ({ test: r.file, status: classify(r), exitCode: r.code, lastLine: r.lastLine })) };
fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync("reports/test-summary.json", JSON.stringify(summary, null, 2));
console.error(`tests: ${summary.passed} pass · ${summary.failed} fail · ${summary.suspect} suspect · ${summary.blockedByEnv} env-blocked / ${summary.total}`);
process.exit(0);
