import fs from "fs";
import path from "path";
import { hotReloadPlugin, unloadPlugin } from "../../src/lib/maro-plugins.js";
import { prepareWAMessageMedia, generateWAMessageFromContent } from "maro";
import { saluranCtx } from "../../src/lib/maro-context.js";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "بلوقن",
  alias: ["plugin", "plug", "بلوق"],
  category: "owner",
  description: "إدارة البلوقنات - إضافة، حذف، عرض ونسخ، فحص",
  usage: ".بلوقن <إجراء> <اسم/ملف>",
  example: ".بلوقن عرض menu",
  isOwner: true, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 3, energi: 0, isEnabled: true
};

function extractPluginInfo(code) {
  const info = { name: null, category: null };
  const nameMatch = code.match(/name:\s*['"`]([^'"`]+)['"]/i);
  if (nameMatch) info.name = nameMatch[1];
  const categoryMatch = code.match(/category:\s*['"`]([^'"`]+)['"]/i);
  if (categoryMatch) info.category = categoryMatch[1];
  return info;
}

function findPluginFile(fileName) {
  const pluginsDir = path.join(process.cwd(), "plugins");
  if (!fs.existsSync(pluginsDir)) return null;
  const searchRecursive = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = searchRecursive(fullPath);
        if (found) return found;
      } else if (entry.name === `${fileName}.js` || entry.name.replace('.js', '') === fileName) {
        return fullPath;
      }
    }
    return null;
  };
  return searchRecursive(pluginsDir);
}

