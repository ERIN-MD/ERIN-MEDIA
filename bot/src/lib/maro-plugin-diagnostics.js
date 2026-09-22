import fs from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const failures = [];
const MAX_FAILURES = 80;

async function checkSyntax(file) {
  try {
    await execFileAsync(process.execPath, ["--check", file]);
    return { ok: true, error: "" };
  } catch (error) {
    return { ok: false, error: String(error.stderr || error.message || "فشل فحص الصياغة") };
  }
}

function diagnosePluginError(filePath, error) {
  const message = String(error?.message || error || "خطأ غير معروف");
  const missing = message.match(/Cannot find module ['"]([^'"]+)['"]/i)?.[1] || "";
  const legacy = /(?:ourin-|ourin\/|ourin_)/i.test(missing);
  return {
    filePath, message, missing,
    cause: missing ? `البلوقن يستورد ملفاً غير موجود: ${missing}` : "فشل تحميل البلوقن أثناء الاستيراد.",
    suggestion: legacy ? "يبدو أن الاستيراد باسم ourin قديم؛ بدّله إلى ملف maro المقابل بعد التحقق من وجوده." : "تحقق من مسار الاستيراد ووجود الملف في src أو plugins.",
    createdAt: Date.now(),
  };
}

function recordPluginLoadFailure(filePath, error) {
  failures.push(diagnosePluginError(filePath, error));
  if (failures.length > MAX_FAILURES) failures.splice(0, failures.length - MAX_FAILURES);
}

function getPluginLoadFailures() { return failures.map((item) => ({ ...item })); }

function formatPluginDiagnostics() {
  if (!failures.length) return "✦ *تشخيص البلوقنات*\n\n> لا توجد أخطاء تحميل مسجلة في الجلسة الحالية.\n> Tarboo Bot";
  const items = failures.slice(-12).map((item, index) => `*${index + 1}.* \`${item.filePath}\`\n> السبب: ${item.cause}\n> الحل: ${item.suggestion}`).join("\n\n");
  return `✦ *تشخيص أخطاء البلوقنات*\n\n> الأخطاء المسجلة: ${failures.length}\n\n${items}\n\n> اكتب «أصلح استيرادات البلوقنات» لمراجعة الإصلاحات الآمنة.\n> Tarboo Bot`;
}

async function repairLegacyImports({ root = process.cwd() } = {}) {
  const repairs = [];
  for (const item of failures) {
    if (!item.missing || !/ourin/i.test(item.missing)) continue;
    const file = path.resolve(root, item.filePath);
    const source = await fs.readFile(file, "utf8").catch(() => null);
    if (!source) continue;
    const replacement = item.missing.replace(/ourin/gi, "maro");
    const target = path.resolve(path.dirname(file), replacement);
    const targetExists = await fs.access(target).then(() => true).catch(() => false);
    if (!targetExists || !source.includes(item.missing)) continue;
    const backupDir = path.join(root, "backup", "plugin-import-repairs");
    await fs.mkdir(backupDir, { recursive: true });
    const backup = path.join(backupDir, `${path.basename(file)}.${Date.now()}.bak`);
    await fs.writeFile(backup, source, "utf8");
    const updated = source.replaceAll(item.missing, replacement);
    await fs.writeFile(file, updated, "utf8");
    const syntax = await checkSyntax(file);
    if (!syntax.ok) {
      await fs.writeFile(file, source, "utf8");
      continue;
    }
    repairs.push({ file: item.filePath, from: item.missing, to: replacement, backup: path.relative(root, backup), syntaxChecked: true });
  }
  return repairs;
}

export { recordPluginLoadFailure, getPluginLoadFailures, formatPluginDiagnostics, diagnosePluginError, repairLegacyImports, checkSyntax };
