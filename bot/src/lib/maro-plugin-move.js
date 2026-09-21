import crypto from "crypto";
import { execFile } from "child_process";
import fs from "fs/promises";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const PLUGIN_ROOT = "plugins";
const VALID_PLUGIN_EXTENSIONS = new Set([".js", ".mjs", ".cjs"]);
const PROTECTED_PARTS = new Set(["node_modules", ".git", "session", "auth", "database", "backup"]);
const CATEGORY_ALIASES = {
  "عام": "main",
  "عامة": "main",
  "عامه": "main",
  "العام": "main",
  "العامة": "main",
  "العامه": "main",
  "رئيسي": "main",
  "الرئيسية": "main",
  "الرئيسيه": "main",
  "main": "main",
  "مالك": "owner",
  "المالك": "owner",
  "owner": "owner",
};

function normalizeArabic(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ً-ٟ]/g, "")
    .replace(/[^\p{L}\p{N}._/-]+/gu, " ")
    .trim();
}

function ensureInsideRoot(root, candidate, { allowBackup = false } = {}) {
  const resolved = path.resolve(root, candidate);
  const relative = path.relative(root, resolved);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("المسار خارج مجلد البوت");
  if (relative.split(path.sep).some((part) => PROTECTED_PARTS.has(part) && (part !== "backup" || !allowBackup))) throw new Error("المسار المطلوب محمي من النقل التلقائي");
  return { resolved, relative };
}

function parseMoveRequest(rawText) {
  const raw = String(rawText || "").trim();
  const normalized = normalizeArabic(raw);
  const wantsMove = /(?:انقل|نقل|حو[ّ]?ل|غير\s+فئ|انقله)/u.test(normalized)
    && /(?:بلوقن|بلجن|اضافه|plugin|ملف)/u.test(normalized);
  if (!wantsMove) return null;

  const filePath = raw.match(/(plugins[\\/][^\s"'`]+\.(?:js|mjs|cjs))/i)?.[1];
  const namedPlugin = raw.match(/(?:بلوقن|بلجن|إضافة|اضافة|plugin)\s+[`"']?([^\s`"']+?)(?:\.(?:js|mjs|cjs))?[`"']?(?=\s+(?:من|الى|إلى|ل|واجعله|وجعله)|$)/iu)?.[1];
  const targetMatch = raw.match(/(?:إلى|الى|للفئة|للفئه|to)\s*(?:فئة|فئه|category)?\s*[`"']?([\p{L}\p{N}_-]+)[`"']?/iu);
  const targetRaw = normalizeArabic(targetMatch?.[1] || (/(?:عام|عامة|عاما)/u.test(normalized) ? "عام" : ""));
  const targetCategory = CATEGORY_ALIASES[targetRaw] || targetRaw;

  return {
    fileRef: filePath || namedPlugin || "",
    targetCategory,
    requestPublic: /(?:عام|عامة|عاما|للجميع|public)/u.test(normalized),
  };
}

async function listPluginFiles(root) {
  const pluginRoot = path.join(root, PLUGIN_ROOT);
  const categories = await fs.readdir(pluginRoot, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const category of categories) {
    if (!category.isDirectory() || category.name.startsWith(".") || PROTECTED_PARTS.has(category.name)) continue;
    const categoryPath = path.join(pluginRoot, category.name);
    const entries = await fs.readdir(categoryPath, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (entry.isFile() && VALID_PLUGIN_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        files.push(path.join(PLUGIN_ROOT, category.name, entry.name));
      }
    }
  }
  return files;
}

async function resolvePluginSource(root, fileRef) {
  const normalizedRef = String(fileRef || "").trim().replace(/\\/g, "/");
  if (!normalizedRef) throw new Error("لم تحدد اسم البلوقن المطلوب نقله");

  if (normalizedRef.startsWith(`${PLUGIN_ROOT}/`)) {
    const target = ensureInsideRoot(root, normalizedRef);
    const stat = await fs.stat(target.resolved).catch(() => null);
    if (!stat?.isFile() || !VALID_PLUGIN_EXTENSIONS.has(path.extname(target.resolved).toLowerCase())) {
      throw new Error("مسار البلوقن غير موجود أو لا يشير إلى ملف JavaScript");
    }
    return target;
  }

  const files = await listPluginFiles(root);
  const requested = normalizeArabic(path.basename(normalizedRef, path.extname(normalizedRef)));
  const matches = files.filter((relative) => normalizeArabic(path.basename(relative, path.extname(relative))) === requested);
  if (!matches.length) throw new Error(`لم أجد بلوقناً باسم «${fileRef}» داخل مجلد plugins`);
  if (matches.length > 1) throw new Error(`يوجد أكثر من بلوقن باسم «${fileRef}». اذكر المسار كاملاً مثل plugins/owner/اسم.js`);
  return ensureInsideRoot(root, matches[0]);
}

async function listPluginCategories(root) {
  const pluginRoot = path.join(root, PLUGIN_ROOT);
  const entries = await fs.readdir(pluginRoot, { withFileTypes: true }).catch(() => []);
  return new Set(entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name));
}

function replacePluginMetadata(source, targetCategory, makePublic) {
  const categoryPattern = /(\bcategory\s*:\s*["'])([^"']+)(["'])/g;
  const categoryMatches = [...source.matchAll(categoryPattern)];
  if (categoryMatches.length !== 1) throw new Error("تعذر تحديد حقل category واحد داخل pluginConfig بأمان");

  const sourceCategory = categoryMatches[0][2];
  let transformed = source.replace(categoryPattern, `$1${targetCategory}$3`);
  const changes = [`الفئة: ${sourceCategory} ← ${targetCategory}`];
  const ownerPattern = /(\bisOwner\s*:\s*)(true|false)/g;
  const ownerMatches = [...transformed.matchAll(ownerPattern)];
  if (ownerMatches.length > 1) throw new Error("تعذر تحديد حقل isOwner واحد داخل pluginConfig بأمان");
  if (ownerMatches.length === 1 && makePublic && ownerMatches[0][2] !== "false") {
    transformed = transformed.replace(ownerPattern, "$1false");
    changes.push("صلاحية المالك: true ← false");
  }
  if (!makePublic || ownerMatches.length === 1) return { sourceCategory, transformed, changes };

  const insertAt = categoryMatches[0].index + categoryMatches[0][0].length;
  transformed = `${transformed.slice(0, insertAt)},\n    isOwner: false${transformed.slice(insertAt)}`;
  changes.push("صلاحية المالك: أضيفت false");
  return { sourceCategory, transformed, changes };
}

async function verifyLocalImports(filePath, source) {
  const imports = [...source.matchAll(/from\s+["'](\.{1,2}\/[^"']+)["']/g)].map((match) => match[1]);
  for (const specifier of imports) {
    const candidate = path.resolve(path.dirname(filePath), specifier);
    const variants = [candidate, `${candidate}.js`, `${candidate}.mjs`, path.join(candidate, "index.js")];
    const found = await Promise.all(variants.map((item) => fs.access(item).then(() => true).catch(() => false)));
    if (!found.some(Boolean)) throw new Error(`استيراد محلي غير موجود بعد النقل: ${specifier}`);
  }
}

async function createPluginMovePlan(rawText, { root = process.cwd() } = {}) {
  const intent = parseMoveRequest(rawText);
  if (!intent) return null;
  if (!intent.targetCategory) throw new Error("لم أفهم الفئة الجديدة. اذكر مثلاً: إلى main أو اجعله عاماً");

  const categories = await listPluginCategories(root);
  if (!categories.has(intent.targetCategory)) throw new Error(`فئة البلوقن «${intent.targetCategory}» غير موجودة داخل plugins`);
  const source = await resolvePluginSource(root, intent.fileRef);
  const destinationRelative = path.join(PLUGIN_ROOT, intent.targetCategory, path.basename(source.resolved));
  const destination = ensureInsideRoot(root, destinationRelative);
  if (source.resolved === destination.resolved) throw new Error("البلوقن موجود بالفعل في الفئة المطلوبة");
  if (await fs.access(destination.resolved).then(() => true).catch(() => false)) throw new Error("يوجد ملف بالاسم نفسه في الفئة المطلوبة؛ لن أستبدله تلقائياً");

  const original = await fs.readFile(source.resolved, "utf8");
  const metadata = replacePluginMetadata(original, intent.targetCategory, intent.requestPublic || intent.targetCategory === "main");
  await verifyLocalImports(destination.resolved, metadata.transformed);

  return {
    source: source.relative,
    destination: destination.relative,
    sourcePath: source.resolved,
    destinationPath: destination.resolved,
    sourceHash: crypto.createHash("sha256").update(original).digest("hex"),
    transformedSource: metadata.transformed,
    sourceCategory: metadata.sourceCategory,
    targetCategory: intent.targetCategory,
    changes: metadata.changes,
    importsChecked: true,
  };
}

async function executePluginMovePlan(plan, { root = process.cwd() } = {}) {
  if (!plan?.sourcePath || !plan?.destinationPath || !plan?.transformedSource) throw new Error("خطة نقل البلوقن غير صالحة");
  ensureInsideRoot(root, plan.source);
  ensureInsideRoot(root, plan.destination);

  const original = await fs.readFile(plan.sourcePath, "utf8");
  const currentHash = crypto.createHash("sha256").update(original).digest("hex");
  if (currentHash !== plan.sourceHash) throw new Error("تغير البلوقن منذ التحليل؛ اطلب تحليله مجدداً أولاً");
  if (await fs.access(plan.destinationPath).then(() => true).catch(() => false)) throw new Error("ظهر ملف بالاسم نفسه في الوجهة؛ ألغيت النقل حمايةً للملف الموجود");

  const backupDir = path.join(root, "backup", "ai-plugin-move");
  await fs.mkdir(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `${path.basename(plan.sourcePath)}.${Date.now()}.bak`);
  const tempPath = path.join(path.dirname(plan.destinationPath), `.${path.basename(plan.destinationPath)}.${Date.now()}.move.tmp.js`);
  let moved = false;
  try {
    await fs.writeFile(backupPath, original, "utf8");
    await fs.writeFile(tempPath, plan.transformedSource, "utf8");
    await execFileAsync(process.execPath, ["--check", tempPath], { timeout: 30_000 });
    await verifyLocalImports(plan.destinationPath, plan.transformedSource);
    await fs.rename(tempPath, plan.destinationPath);
    moved = true;
    await fs.rm(plan.sourcePath);
    return {
      source: plan.source,
      destination: plan.destination,
      backup: path.relative(root, backupPath),
      checks: ["فحص صياغة JavaScript", "فحص الاستيرادات المحلية"],
    };
  } catch (error) {
    await fs.rm(tempPath, { force: true }).catch(() => {});
    if (moved) await fs.rm(plan.destinationPath, { force: true }).catch(() => {});
    throw new Error(`فشل نقل البلوقن؛ لم تُترك نسخة منقولة غير مؤكدة. ${error.message}`);
  }
}

async function testPluginFile(fileRef, { root = process.cwd() } = {}) {
  const target = await resolvePluginSource(root, fileRef);
  const source = await fs.readFile(target.resolved, "utf8");
  await execFileAsync(process.execPath, ["--check", target.resolved], { timeout: 30_000 });
  await verifyLocalImports(target.resolved, source);
  const category = source.match(/\bcategory\s*:\s*["']([^"']+)["']/)?.[1] || "غير محددة";
  const ownerOnly = source.match(/\bisOwner\s*:\s*(true|false)/)?.[1] || "غير محدد";
  return { file: target.relative, category, ownerOnly, size: Buffer.byteLength(source, "utf8") };
}

async function rollbackPluginMove(decision, { root = process.cwd() } = {}) {
  const source = ensureInsideRoot(root, decision?.source || "");
  const destination = ensureInsideRoot(root, decision?.destination || "");
  const backup = ensureInsideRoot(root, decision?.backup || "", { allowBackup: true });
  const backupSource = await fs.readFile(backup.resolved, "utf8");
  if (await fs.access(source.resolved).then(() => true).catch(() => false)) throw new Error("مسار المصدر موجود بالفعل؛ لن أستبدله تلقائياً");
  if (!await fs.access(destination.resolved).then(() => true).catch(() => false)) throw new Error("نسخة البلوقن المنقولة غير موجودة في المسار المسجل");
  const temp = path.join(path.dirname(source.resolved), `.${path.basename(source.resolved)}.${Date.now()}.rollback.tmp.js`);
  try {
    await fs.writeFile(temp, backupSource, "utf8");
    await execFileAsync(process.execPath, ["--check", temp], { timeout: 30_000 });
    await verifyLocalImports(source.resolved, backupSource);
    await fs.rename(temp, source.resolved);
    await fs.rm(destination.resolved);
    return { source: source.relative, removed: destination.relative, backup: backup.relative };
  } catch (error) {
    await fs.rm(temp, { force: true }).catch(() => {});
    throw new Error(`فشل التراجع؛ لم أستبدل أي ملف قائم. ${error.message}`);
  }
}

function formatPluginMovePlan(plan, confirmationId) {
  return `📦 *خطة نقل بلوقن آمنة*\n\n• المصدر: \`${plan.source}\`\n• الوجهة: \`${plan.destination}\`\n• التعديلات: ${plan.changes.map((item) => `\n  - ${item}`).join("")}\n• فحص الاستيرادات: ${plan.importsChecked ? "سليم ✅" : "غير متاح"}\n\n⚠️ سيُنشأ ملف احتياطي، ثم يُفحص الكود والاستيرادات قبل حذف المصدر.\nللتأكيد اكتب: \`أكد ${confirmationId}\`\n> Tarboo Bot`;
}

export { createPluginMovePlan, executePluginMovePlan, formatPluginMovePlan, parseMoveRequest, rollbackPluginMove, testPluginFile };
