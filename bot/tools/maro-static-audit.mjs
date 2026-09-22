import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.argv[2] || process.cwd());
const sourceRoots = ["src", "plugins"];
const extensions = ["", ".js", ".mjs", ".cjs", ".json"];
const ignored = new Set(["node_modules", ".git", "session", "database", "backup"]);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (/\.(?:js|mjs|cjs)$/i.test(entry.name)) files.push(full);
  }
  return files;
}

async function pathExists(candidate) {
  return fs.access(candidate).then(() => true).catch(() => false);
}

async function resolveRelative(from, specifier) {
  const base = path.resolve(path.dirname(from), specifier);
  for (const extension of extensions) {
    if (await pathExists(`${base}${extension}`)) return true;
  }
  for (const extension of extensions.slice(1)) {
    if (await pathExists(path.join(base, `index${extension}`))) return true;
  }
  return false;
}

const files = (await Promise.all(sourceRoots.map((dir) => walk(path.join(root, dir))))).flat();
for (const rootFile of ["config.js", "index.js"]) {
  const full = path.join(root, rootFile);
  if (await pathExists(full)) files.push(full);
}

const missingImports = [];
for (const file of files) {
  const text = await fs.readFile(file, "utf8").catch(() => "");
  const pattern = /(?:import|export)\s+(?:[^'"()]*?\s+from\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;
  for (const match of text.matchAll(pattern)) {
    const specifier = match[1] || match[2];
    if (!specifier?.startsWith(".")) continue;
    if (!await resolveRelative(file, specifier)) {
      missingImports.push({ file: path.relative(root, file), specifier });
    }
  }
}

const configText = await fs.readFile(path.join(root, "config.js"), "utf8").catch(() => "");
const missingAssets = [];
for (const match of configText.matchAll(/["'](\.\/assets\/[^"']+)["']/g)) {
  const asset = match[1];
  if (!await pathExists(path.resolve(root, asset))) missingAssets.push(asset);
}

console.log(JSON.stringify({ scannedFiles: files.length, missingImports, missingAssets: [...new Set(missingAssets)] }, null, 2));
