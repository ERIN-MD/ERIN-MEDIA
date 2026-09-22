// تغيير الكود - أمر لتغيير كود البلوقن الموجود

import fs from "fs";
import path from "path";
import { hotReloadPlugin } from "../../src/lib/maro-plugins.js";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "تغيير_الكود",
  alias: ["ganticode"],
  category: "owner",
  description: "تغيير كود البلوقن الموجود",
  usage: ".تغيير_الكود [اسم_الملف] [المجلد]",
  example: ".تغيير_الكود ping رئيسي",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

function extractPluginInfo(code) {
  const info = { name: null, category: null };
  const nameMatch = code.match(/name:\s*['"`]([^'"`]+)['"`]/i);
  if (nameMatch) info.name = nameMatch[1];
  const categoryMatch = code.match(/category:\s*['"`]([^'"`]+)['"`]/i);
  if (categoryMatch) info.category = categoryMatch[1];
  return info;
}

function findPluginFile(pluginsDir, name) {
  const folders = fs
    .readdirSync(pluginsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const folder of folders) {
    const folderPath = path.join(pluginsDir, folder);
    const files = fs.readdirSync(folderPath).filter((f) => f.endsWith(".js"));

    for (const file of files) {
      const baseName = file.replace(".js", "");
      if (baseName.toLowerCase() === name.toLowerCase()) {
        return { folder, file, path: path.join(folderPath, file) };
      }
    }
  }

  return null;
}

async function handler(m, { sock }) {
  const quoted = m.quoted;

  if (!quoted) {
    return m.reply(
      `🔄 *تغيير الكود*\n\n` +
        `رد على كود البلوقن الجديد مع عنوان:\n` +
        `\`${m.prefix}تغيير_الكود\` - كشف تلقائي\n` +
        `\`${m.prefix}تغيير_الكود اسم_الملف\` - اسم مخصص\n` +
        `\`${m.prefix}تغيير_الكود اسم_الملف مجلد\` - اسم + مجلد مخصص\n\n` +
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

  if (!code || code.length < 50) {
    return m.reply(`❌ *فشل*\n\nالكود قصير جداً أو غير صالح`);
  }

  const hasExport = code.includes("module.exports") || code.includes("export ");
  const hasConfig = code.includes("pluginConfig") || code.includes("config");
  if (!hasExport || !hasConfig) {
    return m.reply(
      `❌ *فشل*\n\nالكود ليس بصيغة بلوقن صالحة\nيجب أن يحتوي على export و config`,
    );
  }

  const extracted = extractPluginInfo(code);
  const args = m.args;

  let fileName = args[0] || extracted.name;
  let folderName = args[1] || extracted.category;

  if (!fileName) {
    return m.reply(
      `❌ *فشل*\n\nلا يمكن اكتشاف اسم البلوقن\nاستخدم \`${m.prefix}تغيير_الكود <اسم_الملف>\``,
    );
  }

  fileName = fileName.toLowerCase().replace(/[^a-z0-9\-_]/g, "");

  if (!fileName) {
    return m.reply(`❌ *فشل*\n\nاسم الملف غير صالح`);
  }

  await m.react("🕕");

  try {
    const pluginsDir = path.join(process.cwd(), "plugins");
    const existing = findPluginFile(pluginsDir, fileName);

    let filePath;
    let targetFolder;
    let isNewFile = false;
    let backupPath = null;
    let oldSize = 0;

    if (existing) {
      filePath = existing.path;
      targetFolder = existing.folder;
      oldSize = fs.statSync(filePath).size;

      const backupDir = path.join(process.cwd(), "backup", "plugins");
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);
      backupPath = path.join(backupDir, `${fileName}_${timestamp}.js`);
      fs.copyFileSync(filePath, backupPath);
    } else {
      if (!folderName) folderName = "أخرى";
      folderName = folderName.toLowerCase().replace(/[^a-z0-9\-_]/g, "");

      targetFolder = folderName;
      const folderPath = path.join(pluginsDir, targetFolder);

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      filePath = path.join(folderPath, `${fileName}.js`);
      isNewFile = true;
    }

    fs.writeFileSync(filePath, code);

    let reloadResult = { success: false };
    try {
      reloadResult = (await hotReloadPlugin(filePath)) || { success: true };
    } catch {}

    await m.react("✅");

    let replyText =
      `✅ *تم ${isNewFile ? "إضافة" : "تغيير"} الكود*\n\n` +
      `╭─〔 *التفاصيل* 〕───⬣\n` +
      `│ الملف: \`${fileName}.js\`\n` +
      `│ المجلد: \`${targetFolder}\`\n` +
      `│ الحجم: \`${code.length} بايت\`\n`;

    if (!isNewFile) {
      replyText += `│ الحجم القديم: \`${oldSize} بايت\`\n`;
    }

    replyText +=
      ` │ 🔄 إعادة التحميل: ${reloadResult.success ? "✅ نجاح" : "⚠️ قيد الانتظار"}\n` +
      `╰───────⬣\n\n`;

    if (backupPath) {
      const relBackup = path.relative(process.cwd(), backupPath);
      replyText += `💾 *النسخة الاحتياطية:*\n\`${relBackup}\`\n\n`;
    }

    replyText += `البلوقن نشط وجاهز للاستخدام!`;

    return m.reply(replyText);
  } catch (error) {
    await m.react("☢");
    await m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };