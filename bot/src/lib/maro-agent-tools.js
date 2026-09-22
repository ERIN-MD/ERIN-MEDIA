import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import {
  safeResolve,
  redactSecrets,
  getToolRegistry,
} from "./maro-agent-registry.js";
import { getProjectManifest, searchProject, extractExports } from "./maro-project-manifest.js";
import { rememberPreference, forgetPreference } from "./maro-agent-memory.js";
import { listRunRecords, decideApproval } from "./maro-agent-control.js";
import { listAuditEvents } from "./maro-agent-audit.js";

const execFileAsync = promisify(execFile);
const ROOT = process.cwd();
const MAX_READ_BYTES = 180_000;
const MAX_RESULT_ITEMS = 80;
const ALLOWED_TEST_SCRIPTS = new Set(["test", "test:syntax", "test:local", "lint"]);
const ALLOWED_COMMANDS = new Set(["manifest", "syntax", "test", "static-audit"]);

function clamp(value, fallback = 30, max = MAX_RESULT_ITEMS) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(1, Math.min(Math.floor(number), max)) : fallback;
}

function readSafeFile(inputPath, { start = 1, end = 240 } = {}) {
  const resolved = safeResolve(inputPath);
  if (!resolved || !fs.existsSync(resolved.absolute)) return { ok: false, error: "المسار غير مسموح أو الملف غير موجود." };
  const stat = fs.statSync(resolved.absolute);
  if (!stat.isFile() || stat.size > MAX_READ_BYTES) return { ok: false, error: "الملف غير صالح للقراءة الآمنة أو حجمه كبير." };
  const content = fs.readFileSync(resolved.absolute, "utf8");
  const lines = content.split(/\r?\n/);
  const from = Math.max(1, Number(start) || 1);
  const to = Math.min(lines.length, Math.max(from, Number(end) || from + 240));
  return { ok: true, path: resolved.relative, start: from, end: to, totalLines: lines.length, content: redactSecrets(lines.slice(from - 1, to).join("\n")) };
}

function listProjectFiles({ prefix = "", extension = "", limit = 80 } = {}) {
  const manifest = getProjectManifest();
  const normalizedPrefix = String(prefix || "").toLowerCase();
  const normalizedExtension = String(extension || "").toLowerCase();
  const files = (manifest.files || [])
    .filter((file) => !normalizedPrefix || file.path.toLowerCase().includes(normalizedPrefix))
    .filter((file) => !normalizedExtension || file.path.toLowerCase().endsWith(normalizedExtension))
    .slice(0, clamp(limit));
  return { ok: true, count: files.length, files, plugins: manifest.plugins || [] };
}

function inspectFileExports(inputPath) {
  const read = readSafeFile(inputPath, { start: 1, end: 2000 });
  if (!read.ok) return read;
  return { ok: true, path: read.path, ...extractExports(read.content) };
}

async function syntaxCheck(inputPath) {
  const resolved = safeResolve(inputPath);
  if (!resolved || !fs.existsSync(resolved.absolute)) return { ok: false, error: "الملف غير مسموح أو غير موجود." };
  if (!/\.(?:m?js|cjs)$/i.test(resolved.relative)) return { ok: false, error: "فحص الصياغة متاح لملفات JavaScript فقط." };
  try {
    await execFileAsync(process.execPath, ["--check", resolved.absolute], { timeout: 15_000, maxBuffer: 50_000 });
    return { ok: true, path: resolved.relative, message: "syntax: passed" };
  } catch (error) {
    return { ok: false, path: resolved.relative, error: redactSecrets(error.stderr || error.stdout || error.message).slice(0, 1000) };
  }
}

function searchFiles({ query, scope = "", limit = 30 } = {}) {
  if (!query || String(query).length > 200) return { ok: false, error: "أدخل عبارة بحث قصيرة وواضحة." };
  return { ok: true, query: String(query), results: searchProject(query, { scope, limit: clamp(limit) }) };
}

function inspectProject({ refresh = false } = {}) {
  const manifest = getProjectManifest({ refresh: Boolean(refresh) });
  return { ok: true, generatedAt: manifest.generatedAt, fileCount: manifest.files?.length || 0, pluginCount: manifest.plugins?.length || 0, capabilities: manifest.capabilities || [], plugins: (manifest.plugins || []).slice(0, 400), sampleFiles: (manifest.files || []).slice(0, 100) };
}

