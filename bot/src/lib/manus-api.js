// Manus API v2 bridge for Tarboo Bot.
// Task results are received by the signed Webhook endpoint on the dashboard,
// then read by the bot using the shared bridge token. This avoids direct
// task.listMessages polling when that endpoint is unavailable to an API key.

const MANUS_API_BASE = "https://api.manus.ai";
const DEFAULT_BRIDGE_URL = "https://marobotdash-wtjdanpz.manus.space";
const WEBHOOK_PATH = "/api/webhooks/manus";
const RESULT_PATH = "/api/manus-results";
const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 300000;

let webhookReady = false;
let webhookRegistration = null;

export class ManusAPIError extends Error {
  constructor(message, code = "api_error", requestId = null) {
    super(message);
    this.name = "ManusAPIError";
    this.code = code;
    this.requestId = requestId;
  }
}

function getApiKey() {
  const key = process.env.MANUS_API_KEY?.trim();
  if (!key) throw new Error("MANUS_API_KEY غير مضبوط في متغيرات البيئة.");
  return key;
}

function getBridgeConfig() {
  const baseUrl = (process.env.MAROBOT_BRIDGE_URL?.trim() || DEFAULT_BRIDGE_URL).replace(/\/$/, "");
  const token = process.env.MAROBOT_WEBHOOK_TOKEN?.trim();
  if (!token) throw new Error("MAROBOT_WEBHOOK_TOKEN غير مضبوط في متغيرات البيئة.");
  if (!/^https:\/\//i.test(baseUrl)) throw new Error("MAROBOT_BRIDGE_URL يجب أن يبدأ بـ https://");
  return { baseUrl, token, callbackUrl: `${baseUrl}${WEBHOOK_PATH}` };
}

function parseApiError(data, status) {
  const apiError = data?.error || {};
  const code = apiError.code || data?.code || "unknown_error";
  const message = apiError.message || data?.message || `HTTP ${status}`;
  const requestId = data?.request_id || null;
  const suffix = requestId ? ` [request_id: ${requestId}]` : "";
  return new ManusAPIError(`Manus API (${code}): ${message}${suffix}`, code, requestId);
}

async function apiRequest(method, path, { fetchImpl, body } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await (fetchImpl || fetch)(`${MANUS_API_BASE}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-manus-api-key": getApiKey(),
      },
      body,
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok === false) throw parseApiError(data, response.status);
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hasWebhookUrl(data, callbackUrl) {
  const webhooks = Array.isArray(data?.data) ? data.data : Array.isArray(data?.webhooks) ? data.webhooks : [];
  return webhooks.some((webhook) => String(webhook?.url || "").replace(/\/$/, "") === callbackUrl);
}

async function ensureWebhook(options = {}) {
  if (webhookReady) return getBridgeConfig();
  if (webhookRegistration) return webhookRegistration;

  webhookRegistration = (async () => {
    const bridge = getBridgeConfig();
    const listed = await apiRequest("GET", "/v2/webhook.list", { fetchImpl: options.manusFetchImpl });
    if (!hasWebhookUrl(listed, bridge.callbackUrl)) {
      await apiRequest("POST", "/v2/webhook.create", {
        fetchImpl: options.manusFetchImpl,
        body: JSON.stringify({ url: bridge.callbackUrl }),
      });
    }
    webhookReady = true;
    return bridge;
  })();

  try {
    return await webhookRegistration;
  } finally {
    webhookRegistration = null;
  }
}

async function createTask(prompt, options = {}) {
  const data = await apiRequest("POST", "/v2/task.create", {
    fetchImpl: options.manusFetchImpl,
    body: JSON.stringify({
      message: { content: prompt },
      locale: options.locale || "ar",
      interactive_mode: false,
      hide_in_task_list: true,
      agent_profile: options.agentProfile || "manus-1.6",
      title: "Tarboo Bot Manus request",
    }),
  });
  if (!data?.task_id) {
    throw new ManusAPIError("لم تُرجع Manus معرف مهمة صالحاً بعد الإنشاء.", "invalid_response", data?.request_id || null);
  }
  return { taskId: data.task_id, requestId: data.request_id || null };
}

async function readBridgeResult(taskId, bridge, fetchImpl) {
  const response = await (fetchImpl || fetch)(`${bridge.baseUrl}${RESULT_PATH}/${encodeURIComponent(taskId)}`, {
    headers: { "x-marobot-token": bridge.token, Accept: "application/json" },
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) throw new Error("MAROBOT_WEBHOOK_TOKEN لا يطابق رمز الجسر في لوحة Tarboo Bot.");
  if (!response.ok || data?.ok === false) throw new Error("تعذر قراءة نتيجة Manus من جسر لوحة Tarboo Bot.");
  return data;
}

async function waitForWebhookResult(taskId, bridge, options = {}) {
  const deadline = Date.now() + (options.pollTimeoutMs || POLL_TIMEOUT_MS);
  while (Date.now() < deadline) {
    const data = await readBridgeResult(taskId, bridge, options.bridgeFetchImpl);
    if (data.status === "finish" && data.result?.message) {
      return { answer: data.result.message, taskId, source: "webhook" };
    }
    if (data.status === "ask") {
      return {
        answer: data.result?.message || "تحتاج مهمة Manus إلى توضيح إضافي.",
        taskId,
        source: "webhook_waiting",
      };
    }
    await sleep(options.pollIntervalMs || POLL_INTERVAL_MS);
  }
  throw new Error("ما زالت مهمة Manus قيد التنفيذ. أعد إرسال الأمر لاحقاً أو افتح المهمة من تطبيق Manus.");
}

export async function runTurn({ prompt, ...options }) {
  if (!String(prompt || "").trim()) throw new Error("الرسالة المطلوبة لـ Manus فارغة.");
  const bridge = await ensureWebhook(options);
  const task = await createTask(prompt, options);
  return waitForWebhookResult(task.taskId, bridge, options);
}

export async function sendMessageToAgent(prompt, options = {}) {
  const result = await runTurn({ prompt, ...options });
  return result.answer;
}

/** Owner-only configuration check; it does not expose either secret. */
export async function diagnoseManusTaskAccess(options = {}) {
  try {
    const bridge = await ensureWebhook(options);
    const probe = await readBridgeResult("marobot-bridge-probe", bridge, options.bridgeFetchImpl);
    const task = await createTask("رد بكلمة OK فقط. هذه مهمة تشخيص اتصال API.", options);
    return {
      created: true,
      bridgeConnected: probe?.ok === true,
      taskId: task.taskId.length > 10 ? `${task.taskId.slice(0, 6)}…${task.taskId.slice(-4)}` : "تم الإنشاء",
      requestId: task.requestId,
      status: "pending",
      message: "نجح تسجيل Webhook وإنشاء المهمة. سيصل الرد إلى جسر لوحة Tarboo Bot عند اكتمالها.",
    };
  } catch (error) {
    return {
      created: false,
      bridgeConnected: false,
      code: error?.code || "bridge_setup_failed",
      requestId: error?.requestId || null,
      message: error?.message || "تعذر إعداد جسر Manus Webhook.",
    };
  }
}

export { createTask };
