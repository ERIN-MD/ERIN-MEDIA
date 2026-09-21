import {
  loadAgentMemory,
  saveAgentMemory,
  redactSecrets,
} from "./maro-agent-registry.js";

const MAX_VALUE_LENGTH = 500;
const MAX_KEY_LENGTH = 80;
const MEMORY_KINDS = new Set(["preference", "fact", "decision", "capability"]);

function normalizeKey(key = "") {
  return String(key)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_:. -]/gu, "")
    .slice(0, MAX_KEY_LENGTH);
}

function isSensitiveKey(key = "") {
  return /(token|secret|password|apikey|api_key|مفتاح|كلمة.?المرور|جلسة|session|credential)/i.test(key);
}

function sanitizeValue(key, value) {
  if (isSensitiveKey(key)) return "[REDACTED]";
  return redactSecrets(String(value || "")).slice(0, MAX_VALUE_LENGTH);
}

function rememberStructured({ key, value, scope = "global", owner = "", kind = "preference", confidence = 1, ttlMs = 0, source = "user" } = {}) {
  const normalizedKey = normalizeKey(key);
  const normalizedKind = MEMORY_KINDS.has(kind) ? kind : "preference";
  if (!normalizedKey) return { ok: false, reason: "invalid-key" };
  const memory = loadAgentMemory();
  const scopeKey = String(scope || "global").slice(0, 120);
  const bucket = normalizedKind === "preference" ? "preferences" : normalizedKind === "fact" ? "facts" : normalizedKind === "capability" ? "capabilities" : "decisions";
  if (bucket === "decisions") {
    memory.decisions ||= [];
    memory.decisions.push({ key: normalizedKey, value: sanitizeValue(normalizedKey, value), scope: scopeKey, confidence: Math.max(0, Math.min(Number(confidence) || 0, 1)), source: String(source).slice(0, 80), owner: String(owner || "").slice(0, 80), createdAt: new Date().toISOString() });
    memory.decisions = memory.decisions.slice(-120);
  } else {
    memory[bucket] ||= {};
    memory[bucket][scopeKey] ||= {};
    memory[bucket][scopeKey][normalizedKey] = {
      value: sanitizeValue(normalizedKey, value),
      confidence: Math.max(0, Math.min(Number(confidence) || 0, 1)),
      source: String(source).slice(0, 80),
      owner: String(owner || "").slice(0, 80),
      updatedAt: new Date().toISOString(),
      expiresAt: ttlMs > 0 ? new Date(Date.now() + Math.min(Number(ttlMs), 365 * 24 * 60 * 60 * 1000)).toISOString() : null,
    };
  }
  saveAgentMemory(memory);
  return { ok: true, key: normalizedKey, scope: scopeKey, kind: normalizedKind };
}

function rememberPreference(key, value, options = {}) {
  return rememberStructured({ ...options, key, value, kind: "preference" });
}

function forgetPreference(key, { scope = "global" } = {}) {
  const normalizedKey = normalizeKey(key);
  const memory = loadAgentMemory();
  const scopeKey = String(scope || "global").slice(0, 120);
  const buckets = ["preferences", "facts", "capabilities"];
  let removed = false;
  for (const bucket of buckets) {
    if (memory[bucket]?.[scopeKey]?.[normalizedKey]) {
      delete memory[bucket][scopeKey][normalizedKey];
      removed = true;
    }
  }
  if (Array.isArray(memory.decisions)) {
    const before = memory.decisions.length;
    memory.decisions = memory.decisions.filter((item) => !(item.key === normalizedKey && (!item.scope || item.scope === scopeKey)));
    removed ||= before !== memory.decisions.length;
  }
  if (!removed) return { ok: false, reason: "not-found" };
  saveAgentMemory(memory);
  return { ok: true, key: normalizedKey, scope: scopeKey };
}

function pruneExpiredMemory(memory) {
  const now = Date.now();
  for (const bucket of ["preferences", "facts", "capabilities"]) {
    for (const scope of Object.keys(memory[bucket] || {})) {
      for (const [key, item] of Object.entries(memory[bucket][scope] || {})) {
        if (item.expiresAt && Date.parse(item.expiresAt) <= now) delete memory[bucket][scope][key];
      }
    }
  }
  return memory;
}

function getPreferences(scope = "global") {
  const memory = pruneExpiredMemory(loadAgentMemory());
  return memory.preferences?.[String(scope)] || {};
}

function getStructuredMemory(scope = "global") {
  const memory = pruneExpiredMemory(loadAgentMemory());
  return {
    preferences: memory.preferences?.[String(scope)] || {},
    facts: memory.facts?.[String(scope)] || {},
    capabilities: memory.capabilities?.[String(scope)] || {},
    decisions: (memory.decisions || []).filter((item) => !scope || item.scope === scope).slice(-30),
  };
}

function getMemoryStats() {
  const memory = pruneExpiredMemory(loadAgentMemory());
  return {
    preferences: Object.values(memory.preferences || {}).reduce((sum, item) => sum + Object.keys(item || {}).length, 0),
    facts: Object.values(memory.facts || {}).reduce((sum, item) => sum + Object.keys(item || {}).length, 0),
    capabilities: Object.values(memory.capabilities || {}).reduce((sum, item) => sum + Object.keys(item || {}).length, 0),
    decisions: (memory.decisions || []).length,
    lessons: (memory.lessons || []).length,
  };
}

function recordLesson({ operation, success, summary, error = "" } = {}) {
  const memory = loadAgentMemory();
  memory.lessons.push({
    operation: String(operation || "unknown").slice(0, 100),
    success: Boolean(success),
    summary: redactSecrets(String(summary || error || "")).slice(0, 500),
    timestamp: new Date().toISOString(),
  });
  saveAgentMemory(memory);
  return memory.lessons.at(-1);
}

function buildMemoryContext(scope = "global") {
  const structured = getStructuredMemory(scope);
  const entries = [
    ...Object.entries(structured.preferences).map(([key, item]) => `- تفضيل ${key}: ${item.value}`),
    ...Object.entries(structured.facts).map(([key, item]) => `- حقيقة ${key}: ${item.value}`),
    ...Object.entries(structured.capabilities).map(([key, item]) => `- قدرة ${key}: ${item.value}`),
  ].slice(-40);
  if (!entries.length) return "";
  return entries.join("\n");
}

export {
  normalizeKey,
  isSensitiveKey,
  rememberStructured,
  rememberPreference,
  forgetPreference,
  getPreferences,
  getStructuredMemory,
  getMemoryStats,
  pruneExpiredMemory,
  recordLesson,
  buildMemoryContext,
};