function resolveImportFile(fromFile, importPath) {
  const base = path.resolve(ROOT, path.dirname(fromFile), importPath);
  const candidates = [base, `${base}.js`, `${base}.mjs`, `${base}.cjs`, `${base}.json`, path.join(base, "index.js")];
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function findMissingImports({ scope = "" } = {}) {
  const manifest = getProjectManifest();
  const missing = [];
  for (const item of manifest.files || []) {
    if (scope && !item.path.toLowerCase().includes(String(scope).toLowerCase())) continue;
    if (!/\.(?:m?js|cjs)$/i.test(item.path)) continue;
    const file = path.join(ROOT, item.path);
    let content = "";
    try { content = fs.readFileSync(file, "utf8"); } catch { continue; }
    const imports = [...content.matchAll(/(?:from\s*["']|import\s*\(\s*["']|require\s*\(\s*["'])(\.[^"']+)["']/g)].map((match) => match[1]);
    for (const importPath of imports) {
      if (!resolveImportFile(item.path, importPath)) missing.push({ file: item.path, import: importPath });
    }
  }
  return { ok: true, count: missing.length, missing: missing.slice(0, MAX_RESULT_ITEMS) };
}

async function runTests({ script = "test:syntax" } = {}) {
  const selected = String(script || "test:syntax").trim();
  if (!ALLOWED_TEST_SCRIPTS.has(selected)) return { ok: false, error: `سكريبت الاختبار غير مسموح: ${selected}` };
  try {
    const result = await execFileAsync("npm", ["run", selected], { cwd: ROOT, timeout: 120_000, maxBuffer: 200_000 });
    return { ok: true, script: selected, output: redactSecrets(`${result.stdout || ""}\n${result.stderr || ""}`).slice(-10_000) };
  } catch (error) {
    return { ok: false, script: selected, error: redactSecrets(`${error.stdout || ""}\n${error.stderr || ""}\n${error.message}`).slice(-10_000) };
  }
}

function buildDiff(inputPath, replacement = "") {
  const read = readSafeFile(inputPath, { start: 1, end: 100_000 });
  if (!read.ok) return read;
  const oldLines = read.content.split(/\r?\n/);
  const newLines = String(replacement).split(/\r?\n/);
  return {
    ok: true,
    path: read.path,
    changed: read.content !== String(replacement),
    oldLines: oldLines.length,
    newLines: newLines.length,
    preview: `--- ${read.path}\n+++ ${read.path} (new)\n@@ full replacement preview @@\n- ${oldLines.slice(0, 20).join("\n- ")}\n+ ${newLines.slice(0, 40).join("\n+ ")}`.slice(0, 12_000),
  };
}

function writeProjectFile(input = {}) {
  const { path: inputPath, content, confirmation } = input;
  if (confirmation !== "CONFIRM_MARO_WRITE") return { ok: false, error: "يلزم confirmation=CONFIRM_MARO_WRITE لتطبيق التعديل." };
  const resolved = safeResolve(inputPath);
  if (!resolved) return { ok: false, error: "المسار غير مسموح." };
  if (typeof content !== "string" || content.length > 500_000) return { ok: false, error: "المحتوى غير صالح أو كبير جداً." };
  const backup = `${resolved.absolute}.agent-backup-${Date.now()}`;
  if (fs.existsSync(resolved.absolute)) fs.copyFileSync(resolved.absolute, backup);
  fs.writeFileSync(resolved.absolute, content, "utf8");
  return { ok: true, path: resolved.relative, backup: path.relative(ROOT, backup), message: "تم تطبيق التعديل بعد التأكيد." };
}

async function executeProjectCommand({ command } = {}) {
  const selected = String(command || "").trim();
  if (!ALLOWED_COMMANDS.has(selected)) return { ok: false, error: `الأمر غير مسموح: ${selected}` };
  if (selected === "manifest") return inspectProject({ refresh: true });
  if (selected === "test") return runTests({ script: "test" });
  if (selected === "syntax") return runTests({ script: "test:syntax" });
  return { ok: false, error: "static-audit يحتاج تشغيله من الأمر المخصص بعد مراجعة الناتج." };
}

async function executeAgentTool(toolName, input = {}, { isDeveloper = false } = {}) {
  const registry = getToolRegistry();
  const tool = registry[toolName];
  if (!tool) return { ok: false, tool: toolName, error: "الأداة غير مسجلة." };
  if ((toolName.startsWith("project.") || toolName.startsWith("agent.")) && !isDeveloper) return { ok: false, tool: toolName, error: "أدوات المشروع وإدارة الوكيل متاحة للمطور فقط." };
  try {
    let data;
    switch (toolName) {
      case "project.list_files": data = listProjectFiles(input); break;
      case "project.read_file": data = readSafeFile(input.path, input); break;
      case "project.search": data = searchFiles(input); break;
      case "project.inspect_exports": data = inspectFileExports(input.path); break;
      case "project.syntax_check": data = await syntaxCheck(input.path); break;
      case "project.project_manifest": data = inspectProject(input); break;
      case "project.find_missing_imports": data = findMissingImports(input); break;
      case "project.run_tests": data = await runTests(input); break;
      case "project.diff": data = buildDiff(input.path, input.replacement); break;
      case "project.write_file": data = writeProjectFile(input); break;
      case "project.execute": data = await executeProjectCommand(input); break;
      case "memory.remember": data = rememberPreference(input.key, input.value, { scope: input.scope, owner: input.owner }); break;
      case "memory.forget": data = forgetPreference(input.key, { scope: input.scope }); break;
      case "agent.list_runs": data = { ok: true, runs: listRunRecords(input.limit) }; break;
      case "agent.list_audit": data = { ok: true, events: listAuditEvents(input) }; break;
      case "agent.approve": data = decideApproval(input.approvalId, { approved: input.approved !== false, decidedBy: input.decidedBy || "owner", note: input.note || "" }); break;
      case "agent.health_check": {
        const { runAgentHealthCheck } = await import("./maro-agent-health.js");
        data = await runAgentHealthCheck(input);
        break;
      }
      default: return { ok: false, tool: toolName, error: "الأداة غير مربوطة بعد.", available: Object.keys(registry) };
    }
    return { tool: toolName, ...data };
  } catch (error) {
    return { ok: false, tool: toolName, error: redactSecrets(error.message).slice(0, 800) };
  }
}

export {
  executeAgentTool,
  readSafeFile,
  listProjectFiles,
  inspectFileExports,
  syntaxCheck,
  searchFiles,
  inspectProject,
  findMissingImports,
  runTests,
  buildDiff,
  writeProjectFile,
  executeProjectCommand,
};
