import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const pendingPluginDrafts = new Map();
const SAFE_CATEGORIES = new Set(["ai", "tools", "fun", "downloader", "group", "sticker", "canvas", "search"]);
const FORBIDDEN_PLUGIN_CODE = /(?:child_process|exec\s*\(|spawn\s*\(|eval\s*\(|new\s+Function|process\.env|fs\.rm|rmSync|unlinkSync|fetch\s*\(|axios\.(?:post|put|delete))/i;

function slugifyPluginName(value) {
  const name = String(value || "").normalize("NFKD").replace(/[\u064B-\u065F\u0670]/g, "").replace(/[^\p{L}\p{N}_-]+/gu, "_").replace(/^_+|_+$/g, "").slice(0, 64);
  if (!name) throw new Error("اسم البلوقن غير صالح.");
  return name;
}

function inferPluginCategory(request = "") {
  const text = String(request).toLowerCase();
  if (/(تحميل|تنزيل|يوتيوب|تيكتوك|spotify|فيديو)/.test(text)) return "downloader";
  if (/(ملصق|ستيكر|sticker|برات)/.test(text)) return "sticker";
  if (/(صورة|كانفاس|avatar|بطاقة)/.test(text)) return "canvas";
  if (/(بحث|search|ويكيبيديا)/.test(text)) return "search";
  if (/(مجموعة|ترحيب|منع|مشرف)/.test(text)) return "group";
  if (/(لعبة|حظ|fun)/.test(text)) return "fun";
  if (/(اداة|تحويل|فحص|صوت)/.test(text)) return "tools";
  return "ai";
}

function parsePluginBrief({ name, command, description } = {}) {
  const request = `${name || ""} ${command || ""} ${description || ""}`.toLowerCase();
  const noInput = /(بدون نص|لا يحتاج نص|تشغيل فقط)/.test(request);
  const echo = /(كرر|اعادة|أعد|يعيد)/.test(request);
  const welcome = /(ترحيب|رحب)/.test(request);
  const status = /(حالة|فحص|تشخيص)/.test(request);
  const quoted = String(description || "").match(/(?:يقول|يرد|رسالة)\s*[:：]\s*(.+)$/i)?.[1]?.trim();
  const response = quoted || (welcome ? "أهلاً بك، نرحب بك في المجموعة." : status ? "حالة البلوقن: يعمل بشكل طبيعي." : echo ? "إعادة النص:" : "تم تنفيذ طلبك بنجاح.");
  return { needsInput: !noInput && !welcome && !status, echo, response: response.slice(0, 200) };
}

function parseNaturalPluginRequest(request = "") {
  const text = String(request || "").trim();
  if (!text) throw new Error("اكتب وصفاً واضحاً للأمر المطلوب");
  const named = text.match(/(?:باسم|اسمه|اسمها)\s+([\p{L}\p{N}_-]+)/iu)?.[1];
  const quoted = text.match(/["'«]([^"'»]{2,64})["'»]/u)?.[1];
  const firstWords = text.replace(/^(?:امر|أمر|بلوقن|plugin)\s*/iu, "").split(/\s+/).slice(0, 2).join("_");
  const name = slugifyPluginName(named || quoted || firstWords || "بلوقن");
  const category = inferPluginCategory(text);
  return { name, command: name, category, description: text.slice(0, 400) };
}

function buildPluginSkeleton({ name, command, category = "ai", description = "بلوقن جديد من Tarboo Bot AI Studio" } = {}) {
  const safeName = slugifyPluginName(name || command || "بلوقن");
  const safeCommand = slugifyPluginName(command || safeName);
  const safeCategory = SAFE_CATEGORIES.has(category) ? category : inferPluginCategory(`${name} ${description}`);
  const brief = parsePluginBrief({ name, command, description });
  const response = JSON.stringify(brief.response);
  const inputRule = brief.needsInput ? `if (!input) return m.reply("✦ اكتب نصاً بعد الأمر.\\n> مثال: .${safeCommand} مرحباً\\n> Tarboo Bot");` : "";
  const output = brief.echo ? `${response} + " " + input` : response;
  return `const pluginConfig = {
  name: "${safeCommand}", alias: [], category: "${safeCategory}",
  description: "${String(description).replaceAll('"', "'").slice(0, 160)}",
  usage: ".${safeCommand} <نص>", example: ".${safeCommand} مرحباً",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 5, energi: 0, isEnabled: true,
};

async function handler(m) {
  const input = (m.text || "").trim();
  ${inputRule}
  return m.reply("✦ *${safeCommand}*\\n\\n> " + (${output}) + "\\n\\n> Tarboo Bot");
}

export { pluginConfig as config, handler };
`;
}

function adaptExternalPluginSource(source, { name, category } = {}) {
  const safeName = slugifyPluginName(name || "بلوقن");
  const safeCategory = SAFE_CATEGORIES.has(category) ? category : inferPluginCategory(name);
  let adapted = String(source || "").replace(/\r\n/g, "\n");
  adapted = adapted.replace(/(name\s*:\s*)["'][^"']+["']/, `$1"${safeName}"`);
  adapted = adapted.replace(/(category\s*:\s*)["'][^"']+["']/, `$1"${safeCategory}"`);
  return adapted;
}

function createLineDiff(before, after, limit = 36) {
  if (before === after) return "لا توجد تغييرات نصية؛ المسودة متوافقة كما هي.";
  const oldLines = String(before || "").split("\n");
  const newLines = String(after || "").split("\n");
  const result = [];
  for (let i = 0; i < Math.max(oldLines.length, newLines.length) && result.length < limit; i += 1) {
    if (oldLines[i] === newLines[i]) continue;
    if (oldLines[i] !== undefined) result.push(`- ${oldLines[i]}`);
    if (newLines[i] !== undefined && result.length < limit) result.push(`+ ${newLines[i]}`);
  }
  return result.join("\n") || "لا توجد تغييرات مرئية.";
}

async function validatePluginSource(source) {
  const value = String(source || "");
  if (!value.includes("pluginConfig") || !value.includes("handler")) throw new Error("المسودة لا تطابق بنية بلوقن Tarboo Bot.");
  if (value.length > 64 * 1024) throw new Error("المسودة أكبر من الحد الآمن.");
  if (FORBIDDEN_PLUGIN_CODE.test(value)) throw new Error("المسودة تحتوي على عملية حساسة تحتاج مراجعة يدوية.");
  const temp = path.join("/tmp", `marobot-plugin-${crypto.randomBytes(6).toString("hex")}.js`);
  await fs.writeFile(temp, value, "utf8");
  try { await execFileAsync(process.execPath, ["--check", temp], { timeout: 30000 }); } finally { await fs.rm(temp, { force: true }); }
  return true;
}

async function stagePluginDraft(ownerJid, { name, command, category, description, source } = {}, { root = process.cwd() } = {}) {
  const safeName = slugifyPluginName(name || command);
  const safeCategory = SAFE_CATEGORIES.has(category) ? category : inferPluginCategory(`${name} ${description || ""}`);
  const originalSource = source ? String(source) : "";
  const content = source ? adaptExternalPluginSource(originalSource, { name: safeName, category: safeCategory }) : buildPluginSkeleton({ name: safeName, command, category: safeCategory, description });
  await validatePluginSource(content);
  let sourceBackup = null;
  if (source) {
    const backupDir = path.join(root, "backup", "ai-studio-imports");
    await fs.mkdir(backupDir, { recursive: true });
    const backupPath = path.join(backupDir, `${safeName}.${Date.now()}.source.js`);
    await fs.writeFile(backupPath, originalSource, "utf8");
    sourceBackup = path.relative(root, backupPath);
  }
  const id = `PLUG-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
  const draft = { id, ownerJid, name: safeName, category: safeCategory, source: content, sourceBackup, diff: source ? createLineDiff(originalSource, content) : "مسودة جديدة؛ لا يوجد مصدر سابق للمقارنة.", createdAt: Date.now() };
  pendingPluginDrafts.set(id, draft);
  return draft;
}

async function approvePluginDraft(ownerJid, id, { root = process.cwd() } = {}) {
  const draft = pendingPluginDrafts.get(String(id || "").trim());
  if (!draft || draft.ownerJid !== ownerJid) throw new Error("مسودة البلوقن غير موجودة أو لا تخص المالك.");
  const directory = path.join(root, "plugins", draft.category);
  const target = path.join(directory, `${draft.name}.js`);
  await fs.mkdir(directory, { recursive: true });
  if (await fs.stat(target).then(() => true).catch(() => false)) throw new Error("يوجد بلوقن بالاسم نفسه؛ غيّر الاسم قبل الموافقة.");
  await fs.writeFile(target, draft.source, "utf8");
  pendingPluginDrafts.delete(draft.id);
  return { file: path.relative(root, target), category: draft.category };
}

function getPendingPluginDrafts(ownerJid) { return [...pendingPluginDrafts.values()].filter((draft) => draft.ownerJid === ownerJid).map((draft) => ({ ...draft })); }

function formatPluginDraftPreview(draft) {
  const lines = String(draft?.source || "").split("\n").slice(0, 16).join("\n");
  const backupLine = draft?.sourceBackup ? `\n> نسخة المصدر: \`${draft.sourceBackup}\`` : "";
  return `📄 *معاينة المسودة*\n\n> الملف المقترح: \`plugins/${draft.category}/${draft.name}.js\`\n> الفئة: ${draft.category}\n> حالة الفحص: ✅ صياغة JavaScript سليمة${backupLine}\n\n*الفرق المقترح:*\n\`\`\`diff\n${String(draft?.diff || "").slice(0, 2200)}\n\`\`\`\n\n*بداية المصدر:*\n\`\`\`js\n${lines}\n\`\`\`\n\n> لن يضاف أو يستبدل أي ملف قبل موافقة المالك.`;
}

export { SAFE_CATEGORIES, slugifyPluginName, inferPluginCategory, parsePluginBrief, parseNaturalPluginRequest, buildPluginSkeleton, adaptExternalPluginSource, createLineDiff, validatePluginSource, stagePluginDraft, approvePluginDraft, getPendingPluginDrafts, formatPluginDraftPreview };
