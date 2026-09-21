/**
 * maro-parity.mjs — Compare two inventory snapshots and fail on any regression.
 * Usage: node tools/maro-parity.mjs <before.json> <after.json> [--out reports/command-parity.json]
 * Exit 1 if a command/alias disappeared or a permission was downgraded.
 */
import fs from "fs";
import path from "path";

const [beforePath, afterPath] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const outIdx = process.argv.indexOf("--out");
const outPath = outIdx !== -1 ? process.argv[outIdx + 1] : "reports/command-parity.json";

const before = JSON.parse(fs.readFileSync(beforePath, "utf8"));
const after = JSON.parse(fs.readFileSync(afterPath, "utf8"));

const keys = (inv, field) => new Set(inv[field].map((e) => e.key));
const diff = (a, b) => [...a].filter((k) => !b.has(k)).sort();

const cmdBefore = keys(before, "commands");
const cmdAfter = keys(after, "commands");
const aliBefore = keys(before, "aliases");
const aliAfter = keys(after, "aliases");

const byFile = (inv) => Object.fromEntries(inv.plugins.map((p) => [p.file, p]));
const pb = byFile(before);
const pa = byFile(after);

const PERM = ["isOwner", "isPremium", "isPartner", "isAdmin", "isBotAdmin", "isGroup", "isPrivate"];
const permissionChanges = [];
const categoryChanges = [];
for (const [file, b] of Object.entries(pb)) {
  const a = pa[file];
  if (!a) continue;
  for (const flag of PERM) {
    if (b[flag] !== a[flag]) {
      permissionChanges.push({
        file, flag, before: b[flag], after: a[flag],
        // dropping a restriction widens access => a downgrade of protection
        severity: b[flag] === true && a[flag] === false ? "DOWNGRADE" : "tightened",
      });
    }
  }
  if (b.category !== a.category) categoryChanges.push({ file, before: b.category, after: a.category });
}

const report = {
  generatedAt: new Date().toISOString(),
  before: { file: beforePath, ...before.stats },
  after: { file: afterPath, ...after.stats },
  removedCommands: diff(cmdBefore, cmdAfter),
  addedCommands: diff(cmdAfter, cmdBefore),
  removedAliases: diff(aliBefore, aliAfter),
  addedAliases: diff(aliAfter, aliBefore),
  removedPluginFiles: Object.keys(pb).filter((f) => !pa[f]).sort(),
  addedPluginFiles: Object.keys(pa).filter((f) => !pb[f]).sort(),
  permissionChanges,
  categoryChanges,
};
report.verdict = {
  commandLoss: report.removedCommands.length,
  aliasLoss: report.removedAliases.length,
  pluginLoss: report.removedPluginFiles.length,
  permissionDowngrades: permissionChanges.filter((c) => c.severity === "DOWNGRADE").length,
};
const failed =
  report.verdict.commandLoss + report.verdict.aliasLoss +
  report.verdict.pluginLoss + report.verdict.permissionDowngrades;
report.status = failed === 0 ? "PASS" : "REGRESSION";

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

console.error(`PARITY ${report.status}`);
console.error(`  commands : ${before.stats.uniqueCommands} -> ${after.stats.uniqueCommands}  (removed ${report.removedCommands.length}, added ${report.addedCommands.length})`);
console.error(`  aliases  : ${before.stats.uniqueAliases} -> ${after.stats.uniqueAliases}  (removed ${report.removedAliases.length}, added ${report.addedAliases.length})`);
console.error(`  plugins  : ${before.stats.pluginsParsed} -> ${after.stats.pluginsParsed}  (removed ${report.removedPluginFiles.length}, added ${report.addedPluginFiles.length})`);
console.error(`  import failures : ${before.stats.importFailures} -> ${after.stats.importFailures}`);
console.error(`  permission downgrades : ${report.verdict.permissionDowngrades}`);
if (report.removedCommands.length) console.error(`  REMOVED COMMANDS: ${report.removedCommands.join(", ")}`);
if (report.removedAliases.length) console.error(`  REMOVED ALIASES : ${report.removedAliases.join(", ")}`);
if (report.addedCommands.length) console.error(`  added commands  : ${report.addedCommands.join(", ")}`);
console.error(`\nwritten -> ${outPath}`);
process.exit(failed === 0 ? 0 : 1);
