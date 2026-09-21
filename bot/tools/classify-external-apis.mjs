import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const roots = ["src/scraper", "plugins"];
const urlPattern = /https?:\/\/[^\s"'`)<>{}\\]+/g;
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target);
    if (entry.isFile() && entry.name.endsWith(".js")) files.push(target);
  }
}

function cleanUrl(value) {
  return value.replace(/[;,.:]+$/, "");
}

function categoryFor(content, host) {
  const keyEvidence = /process\.env\.|api[_-]?key|authorization|bearer|x-api-key|client_secret|token/i.test(content);
  const costlyEvidence = /(openai|gemini|claude|groq|deepseek|nvidia|imagegen|imagehd|upscale|video|convert|download|tts|speech|upload)/i.test(`${host} ${content}`);
  if (keyEvidence) return { label: "يحتاج مفتاح/اعتماد", evidence: "توجد ترويسات اعتماد أو متغيرات بيئة أو حقل مفتاح في الملف" };
  if (costlyEvidence) return { label: "حساس أو محتمل التكلفة", evidence: "الخدمة تتعلق بالذكاء الاصطناعي أو الوسائط أو التحويل أو الرفع" };
  return { label: "عام بلا مفتاح ظاهر", evidence: "لا يظهر اعتماد في الملف؛ يظل خاضعاً للحدود وشروط المزود" };
}

for (const sourceRoot of roots) walk(path.join(root, sourceRoot));
const byHost = new Map();

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  for (const raw of content.match(urlPattern) || []) {
    try {
      const url = cleanUrl(raw);
      const host = new URL(url).host;
      if (!host || host === "..." || /[$`{}]/.test(host)) continue;
      if (!byHost.has(host)) byHost.set(host, { files: new Set(), category: categoryFor(content, host) });
      const item = byHost.get(host);
      item.files.add(path.relative(root, file));
      const newer = categoryFor(content, host);
      if (newer.label === "يحتاج مفتاح/اعتماد" || (newer.label === "حساس أو محتمل التكلفة" && item.category.label === "عام بلا مفتاح ظاهر")) item.category = newer;
    } catch {
      // Dynamic or incomplete URLs cannot be classified by host.
    }
  }
}

const entries = [...byHost.entries()].sort(([a], [b]) => a.localeCompare(b));
const counts = entries.reduce((result, [, value]) => {
  result[value.category.label] = (result[value.category.label] || 0) + 1;
  return result;
}, {});
const report = [
  "# تصنيف مصادر API الخارجية لـ Tarboo Bot",
  "",
  "> التصنيف آلي قائم على دليل داخل الكود: اعتماد/متغير بيئة، أو طبيعة خدمة AI/وسائط/رفع/تحويل. لا يعني وصف «عام» ضمان توافر الخدمة أو سماحها بكل حجم استخدام.",
  "",
  "| الفئة | عدد النطاقات |",
  "|---|---:|",
  ...Object.entries(counts).map(([label, count]) => `| ${label} | ${count} |`),
  "",
  "| النطاق | التصنيف | الدليل | ملفات الاستعمال |",
  "|---|---|---|---|",
  ...entries.map(([host, value]) => `| \`${host}\` | ${value.category.label} | ${value.category.evidence} | ${[...value.files].sort().map((file) => `\`${file}\``).join("<br>")} |`),
  "",
  "## ضوابط تشغيل",
  "",
  "لا تُخزّن مفاتيح أو Bearer tokens داخل ملفات المشروع. تُضبط الخدمات التي تتطلب اعتماداً عبر متغيرات بيئة في منصة الاستضافة فقط، ويجب أن يقتصر الاختبار الحي على GET أو مسارات اختبار غير مؤثرة ما لم يوافق المالك صراحة على عملية خارجية.",
  "",
];

fs.writeFileSync(path.join(root, "EXTERNAL_API_CLASSIFICATION.md"), report.join("\n"));
console.log(`Classified ${entries.length} static domains.`);
