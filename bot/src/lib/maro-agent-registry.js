import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data", "autoai");
const MANIFEST_PATH = path.join(DATA_DIR, "project-manifest.json");
const MEMORY_PATH = path.join(DATA_DIR, "agent-memory.json");

const SAFE_ROOTS = [
  path.join(ROOT, "src"),
  path.join(ROOT, "plugins"),
  path.join(ROOT, "tests"),
  path.join(ROOT, "tools"),
  path.join(ROOT, "config.js"),
  path.join(ROOT, "package.json"),
];

const BLOCKED_PARTS = [
  ".env",
  "auth_info",
  "session",
  "database",
  "secrets",
  "node_modules",
  "storage",
  "credentials",
  "token",
  "apikey",
  "api_key",
];

const TOOL_REGISTRY = Object.freeze({
  "project.list_files": {
    name: "project.list_files",
    description: "فهرسة ملفات المشروع المسموح بها دون قراءة الأسرار.",
    risk: "read_only",
    permission: "owner_or_enabled_autoai",
    inputSchema: { prefix: "string?", extension: "string?", limit: "number?" },
  },
  "project.read_file": {
    name: "project.read_file",
    description: "قراءة ملف مشروع مسموح به مع إخفاء الملفات الحساسة.",
    risk: "read_only",
    permission: "owner_or_enabled_autoai",
    inputSchema: { path: "string", start: "number?", end: "number?" },
  },
  "project.search": {
    name: "project.search",
    description: "البحث عن نص أو تعبير داخل ملفات المشروع المسموح بها.",
    risk: "read_only",
    permission: "owner_or_enabled_autoai",
    inputSchema: { query: "string", scope: "string?", limit: "number?" },
  },
  "project.inspect_exports": {
    name: "project.inspect_exports",
    description: "استخراج الاستيرادات والتصديرات والدوال الأساسية من ملف JavaScript.",
    risk: "read_only",
    permission: "owner_or_enabled_autoai",
    inputSchema: { path: "string" },
  },
  "project.syntax_check": {
    name: "project.syntax_check",
    description: "فحص صياغة JavaScript دون تشغيل الملف.",
    risk: "safe_execution",
    permission: "owner_or_enabled_autoai",
    inputSchema: { path: "string" },
  },
  "project.project_manifest": {
    name: "project.project_manifest",
    description: "فهرس شامل لبنية المشروع وقدراته وتصديراته.",
    risk: "read_only",
    permission: "owner_or_enabled_autoai",
    inputSchema: { refresh: "boolean?" },
  },
  "project.find_missing_imports": {
    name: "project.find_missing_imports",
    description: "كشف الاستيرادات النسبية التي تشير إلى ملفات غير موجودة.",
    risk: "read_only",
    permission: "owner_or_enabled_autoai",
    inputSchema: { scope: "string?" },
  },
  "project.run_tests": {
    name: "project.run_tests",
    description: "تشغيل اختبار مسجل وآمن من package.json للمطور أو الفحص المحلي.",
    risk: "safe_execution",
    permission: "developer_only",
    inputSchema: { script: "string?" },
  },
  "project.diff": {
    name: "project.diff",
    description: "عرض الفرق المقترح بين النص الحالي والنص الجديد دون تطبيقه.",
    risk: "read_only",
    permission: "owner_only",
    inputSchema: { path: "string", replacement: "string" },
  },
  "project.write_file": {
    name: "project.write_file",
    description: "تعديل ملف مسموح بعد موافقة المطور فقط.",
    risk: "write",
    permission: "developer_only",
    inputSchema: { path: "string", content: "string", confirmation: "string" },
  },
  "project.execute": {
    name: "project.execute",
    description: "تنفيذ أمر محدد من قائمة مسموحة للمطور فقط، وليس Shell عاماً.",
    risk: "execution",
    permission: "developer_only",
    inputSchema: { command: "enum", confirmation: "string" },
  },
  "memory.remember": {
    name: "memory.remember",
    description: "حفظ تفضيل أو معلومة صغيرة قابلة للحذف دون تخزين الأسرار.",
    risk: "write_memory",
    permission: "owner_or_user_for_own_memory",
    inputSchema: { key: "string", value: "string", scope: "string?" },
  },
  "memory.forget": {
    name: "memory.forget",
    description: "حذف معلومة محفوظة.",
    risk: "write_memory",
    permission: "owner_or_user_for_own_memory",
    inputSchema: { key: "string", scope: "string?" },
  },
  "agent.health_check": {
    name: "agent.health_check",
    description: "فحص صحة الفهرس والاستيرادات والصياغة وحالة المزودات.",
    risk: "read_only",
    permission: "developer_only",
    inputSchema: { refresh: "boolean?", includeTests: "boolean?" },
  },
  "agent.list_runs": {
    name: "agent.list_runs",
    description: "عرض تشغيلات الوكيل وحالات الخطط القابلة للاستئناف.",
    risk: "read_only",
    permission: "developer_only",
    inputSchema: { limit: "number?" },
  },
  "agent.list_audit": {
    name: "agent.list_audit",
    description: "عرض سجل تدقيق الوكيل مع إخفاء الأسرار.",
    risk: "read_only",
    permission: "developer_only",
    inputSchema: { runId: "string?", limit: "number?" },
  },
  "agent.approve": {
    name: "agent.approve",
    description: "الموافقة على خطة حساسة للمطور مرة واحدة.",
    risk: "write_memory",
    permission: "developer_only",
    inputSchema: { approvalId: "string", approved: "boolean" },
  },
});

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function normalizeRelativePath(input = "") {
  const value = String(input).trim().replace(/\\/g, "/");
  if (!value || value.includes("\0")) return null;
  const absolute = path.resolve(ROOT, value);
  const relative = path.relative(ROOT, absolute).replace(/\\/g, "/");
  return relative && !relative.startsWith("..") ? relative : null;
}

