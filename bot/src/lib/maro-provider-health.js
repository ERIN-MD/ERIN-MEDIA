const providers = new Map();
const FAILURE_LIMIT = 3;
const COOLDOWN_MS = 5 * 60 * 1000;

function state(name) {
  if (!providers.has(name)) providers.set(name, { name, successes: 0, failures: 0, lastError: "", blockedUntil: 0, updatedAt: Date.now() });
  return providers.get(name);
}

function canUseProvider(name) {
  const item = state(name);
  return { allowed: item.blockedUntil <= Date.now(), retryAt: item.blockedUntil || null };
}

function reportProviderSuccess(name) {
  const item = state(name);
  item.successes += 1; item.failures = 0; item.lastError = ""; item.blockedUntil = 0; item.updatedAt = Date.now();
  return { ...item };
}

function reportProviderFailure(name, error) {
  const item = state(name);
  item.failures += 1; item.lastError = String(error?.message || error || "فشل غير معروف").slice(0, 180); item.updatedAt = Date.now();
  if (item.failures >= FAILURE_LIMIT) item.blockedUntil = Date.now() + COOLDOWN_MS;
  return { ...item };
}

async function withProviderHealth(name, operation) {
  const permission = canUseProvider(name);
  if (!permission.allowed) throw new Error(`المزود ${name} متوقف مؤقتاً حتى ${new Date(permission.retryAt).toLocaleTimeString("ar-EG")}`);
  try { const result = await operation(); reportProviderSuccess(name); return result; }
  catch (error) { reportProviderFailure(name, error); throw error; }
}

function getProviderHealth() { return [...providers.values()].map((item) => ({ ...item, blocked: item.blockedUntil > Date.now() })); }
export { canUseProvider, reportProviderSuccess, reportProviderFailure, withProviderHealth, getProviderHealth };
