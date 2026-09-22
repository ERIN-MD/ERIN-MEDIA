/**
 * maro-reports.mjs — generates the machine-readable audit reports from live
 * data (never from hard-coded numbers).
 */
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { pathToFileURL } from "url";

const execFileAsync = promisify(execFile);
const ROOT = process.cwd();
const OUT = path.join(ROOT, "reports");
fs.mkdirSync(OUT, { recursive: true });
const write = (name, data) => {
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(data, null, 2));
  console.error(`  wrote reports/${name}`);
};

// ── plugin inventory + collisions (from the live loader) ───────────────
const { initDatabase } = await import("../src/lib/maro-database.js");
await initDatabase("./database/main");
const { loadPlugins, pluginStore, getPluginDiagnostics } =
  await import("../src/lib/maro-plugins.js");
const loaded = await loadPlugins(path.join(ROOT, "plugins"));
const diag = getPluginDiagnostics();

const byCategory = {};
for (const [cat, list] of pluginStore.categories) byCategory[cat] = list.length;

write("plugin-inventory.json", {
  generatedAt: new Date().toISOString(),
  loadedPlugins: loaded,
  uniquePluginObjects: new Set(pluginStore.commands.values()).size,
  registeredCommandKeys: pluginStore.commands.size,
  registeredAliasKeys: pluginStore.aliases.size,
  categories: Object.keys(byCategory).length,
  byCategory,
  failures: diag.failures,
  invalid: diag.invalid,
});

const grouped = {};
for (const c of diag.collisions) (grouped[c.type] ??= []).push(c);
write("plugin-collisions.json", {
  generatedAt: new Date().toISOString(),
  note:
    "Map.set overwrote duplicates silently before this change; the loader now records every collision. " +
    "Resolution is last-loaded-wins, and load order follows the filesystem, so these should be resolved by renaming.",
  total: diag.collisions.length,
  distinctKeys: new Set(diag.collisions.map((c) => c.key)).size,
  byType: Object.fromEntries(Object.entries(grouped).map(([k, v]) => [k, v.length])),
  collisions: diag.collisions,
});

// ── import health across every source tree ─────────────────────────────
const SKIP = new Set(["node_modules", ".git", "reports", "temp", "tmp", "downloads", "storage", "session", "_legacy"]);
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(m)?js$/.test(e.name)) out.push(p);
  }
  return out;
}
const sources = [
  ...walk(path.join(ROOT, "src")),
  ...walk(path.join(ROOT, "plugins")),
  ...walk(path.join(ROOT, "case")),
];
const importFailures = [];
let importOk = 0;
for (const f of sources) {
  try { await import(pathToFileURL(f).href); importOk += 1; }
  catch (e) { importFailures.push({ file: path.relative(ROOT, f), reason: e.message.split("\n")[0].slice(0, 200) }); }
}
write("import-health.json", {
  generatedAt: new Date().toISOString(),
  scanned: sources.length,
  imported: importOk,
  failed: importFailures.length,
  failures: importFailures,
});

// ── dependency audit ───────────────────────────────────────────────────
let audit = { error: "npm audit unavailable" };
try {
  const { stdout } = await execFileAsync("npm", ["audit", "--json"], { cwd: ROOT, maxBuffer: 40_000_000 });
  audit = JSON.parse(stdout);
} catch (e) {
  try { audit = JSON.parse(e.stdout || "{}"); } catch { /* keep the error marker */ }
}
const vulns = audit.vulnerabilities || {};
write("dependency-audit.json", {
  generatedAt: new Date().toISOString(),
  metadata: audit.metadata || null,
  bySeverity: audit.metadata?.vulnerabilities || null,
  advisories: Object.entries(vulns).map(([name, v]) => ({
    name,
    severity: v.severity,
    via: (v.via || []).map((x) => (typeof x === "string" ? x : x.title)).slice(0, 4),
    fixAvailable: v.fixAvailable === true || (v.fixAvailable && typeof v.fixAvailable === "object") || false,
  })),
});

console.error("\nreports generated.");
process.exit(0);