function isBlocked(relativePath = "") {
  const lower = relativePath.toLowerCase();
  return BLOCKED_PARTS.some((part) => lower === part || lower.startsWith(`${part}/`) || lower.includes(`/${part}/`));
}

function isAllowedPath(input, { allowRootFiles = true } = {}) {
  const relative = normalizeRelativePath(input);
  if (!relative || isBlocked(relative)) return false;
  if (!allowRootFiles && !relative.includes("/")) return false;
  const absolute = path.resolve(ROOT, relative);
  return SAFE_ROOTS.some((root) => absolute === root || absolute.startsWith(`${root}${path.sep}`));
}

function safeResolve(input) {
  const relative = normalizeRelativePath(input);
  if (!relative || !isAllowedPath(relative)) return null;
  return { relative, absolute: path.resolve(ROOT, relative) };
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  ensureDataDir();
  const temporary = `${filePath}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(temporary, filePath);
}

function getToolRegistry() {
  return TOOL_REGISTRY;
}

function getToolCatalogText() {
  return Object.values(TOOL_REGISTRY)
    .map((tool) => `- ${tool.name}: ${tool.description} [risk=${tool.risk}, permission=${tool.permission}]`)
    .join("\n");
}

function loadAgentMemory() {
  ensureDataDir();
    return readJson(MEMORY_PATH, { version: 2, preferences: {}, facts: {}, decisions: [], capabilities: {}, lessons: [], updatedAt: null });
}

function saveAgentMemory(memory) {
  const next = {
    version: 2,
    preferences: memory.preferences || {},
    facts: memory.facts || {},
    decisions: Array.isArray(memory.decisions) ? memory.decisions.slice(-120) : [],
    capabilities: memory.capabilities || {},
    lessons: Array.isArray(memory.lessons) ? memory.lessons.slice(-200) : [],
    updatedAt: new Date().toISOString(),
  };
  writeJson(MEMORY_PATH, next);
  return next;
}

function loadProjectManifest() {
  ensureDataDir();
  return readJson(MANIFEST_PATH, { version: 1, generatedAt: null, files: [], exports: {}, capabilities: [], plugins: [] });
}

function saveProjectManifest(manifest) {
  const next = {
    version: 1,
    generatedAt: new Date().toISOString(),
    files: Array.isArray(manifest.files) ? manifest.files : [],
    exports: manifest.exports && typeof manifest.exports === "object" ? manifest.exports : {},
    capabilities: Array.isArray(manifest.capabilities) ? manifest.capabilities : [],
    plugins: Array.isArray(manifest.plugins) ? manifest.plugins : [],
  };
  writeJson(MANIFEST_PATH, next);
  return next;
}

function redactSecrets(value) {
  return String(value || "")
    .replace(/(api[_-]?key|token|secret|password)\s*[:=]\s*[^\s,;]+/gi, "$1=[REDACTED]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [REDACTED]");
}

export {
  DATA_DIR,
  MANIFEST_PATH,
  MEMORY_PATH,
  SAFE_ROOTS,
  getToolRegistry,
  getToolCatalogText,
  loadAgentMemory,
  saveAgentMemory,
  loadProjectManifest,
  saveProjectManifest,
  normalizeRelativePath,
  isAllowedPath,
  isBlocked,
  safeResolve,
  redactSecrets,
};
