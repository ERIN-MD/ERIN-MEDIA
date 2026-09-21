import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(process.cwd());
const sourceRoots = ['src/scraper', 'plugins'];
const networkPattern = /https?:\/\/[^\s"'`)<>{}\\]+/g;
const callPattern = /\b(?:axios\.(?:get|post|request|create)|fetch\(|got\(|request\(|https?\.request\()/;

function collectFiles(relativeDir) {
  const absoluteDir = path.join(projectRoot, relativeDir);
  const result = [];
  const stack = [absoluteDir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(entryPath);
      if (entry.isFile() && entry.name.endsWith('.js')) result.push(entryPath);
    }
  }
  return result;
}

function normalizeUrl(raw) {
  return raw.replace(/[;,.:]+$/, '');
}

const files = sourceRoots.flatMap(collectFiles);
const rows = [];
const domains = new Map();

for (const absolutePath of files) {
  const relativePath = path.relative(projectRoot, absolutePath);
  const content = fs.readFileSync(absolutePath, 'utf8');
  const urls = [...content.matchAll(networkPattern)].map((match) => normalizeUrl(match[0]));
  const hasNetworkCall = callPattern.test(content);
  if (!hasNetworkCall && urls.length === 0) continue;

  const uniqueUrls = [...new Set(urls)];
  const hosts = new Set();
  for (const url of uniqueUrls) {
    try {
      const host = new URL(url).host;
      hosts.add(host);
      if (!domains.has(host)) domains.set(host, new Set());
      domains.get(host).add(relativePath);
    } catch {
      // Template strings and incomplete endpoints are kept as file evidence only.
    }
  }

  rows.push({
    relativePath,
    hasNetworkCall,
    hosts: [...hosts].sort(),
    urls: uniqueUrls.sort(),
    needsKey: /api[_-]?key|authorization|bearer|x-api-key|token/i.test(content),
  });
}

rows.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
const report = [
  '# تقرير جرد الاتصالات الخارجية لـ Tarboo Bot',
  '',
  `- تم فحص ${files.length} ملف JavaScript ضمن \`src/scraper\` و\`plugins\`.`,
  `- تم العثور على ${rows.length} ملفاً يتضمن استدعاء شبكة أو عنوان خدمة خارجية.`,
  `- عدد النطاقات الثابتة المكتشفة: ${domains.size}.`,
  '',
  '## الملفات المرشحة للاختبار',
  '',
  '| الملف | استدعاء شبكة | يحتاج مفتاحاً | النطاقات المكتشفة |',
  '|---|---:|---:|---|',
  ...rows.map((row) => `| \`${row.relativePath}\` | ${row.hasNetworkCall ? 'نعم' : 'غير مؤكد'} | ${row.needsKey ? 'محتمل' : 'لا يظهر'} | ${row.hosts.join('<br>') || 'عنوان ديناميكي/غير مكتمل'} |`),
  '',
  '## النطاقات وعدد الملفات التي تستخدمها',
  '',
  '| النطاق | عدد الملفات |',
  '|---|---:|',
  ...[...domains.entries()]
    .sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]))
    .map(([host, filesForHost]) => `| \`${host}\` | ${filesForHost.size} |`),
  '',
  '> هذا التقرير ثابت ولا يرسل طلبات للخدمات ولا يكشف قيماً حساسة؛ المرحلة التالية تختبر مصادر عامة فقط بطلبات محدودة.',
  '',
];

fs.writeFileSync(path.join(projectRoot, 'EXTERNAL_API_AUDIT.md'), report.join('\n'));
console.log(`Scanned ${files.length} JS files; identified ${rows.length} external-API candidates across ${domains.size} static domains.`);
