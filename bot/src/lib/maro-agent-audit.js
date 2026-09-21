import fs from "fs";
import path from "path";
import { DATA_DIR, redactSecrets } from "./maro-agent-registry.js";

const AUDIT_PATH = path.join(DATA_DIR, "agent-audit.json");
const MAX_EVENTS = 500;

function loadAuditEvents() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  try {
    const parsed = JSON.parse(fs.readFileSync(AUDIT_PATH, "utf8"));
    return Array.isArray(parsed.events) ? parsed.events.slice(-MAX_EVENTS) : [];
  } catch {
    return [];
  }
}

function saveAuditEvents(events) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const next = { version: 1, events: events.slice(-MAX_EVENTS), updatedAt: new Date().toISOString() };
  const temporary = `${AUDIT_PATH}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  fs.renameSync(temporary, AUDIT_PATH);
  return next;
}

function appendAuditEvent({ type = "unknown", runId = "", tool = "", actor = "", status = "info", input = {}, output = "", metadata = {} } = {}) {
  const events = loadAuditEvents();
  const event = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: String(type).slice(0, 80),
    runId: String(runId).slice(0, 100),
    tool: String(tool).slice(0, 100),
    actor: String(actor).slice(0, 120),
    status: String(status).slice(0, 40),
    input: redactSecrets(JSON.stringify(input || {})).slice(0, 1800),
    output: redactSecrets(typeof output === "string" ? output : JSON.stringify(output || {})).slice(0, 3000),
    metadata: redactSecrets(JSON.stringify(metadata || {})).slice(0, 1200),
    timestamp: new Date().toISOString(),
  };
  saveAuditEvents([...events, event]);
  return event;
}

function listAuditEvents({ runId = "", actor = "", limit = 30 } = {}) {
  const count = Math.max(1, Math.min(Number(limit) || 30, MAX_EVENTS));
  return loadAuditEvents()
    .filter((event) => (!runId || event.runId === runId) && (!actor || event.actor === actor))
    .slice(-count)
    .reverse();
}

function summarizeAudit() {
  const events = loadAuditEvents();
  const byType = {};
  const byStatus = {};
  for (const event of events) {
    byType[event.type] = (byType[event.type] || 0) + 1;
    byStatus[event.status] = (byStatus[event.status] || 0) + 1;
  }
  return { count: events.length, byType, byStatus, latest: events.at(-1) || null };
}

export { AUDIT_PATH, loadAuditEvents, saveAuditEvents, appendAuditEvent, listAuditEvents, summarizeAudit };
