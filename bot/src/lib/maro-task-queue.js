const tasks = new Map();
const waiting = [];
let active = 0;
const MAX_ACTIVE = 2;
const DEFAULT_CLEANUP_MS = 5 * 60 * 1000;

function runNext() {
  if (active >= MAX_ACTIVE || !waiting.length) return;
  const task = waiting.shift(); active += 1; task.status = "running"; task.startedAt = Date.now();
  Promise.resolve().then(task.run).then((result) => { task.status = "completed"; task.result = result; task.resolve(result); }).catch((error) => { task.status = "failed"; task.error = String(error?.message || error); task.reject(error); }).finally(() => { task.finishedAt = Date.now(); const cleanupTimer = setTimeout(() => tasks.delete(task.id), task.cleanupMs); cleanupTimer.unref?.(); active -= 1; runNext(); });
}

function enqueueTask({ type = "general", owner = "", run, cleanupMs = DEFAULT_CLEANUP_MS }) {
  if (typeof run !== "function") throw new Error("يجب توفير دالة للمهمة.");
  const id = `TASK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  let resolve; let reject;
  const done = new Promise((res, rej) => { resolve = res; reject = rej; });
  const task = { id, type, owner, status: "queued", createdAt: Date.now(), run, resolve, reject, cleanupMs };
  tasks.set(id, task); waiting.push(task); runNext();
  return { id, status: task.status, done };
}

function getTaskStatus(id) { const task = tasks.get(id); return task ? { id: task.id, type: task.type, owner: task.owner, status: task.status, error: task.error || null, createdAt: task.createdAt, startedAt: task.startedAt || null, finishedAt: task.finishedAt || null } : null; }
function getQueueSummary() { return { active, queued: waiting.length, total: tasks.size }; }
export { enqueueTask, getTaskStatus, getQueueSummary };
