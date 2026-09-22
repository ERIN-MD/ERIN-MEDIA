import fs from "fs";
import path from "path";
import crypto from "crypto";
import { loadProjectManifest, saveProjectManifest, isBlocked } from "./maro-agent-registry.js";

const ROOT = process.cwd();
const SKIP_DIRS = new Set(["node_modules", ".git", "database", "storage", "auth_info", "sessions", "temp", "data"]);
const ALLOWED_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".json", ".md", ".test"]);
const MAX_FILES = 5000;
const MAX_FILE_BYTES = 2 * 1024 * 1024;

function hashFile(filePath) {
  try {
    const hash = crypto.createHash("sha256");
    hash.update(fs.readFileSync(filePath));
    return hash.digest("hex").slice(0, 16);
  } catch {
    return null;
  }
}

function listFiles(directory, results = []) {
  if (results.length >= MAX_FILES) return results;
  let entries = [];
  try { entries = fs.readdirSync(directory, { withFileTypes: true }); } catch { return results; }

  for (const entry of entries) {
    if (results.length >= MAX_FILES) break;
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(ROOT, absolute).replace(/\\/g, "/");
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name) && !isBlocked(relative)) listFiles(absolute, results);
      continue;
    }
    const extension = path.extname(entry.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension) && !entry.name.endsWith(".test.mjs")) continue;
    try {
      const stat = fs.statSync(absolute);
      if (stat.size <= MAX_FILE_BYTES && !isBlocked(relative)) {
        results.push({ path: relative, size: stat.size, hash: hashFile(absolute), extension });
      }
    } catch { }
  }
  return results;
}

function extractExports(content = "") {
  const exports = [];
  const imports = [];
  const functions = [];
  const classes = [];

  for (const match of content.matchAll(/(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g)) functions.push(match[1]);
  for (const match of content.matchAll(/class\s+([A-Za-z_$][\w$]*)/g)) classes.push(match[1]);
  for (const match of content.matchAll(/export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) exports.push(match[1]);
  for (const match of content.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (const item of match[1].split(",")) {
      const name = item.trim().split(/\s+as\s+/i)[0];
      if (name) exports.push(name);
    }
  }
  for (const match of content.matchAll(/(?:import\s+.*?from\s*["']|require\s*\(\s*["'])([^"']+)["']/g)) imports.push(match[1]);

  return {
    exports: [...new Set(exports)],
    imports: [...new Set(imports)],
    functions: [...new Set(functions)].slice(0, 200),
    classes: [...new Set(classes)].slice(0, 100),
  };
}

function extractPluginInfo(filePath, content = "") {
  const block = content.match(/(?:const|let|var)\s+pluginConfig\s*=\s*\{([\s\S]*?)\n\};/);
  if (!block) return null;
  const body = block[1];
  const readString = (key) => body.match(new RegExp(`${key}\\s*:\\s*[\"']([^\"']+)`))?.[1] || null;
  const aliases = body.match(/alias\s*:\s*\[([^\]]*)\]/)?.[1]
    ?.match(/[\"']([^\"']+)[\"']/g)
    ?.map((value) => value.replace(/[\"']/g, "")) || [];
  const name = readString("name");
  if (!name) return null;
  return {
    file: filePath,
    name,
    aliases,
    category: readString("category"),
    description: readString("description"),
    usage: readString("usage"),
  };
}

function inferCapabilities(filePath, content = "") {
  const capabilities = [];
  const lower = `${filePath}\n${content}`.toLowerCase();
  if (lower.includes("sendmessage") || lower.includes("relaymessage")) capabilities.push("whatsapp.send");
  if (lower.includes("getdatabase") || lower.includes("db.")) capabilities.push("database");
  if (lower.includes("axios") || lower.includes("fetch(") || lower.includes("http")) capabilities.push("network");
  if (lower.includes("fs.") || lower.includes("readfile") || lower.includes("writefile")) capabilities.push("filesystem");
  if (lower.includes("exec(") || lower.includes("child_process")) capabilities.push("process_execution");
  if (lower.includes("preparewamessage") || lower.includes("buttonv2")) capabilities.push("rich_messages");
  if (filePath.startsWith("plugins/")) capabilities.push("plugin");
  return [...new Set(capabilities)];
}

function buildProjectManifest() {
  const files = listFiles(ROOT);
  const exports = {};
  const plugins = [];
  const capabilitySet = new Set();

  for (const item of files) {
    if (!item.path.endsWith(".js") && !item.path.endsWith(".mjs") && !item.path.endsWith(".cjs")) continue;
    let content = "";
    try { content = fs.readFileSync(path.join(ROOT, item.path), "utf8").slice(0, MAX_FILE_BYTES); } catch { continue; }
    exports[item.path] = extractExports(content);
    const plugin = extractPluginInfo(item.path, content);
    if (plugin) plugins.push(plugin);
    for (const capability of inferCapabilities(item.path, content)) capabilitySet.add(capability);
  }

  const manifest = saveProjectManifest({
    files,
    exports,
    plugins,
    capabilities: [...capabilitySet].sort(),
  });
  return manifest;
}

function getProjectManifest({ refresh = false } = {}) {
  const current = loadProjectManifest();
  if (!refresh && current.files?.length) return current;
  return buildProjectManifest();
}

function searchProject(query, { scope = "", limit = 30 } = {}) {
  const needle = String(query || "").trim().toLowerCase();
  if (!needle) return [];
  const files = getProjectManifest().files || [];
  const results = [];
  for (const item of files) {
    if (scope && !item.path.toLowerCase().includes(String(scope).toLowerCase())) continue;
    const absolute = path.join(ROOT, item.path);
    let content = "";
    try { content = fs.readFileSync(absolute, "utf8"); } catch { continue; }
    const lines = content.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      if (lines[index].toLowerCase().includes(needle)) {
        results.push({ path: item.path, line: index + 1, text: lines[index].trim().slice(0, 300) });
        if (results.length >= limit) return results;
      }
    }
  }
  return results;
}

export { buildProjectManifest, getProjectManifest, searchProject, extractExports, extractPluginInfo, inferCapabilities };