function diagnoseCode(code) {
  const errors = [];
  if (!code.includes('export')) errors.push('❌ ينقصه export');
  if (!code.includes('pluginConfig')) errors.push('❌ ينقصه pluginConfig');
  if (!code.includes('handler')) errors.push('❌ ينقصه handler');
  const openBraces = (code.match(/\{/g) || []).length;
  const closeBraces = (code.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) errors.push(`❌ الأقواس غير متطابقة: ${openBraces} فتح vs ${closeBraces} غلق`);
  return errors;
}

async function sendAsFile(sock, jid, fileName, code, caption, options = {}) {
  const tempDir = path.join(process.cwd(), "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  const tempPath = path.join(tempDir, `${fileName}.js`);
  fs.writeFileSync(tempPath, code);
  await sock.sendMessage(jid, {
    document: fs.readFileSync(tempPath),
    mimetype: "application/javascript",
    fileName: `${fileName}.js`,
    caption: caption || ""
  }, { quoted: options.quoted || null });
  try { fs.unlinkSync(tempPath); } catch {}
}

async function handler(m, { sock }) {
  const args = m.args || [];
  const action = args[0]?.toLowerCase();
  const fileName = args[1];
  const prefix = m.prefix || '.';

  if (!action) {
    await m.react('❓');
    return m.reply(
      `📦 *إدارة البلوقنات*\n\n` +
      `╭─〔 *الإجراءات المتاحة* 〕\n` +
      `│ ➕ \`${prefix}بلوقن اضف\` - إضافة/تعديل بلوقن\n` +
      `│ ❌ \`${prefix}بلوقن حذف <اسم>\` - حذف بلوقن\n` +
      `│ 👁️ \`${prefix}بلوقن عرض <اسم>\` - عرض الكود + نسخ\n` +
      `│ 🔍 \`${prefix}بلوقن فحص <اسم>\` - تشخيص الأخطاء\n` +
      `╰──────────⬣`
    );
  }

  // ─────────────────────────────────────────────
  // 👁️ عرض + نسخ مدمجين
  // ─────────────────────────────────────────────
  if (action === 'عرض' || action === 'show' || action === 'view') {
    if (!fileName) {
      await m.react('❓');
      return m.reply(`👁️ *عرض كود البلوقن*\n\n> \`${prefix}بلوقن عرض <اسم>\``);
    }

    const filePath = findPluginFile(fileName);
    if (!filePath || !fs.existsSync(filePath)) {
      await m.react('❌');
      return m.reply(`❌ البلوقن *${fileName}* غير موجود!`);
    }

    const baseName = path.basename(filePath);
    const codeContent = fs.readFileSync(filePath, "utf-8");
    const fileBuffer = fs.readFileSync(filePath);
    const folder = path.basename(path.dirname(filePath));
    const size = fs.statSync(filePath).size;

    await m.react("⏳");

    // إرسال كملف + زر نسخ
    const uploadedDocument = await prepareWAMessageMedia({
      document: fileBuffer,
      mimetype: "application/javascript",
      fileName: baseName
    }, { upload: sock.waUploadToServer });

    const msg = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: { text: `📂 *${baseName}*\n📁 ${folder}\n📏 ${size} بايت\n\nاختر الإجراء:` },
            header: { 
              title: `🛠️ إدارة البلوقنات`, 
              hasMediaAttachment: true,
              documentMessage: uploadedDocument.documentMessage
            },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "cta_copy",
                  buttonParamsJson: JSON.stringify({ 
                    display_text: "📋 نسخ الكود", 
                    copy_code: codeContent 
                  })
                },
                {
                  name: "quick_reply",
                  buttonParamsJson: JSON.stringify({ 
                    display_text: "🗑️ حذف البلوقن", 
                    id: `${prefix}بلوقن حذف ${fileName}` 
                  })
                }
              ]
            },
            contextInfo: typeof saluranCtx === "function" ? { ...saluranCtx() } : {}
          }
        }
      }
    }, { quoted: m });

    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    await m.react("✅");
    return;
  }

  // ─────────────────────────────────────────────
  // 🔍 فحص بلوقن
  // ─────────────────────────────────────────────
  if (action === 'فحص' || action === 'check' || action === 'diagnose') {
    if (!fileName) {
      await m.react('❓');
      return m.reply(`🔍 *فحص بلوقن*\n\n> \`${prefix}بلوقن فحص <اسم>\``);
    }

    const filePath = findPluginFile(fileName);
    if (!filePath || !fs.existsSync(filePath)) {
      await m.react('❌');
      return m.reply(`❌ البلوقن *${fileName}* غير موجود`);
    }

    const code = fs.readFileSync(filePath, 'utf8');
    const errors = diagnoseCode(code);
    const info = extractPluginInfo(code);
    const folder = path.basename(path.dirname(filePath));
    const size = fs.statSync(filePath).size;

    let text = `🔍 *تشخيص البلوقن*\n\n`;
    text += `╭─〔 *معلومات* 〕\n`;
    text += `│ الاسم: \`${fileName}.js\`\n`;
    text += `│ البلوقن: ${info.name || '?'}\n`;
    text += `│ المجلد: \`${folder}\`\n`;
    text += `│ الحجم: \`${size} بايت\`\n`;
    text += `╰──────────⬣\n\n`;

    if (errors.length > 0) {
      text += `╭─〔 *الأخطاء (${errors.length})* 〕\n`;
      for (const err of errors) text += `│ ${err}\n`;
      text += `╰──────────⬣\n\n`;
      text += `💡 *نصيحة:* أصلح الأخطاء وجرب إعادة التحميل`;
    } else {
      text += `✅ *لا توجد أخطاء ظاهرة*\n`;
    }

    await m.reply(text);
    await m.react('✅');
    return;
  }

  // ❌ حذف
  if (action === 'حذف' || action === 'delete' || action === 'remove' || action === 'del') {
    if (!fileName) {
      await m.react('❓');
      return m.reply(`🗑️ *حذف بلوقن*\n\n> \`${prefix}بلوقن حذف <اسم>\``);
    }
    const filePath = findPluginFile(fileName);
    if (!filePath) {
      await m.react('❌');
      return m.reply(`❌ البلوقن *${fileName}* غير موجود`);
    }
    fs.unlinkSync(filePath);
    try { unloadPlugin(fileName); } catch {}
    await m.react('✅');
    return m.reply(`✅ *تم حذف البلوقن*\n\n│ الاسم: \`${fileName}\`\n│ المسار: \`${path.relative(process.cwd(), filePath)}\``);
  }

  // ➕ إضافة
  if (action === 'اضف' || action === 'add' || action === 'new' || action === 'اضافة') {
    const quoted = m.quoted;
    if (!quoted) {
      await m.react('❓');
      return m.reply(`➕ *إضافة بلوقن*\n\n> رد على كود البلوقن مع:\n> \`${prefix}بلوقن اضف\` - تلقائي\n> \`${prefix}بلوقن اضف <اسم>\` - باسم مخصص`);
    }

    let code = quoted.text || quoted.body || "";
    if (quoted.mimetype === "application/javascript" || quoted.filename?.endsWith(".js")) {
      try { code = (await quoted.download()).toString(); } catch (e) {
        await m.react('❌');
        return m.reply(`❌ فشل تحميل الملف`);
      }
    }

    if (!code || code.length < 50) {
      await m.react('❌');
      return m.reply(`❌ الكود قصير جداً`);
    }

    const errors = diagnoseCode(code);
    const hasExport = code.includes("export");
    const hasConfig = code.includes("pluginConfig") || code.includes("config");
    
    if (!hasExport || !hasConfig) {
      await m.react('❌');
      let errText = `❌ الكود ليس بصيغة بلوقن صالحة\n\n`;
      if (errors.length > 0) {
        errText += `╭─〔 *الأخطاء* 〕\n`;
        for (const err of errors) errText += `│ ${err}\n`;
        errText += `╰──────────⬣`;
      }
      return m.reply(errText);
    }

    const extracted = extractPluginInfo(code);
    let finalName = fileName || extracted.name;

    if (!finalName) {
      await m.react('❓');
      return m.reply(`❌ لم يتم اكتشاف اسم البلوقن\n> استخدم \`${prefix}بلوقن اضف <اسم>\``);
    }

    finalName = finalName.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\-_]/g, "");
    let folderName = extracted.category || 'اخرى';
    folderName = folderName.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\-_]/g, "");

    const pluginsDir = path.join(process.cwd(), "plugins");
    const folderPath = path.join(pluginsDir, folderName);
    const filePath = path.join(folderPath, `${finalName}.js`);

    let isUpdate = fs.existsSync(filePath);
    let oldSize = isUpdate ? fs.statSync(filePath).size : 0;

    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
    fs.writeFileSync(filePath, code);

    let reloadResult = { success: false, error: '' };
    try {
      reloadResult = (await hotReloadPlugin(filePath)) || { success: true };
    } catch (e) {
      reloadResult.error = e.message;
    }

    await m.react('✅');
    let replyText = `✅ *تم ${isUpdate ? 'تحديث' : 'إضافة'} البلوقن*\n\n`;
    replyText += `╭─〔 *تفاصيل* 〕\n`;
    replyText += `│ الاسم: \`${finalName}.js\`\n`;
    replyText += `│ المجلد: \`${folderName}\`\n`;
    replyText += `│ الحجم: \`${code.length} بايت\`\n`;
    if (isUpdate) replyText += `│ الحجم القديم: \`${oldSize} بايت\`\n`;
    replyText += `│ التحميل: ${reloadResult.success ? '✅ ناجح' : '⚠️ معلق'}\n`;
    if (reloadResult.error) replyText += `│ السبب: \`${reloadResult.error}\`\n`;
    replyText += `╰──────────⬣\n\nالبلوقن جاهز للاستخدام!`;
    return m.reply(replyText);
  }

  await m.react('❓');
  return m.reply(`📦 *إدارة البلوقنات*\n\n│ ➕ \`${prefix}بلوقن اضف\`\n│ ❌ \`${prefix}بلوقن حذف\`\n│ 👁️ \`${prefix}بلوقن عرض\`\n│ 🔍 \`${prefix}بلوقن فحص\``);
}

export { pluginConfig as config, handler };