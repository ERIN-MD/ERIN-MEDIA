import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(process.cwd());
const roots = ['src/scraper', 'plugins'];
const urlPattern = /https?:\/\/[^\s"'`)<>{}\\]+/g;
const ignoredHosts = new Set(['', 'ẉ.Tarboo Bot']);
const timeoutMs = 7000;
const concurrency = 10;

function filesIn(relativeDir) {
  const result = [];
  const stack = [path.join(projectRoot, relativeDir)];
  while (stack.length) {
    const directory = stack.pop();
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const item = path.join(directory, entry.name);
      if (entry.isDirectory()) stack.push(item);
      if (entry.isFile() && entry.name.endsWith('.js')) result.push(item);
    }
  }
  return result;
}

const hosts = new Set();
for (const file of roots.flatMap(filesIn)) {
  const text = fs.readFileSync(file, 'utf8');
  for (const entry of text.matchAll(urlPattern)) {
    try {
      const host = new URL(entry[0].replace(/[;,.:]+$/, '')).host;
      if (!host.includes('${') && !ignoredHosts.has(host)) hosts.add(host);
    } catch {}
  }
}

async function probe(host) {
  const url = `https://${host}/`;
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response = await fetch(url, { method: 'HEAD', redirect: 'manual', signal: controller.signal });
    if (response.status === 405) {
      response = await fetch(url, { method: 'GET', redirect: 'manual', signal: controller.signal });
    }
    return { host, status: response.status, ok: response.status > 0 && response.status < 500, durationMs: Date.now() - started, reason: '' };
  } catch (error) {
    return { host, status: 0, ok: false, durationMs: Date.now() - started, reason: error.name === 'AbortError' ? 'timeout' : error.code || error.cause?.code || error.message };
  } finally {
    clearTimeout(timer);
  }
}

const pending = [...hosts].sort();
const results = [];
async function worker() {
  while (pending.length) {
    const host = pending.shift();
    results.push(await probe(host));
  }
}
await Promise.all(Array.from({ length: Math.min(concurrency, pending.length) }, worker));
results.sort((a, b) => a.host.localeCompare(b.host));

const responsive = results.filter((entry) => entry.ok);
const failed = results.filter((entry) => !entry.ok);
const markdown = [
  '# فحص وصول نطاقات API الخارجية',
  '',
  '> هذا فحص وصول تقني محدود للنطاقات فقط. لا يستدعي وظائف البلوقنات، ولا يرسل مفاتيح API أو بيانات مستخدم أو طلبات تنزيل.',
  '',
  `- النطاقات المفحوصة: ${results.length}`,
  `- نطاقات متجاوبة تقنياً (2xx/3xx/4xx): ${responsive.length}`,
  `- نطاقات غير متاحة أو انتهت مهلة الاتصال: ${failed.length}`,
  '',
  '## نطاقات غير متاحة تقنياً',
  '',
  '| النطاق | السبب | زمن الفحص (ms) |',
  '|---|---|---:|',
  ...failed.map((entry) => `| \`${entry.host}\` | ${String(entry.reason).replaceAll('|', '\\|')} | ${entry.durationMs} |`),
  '',
  '## ملخص النطاقات المتجاوبة',
  '',
  '| النطاق | الحالة | زمن الفحص (ms) |',
  '|---|---:|---:|',
  ...responsive.map((entry) => `| \`${entry.host}\` | ${entry.status} | ${entry.durationMs} |`),
  '',
  '> الملاحظة: الوصول للنطاق لا يثبت أن endpoint أو المفتاح يعمل؛ النطاقات المصنفة على أنها غير متاحة هي أولويات الاستبدال، ثم تختبر المسارات الفعلية بشكل منفصل.',
  '',
];
fs.writeFileSync(path.join(projectRoot, 'EXTERNAL_HOST_HEALTH.md'), markdown.join('\n'));
console.log(JSON.stringify({ total: results.length, responsive: responsive.length, failed: failed.length }));
