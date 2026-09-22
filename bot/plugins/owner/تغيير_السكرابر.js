// تغيير السكرابر - أمر لتغيير كود السكرابر الموجود في src/scraper

import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { hotReloadPlugin } from "../../src/lib/maro-plugins.js";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "تغيير_السكرابر",
  alias: ["gantiscraper"],
  category: "owner",
  description: "تغيير كود السكرابر الموجود في src/scraper",
  usage: ".تغيير_السكرابر [اسم_الملف]",
  example: ".تغيير_السكرابر ig",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

const SCRAPER_DIR = path.join(process.cwd(), "src", "scraper");
const PLUGINS_DIR = path.join(process.cwd(), "plugins");

function listScrapers() {
  if (!fs.existsSync(SCRAPER_DIR)) return [];
  return fs
    .readdirSync(SCRAPER_DIR)
    .filter((f) => f.endsWith(".js"))
    .map((f) => f.replace(".js", ""));
}

function findScraperFile(name) {
  const files = fs.readdirSync(SCRAPER_DIR).filter((f) => f.endsWith(".js"));

  for (const file of files) {
    if (file.replace(".js", "").toLowerCase() === name.toLowerCase()) {
      return { file, path: path.join(SCRAPER_DIR, file) };
    }
  }
  return null;
}

function walkJsFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkJsFiles(entryPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(entryPath);
    }
  }

  return files;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findDependentPluginFiles(scraperName) {
  const escapedName = escapeRegex(scraperName);
  const patterns = [
    new RegExp(`src[\\/]scraper[\\/]${escapedName}\\.js`, "i"),
    new RegExp(`scraper[\\/].*${escapedName}\\.js`, "i"),
  ];

  return walkJsFiles(PLUGINS_DIR).filter((filePath) => {
    const content = fs.readFileSync(filePath, "utf8");
    return patterns.some((pattern) => pattern.test(content));
  });
}

async function hotReloadScraperModule(filePath) {
  const fileUrl = pathToFileURL(path.resolve(filePath)).href;
  await import(`${fileUrl}?t=${Date.now()}`);
  return { success: true };
}

async function hotReloadDependentPlugins(scraperName) {
  const dependentFiles = findDependentPluginFiles(scraperName);
  const results = [];

  for (const dependentFile of dependentFiles) {
    const reloadResult = await hotReloadPlugin(dependentFile);
    results.push({
      file: path.relative(process.cwd(), dependentFile),
      success: !!reloadResult?.success,
      error: reloadResult?.error || null,
    });
  }

  return results;
}

