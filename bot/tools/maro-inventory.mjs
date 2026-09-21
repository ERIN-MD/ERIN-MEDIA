/**
 * maro-inventory.mjs — Forensic inventory + command/alias parity snapshot.
 * Usage: node tools/maro-inventory.mjs [--out reports/command-inventory.json]
 * Emits a deterministic snapshot of every plugin, command, alias and permission
 * so that before/after parity can be proven mechanically.
 */
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const ROOT = process.cwd();
const PLUGIN_ROOT = path.join(ROOT, "plugins");

function walk(dir, filter, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // mirror the loader: it ignores nested dirs and _-prefixed entries
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      if (entry.name.startsWith("_")) continue;
      walk(full, filter, out);
    } else if (filter(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const norm = (value) => String(value ?? "").trim().toLowerCase();
const asArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);

export async function buildInventory() {
  const pluginFiles = walk(PLUGIN_ROOT, (n) => n.endsWith(".js")).sort();
  const plugins = [];
  const importFailures = [];

  for (const file of pluginFiles) {
    const rel = path.relative(ROOT, file).split(path.sep).join("/");
    let mod;
    try {
      mod = await import(pathToFileURL(file).href);
    } catch (error) {
      importFailures.push({ file: rel, reason: error.message.split("\n")[0] });
      continue;
    }
    const cfg = mod.config || mod.default?.config;
    const handler = mod.handler || mod.default?.handler || mod.default;
    if (!cfg) {
      importFailures.push({ file: rel, reason: "no exported config" });
      continue;
    }
    const names = asArray(cfg.name).map(norm).filter(Boolean);
    const aliases = asArray(cfg.alias).map(norm).filter(Boolean);
    plugins.push({
      file: rel,
      names,
      aliases,
      category: norm(cfg.category) || "uncategorized",
      description: String(cfg.description ?? ""),
      usage: String(cfg.usage ?? ""),
      example: String(cfg.example ?? ""),
      isOwner: !!cfg.isOwner,
      isPremium: !!cfg.isPremium,
      isPartner: !!cfg.isPartner,
      isAdmin: !!cfg.isAdmin,
      isBotAdmin: !!cfg.isBotAdmin,
      isGroup: !!cfg.isGroup,
      isPrivate: !!cfg.isPrivate,
      isEnabled: cfg.isEnabled !== false,
      cooldown: Number(cfg.cooldown ?? 3),
      limit: Number(cfg.limit ?? 1),
      hasHandler: typeof handler === "function",
      ui: cfg.ui ? { ...cfg.ui } : null,
    });
  }

  // ---- registries + collision detection -------------------------------
  const commandOwners = new Map();
  const aliasOwners = new Map();
  const selfDuplicates = [];
  for (const p of plugins) {
    const all = [...p.names, ...p.aliases];
    if (new Set(all).size !== all.length) selfDuplicates.push(p.file);
    for (const n of new Set(p.names)) {
      if (!commandOwners.has(n)) commandOwners.set(n, []);
      commandOwners.get(n).push(p.file);
    }
    for (const a of new Set(p.aliases)) {
      if (!aliasOwners.has(a)) aliasOwners.set(a, []);
      aliasOwners.get(a).push(p.file);
    }
  }
  const collisions = { command: [], alias: [], aliasShadowsCommand: [] };
  for (const [key, files] of commandOwners) if (files.length > 1) collisions.command.push({ key, files });
  for (const [key, files] of aliasOwners) if (files.length > 1) collisions.alias.push({ key, files });
  for (const [key, files] of aliasOwners) {
    if (commandOwners.has(key)) {
      const cmdFiles = commandOwners.get(key);
      const foreign = files.filter((f) => !cmdFiles.includes(f));
      if (foreign.length) collisions.aliasShadowsCommand.push({ key, command: cmdFiles, alias: foreign });
    }
  }

  const categories = {};
  for (const p of plugins) categories[p.category] = (categories[p.category] || 0) + 1;

  const count = (pred) => plugins.filter(pred).length;
  const stats = {
    pluginFiles: pluginFiles.length,
    pluginsParsed: plugins.length,
    importFailures: importFailures.length,
    uniqueCommands: commandOwners.size,
    uniqueAliases: aliasOwners.size,
    categories: Object.keys(categories).length,
    ownerCommands: count((p) => p.isOwner),
    premiumCommands: count((p) => p.isPremium),
    partnerCommands: count((p) => p.isPartner),
    adminCommands: count((p) => p.isAdmin),
    botAdminCommands: count((p) => p.isBotAdmin),
    groupOnlyCommands: count((p) => p.isGroup),
    privateOnlyCommands: count((p) => p.isPrivate),
    disabledCommands: count((p) => !p.isEnabled),
    withoutHandler: count((p) => !p.hasHandler),
    aiCommands: count((p) => p.category === "ai"),
    collisionCommandKeys: collisions.command.length,
    collisionAliasKeys: collisions.alias.length,
    selfDuplicateConfigs: selfDuplicates.length,
  };

  return {
    generatedAt: new Date().toISOString(),
    stats,
    categories,
    collisions,
    selfDuplicates,
    importFailures,
    commands: [...commandOwners.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => ({ key: k, files: v })),
    aliases: [...aliasOwners.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => ({ key: k, files: v })),
    plugins: plugins.sort((a, b) => a.file.localeCompare(b.file)),
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const outIdx = process.argv.indexOf("--out");
  const out = outIdx !== -1 ? process.argv[outIdx + 1] : "reports/command-inventory.json";
  const inv = await buildInventory();
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(inv, null, 2));
  console.error(JSON.stringify(inv.stats, null, 2));
  console.error(`\nwritten -> ${out}`);
  process.exit(0);
}