async function handler(m, { sock }) {
  const quoted = m.quoted;
  const args = m.args;

  if (args[0]?.toLowerCase() === "list") {
    const scrapers = listScrapers();
    if (!scrapers.length) {
      return m.reply(`📂 مجلد src/scraper فارغ`);
    }

    let text = `📂 *قائمة السكرابر*\n\n` + `╭─〔 *src/scraper* 〕───⬣\n`;

    scrapers.forEach((s, i) => {
      const stat = fs.statSync(path.join(SCRAPER_DIR, `${s}.js`));
      text += `│ ${i + 1}. \`${s}.js\` (${(stat.size / 1024).toFixed(1)} كيلوبايت)\n`;
    });

    text +=
      `╰───────⬡\n\n` +
      `الإجمالي: ${scrapers.length} سكرابر\n\n` +
      `> استخدم \`${m.prefix}تغيير_السكرابر <اسم>\` مع رد على الكود`;

    return m.reply(text);
  }

  if (!quoted) {
    return m.reply(
      `🔄 *تغيير السكرابر*\n\n` +
        `رد على كود السكرابر الجديد مع عنوان:\n` +
        `\`${m.prefix}تغيير_السكرابر\` - كشف تلقائي من export\n` +
        `\`${m.prefix}تغيير_السكرابر اسم_الملف\` - اسم ملف مخصص\n\n` +
        `📋 *عرض قائمة السكرابر:*\n` +
        `\`${m.prefix}تغيير_السكرابر قائمة\`\n\n` +
        `⚠️ *تحذير:*\nسيتم عمل نسخة احتياطية من الكود القديم قبل الاستبدال`,
    );
  }

  let code = quoted.text || quoted.body || "";

  if (
    quoted.mimetype === "application/javascript" ||
    quoted.filename?.endsWith(".js")
  ) {
    try {
      code = (await quoted.download()).toString();
    } catch (e) {
      return m.reply(`❌ *فشل*\n\nفشل تحميل الملف`);
    }
  }

  if (!code || code.length < 30) {
    return m.reply(`❌ *فشل*\n\nالكود قصير جداً أو غير صالح`);
  }

  const hasExport =
    code.includes("module.exports") ||
    code.includes("export ") ||
    code.includes("export default") ||
    code.includes("export {");

  if (!hasExport) {
    return m.reply(
      `❌ *فشل*\n\nالكود ليس بصيغة سكرابر صالحة\nيجب أن يحتوي على export`,
    );
  }

  let fileName = args[0];

  if (!fileName) {
    const defaultMatch = code.match(
      /export\s+default\s+(?:async\s+)?function\s+(\w+)|export\s+default\s+(\w+)/,
    );
    if (defaultMatch) {
      fileName = defaultMatch[1] || defaultMatch[2];
    } else {
      const namedExport = code.match(
        /export\s+(?:async\s+)?function\s+(\w+)|export\s+const\s+(\w+)\s*=/,
      );
      if (namedExport) {
        fileName = namedExport[1] || namedExport[2];
      }
    }
  }

  if (!fileName) {
    return m.reply(
      `❌ *فشل*\n\nلا يمكن اكتشاف اسم السكرابر\nاستخدم \`${m.prefix}تغيير_السكرابر <اسم_الملف>\``,
    );
  }

  fileName = fileName.toLowerCase().replace(/[^a-z0-9\-_]/g, "");

  if (!fileName) {
    return m.reply(`❌ *فشل*\n\nاسم الملف غير صالح`);
  }

  await m.react("🕕");

  try {
    if (!fs.existsSync(SCRAPER_DIR)) {
      fs.mkdirSync(SCRAPER_DIR, { recursive: true });
    }

    const existing = findScraperFile(fileName);
    let filePath = path.join(SCRAPER_DIR, `${fileName}.js`);
    let isNewFile = !existing;
    let backupPath = null;
    let oldSize = 0;

    if (existing) {
      filePath = existing.path;
      oldSize = fs.statSync(filePath).size;

      const backupDir = path.join(process.cwd(), "backup", "scraper");
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);
      backupPath = path.join(backupDir, `${fileName}_${timestamp}.js`);
      fs.copyFileSync(filePath, backupPath);
    }

    fs.writeFileSync(filePath, code);

    let scraperReload = { success: false };
    let pluginReloads = [];

    try {
      scraperReload = await hotReloadScraperModule(filePath);
      pluginReloads = await hotReloadDependentPlugins(fileName);
    } catch (reloadError) {
      if (backupPath && fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, filePath);
      } else if (isNewFile && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw reloadError;
    }

    await m.react("✅");

    let replyText =
      `✅ *تم ${isNewFile ? "إضافة" : "تغيير"} السكرابر*\n\n` +
      `╭─〔 *التفاصيل* 〕───⬡\n` +
      `│ الملف: \`${fileName}.js\`\n` +
      `│ المجلد: \`src/scraper\`\n` +
      `│ الحجم: \`${code.length} بايت\`\n`;

    if (!isNewFile) {
      replyText += `│ الحجم القديم: \`${oldSize} بايت\`\n`;
    }

    replyText += `╰───────⬡\n\n`;

    if (backupPath) {
      const relBackup = path.relative(process.cwd(), backupPath);
      replyText += `💾 *النسخة الاحتياطية:*\n\`${relBackup}\`\n\n`;
    }

    const reloadSuccess = pluginReloads.filter((item) => item.success);
    const reloadFailed = pluginReloads.filter((item) => !item.success);

    replyText +=
      `🔄 *إعادة التحميل:*\n` +
      `- السكرابر: ${scraperReload.success ? "✅ نجاح" : "⚠️ قيد الانتظار"}\n` +
      `- البلوقنات المكتشفة: ${pluginReloads.length}\n` +
      `- البلوقنات المعاد تحميلها بنجاح: ${reloadSuccess.length}\n` +
      `- البلوقنات الفاشلة في إعادة التحميل: ${reloadFailed.length}\n\n`;

    if (reloadSuccess.length) {
      replyText += `✅ *البلوقنات المعاد تحميلها:*\n`;
      replyText += reloadSuccess
        .slice(0, 10)
        .map((item) => `- \`${item.file}\``)
        .join("\n");
      replyText += `\n\n`;
    }

    if (reloadFailed.length) {
      replyText += `⚠️ *البلوقنات الفاشلة في إعادة التحميل:*\n`;
      replyText += reloadFailed
        .slice(0, 10)
        .map(
          (item) => `- \`${item.file}\`${item.error ? ` (${item.error})` : ""}`,
        )
        .join("\n");
      replyText += `\n\n`;
    }

    if (!pluginReloads.length) {
      replyText += `ℹ️ لا توجد بلوقنات تستورد هذا السكرابر مباشرة.\n\n`;
    }

    if (reloadFailed.length > 0) {
      replyText += `⚠️ فشل جزء من إعادة التحميل، قد تحتاج إلى إعادة تشغيل البوت`;
    } else {
      replyText += `السكرابر نشط وجاهز للاستخدام!`;
    }

    return m.reply(replyText);
  } catch (error) {
    await m.react("☢");
    await m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };