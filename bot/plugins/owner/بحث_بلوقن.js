// بحث بلوقن - أمر للبحث وعرض معلومات البلوقن

import fs from "fs";
import path from "path";
import { getAllPlugins } from "../../src/lib/maro-plugins.js";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "بحث_بلوقن",
  alias: ["searchplugin"],
  category: "owner",
  description: "البحث عن بلوقن وعرض معلوماته",
  usage: ".بحث_بلوقن <الاسم>",
  example: ".بحث_بلوقن ملصق",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

function findPluginInfo(name) {
  const allPlugins = getAllPlugins();

  for (const plugin of allPlugins) {
    if (!plugin.config) continue;

    const rawName = plugin.config.name;
    const pName = (
      Array.isArray(rawName) ? rawName[0] : rawName
    )?.toLowerCase();
    const aliases = Array.isArray(plugin.config.alias)
      ? plugin.config.alias
      : plugin.config.alias
        ? [plugin.config.alias]
        : [];

    if (
      pName === name.toLowerCase() ||
      aliases.map((a) => a?.toLowerCase()).includes(name.toLowerCase())
    ) {
      return {
        ...plugin.config,
        filePath: plugin.filePath,
      };
    }
  }

  return null;
}

async function findPluginFromFile(pluginsDir, name) {
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
        const filePath = path.join(folderPath, file);
        try {
          const mod = await import(`file://${filePath.replace(/\\/g, "/")}`);
          return {
            ...mod.config,
            folder,
            file,
            filePath,
          };
        } catch (e) {
          return { folder, file, filePath, error: e.message };
        }
      }
    }
  }

  return null;
}

async function handler(m, { sock }) {
  const name = m.text?.trim();

  if (!name) {
    return m.reply(
      `🔍 *بحث بلوقن*\n\n` +
        `> البحث عن بلوقن وعرض معلوماته\n\n` +
        `*مثال:*\n` +
        `> \`${m.prefix}بحث_بلوقن ملصق\`\n` +
        `> \`${m.prefix}بحث_بلوقن قائمة\``,
    );
  }

  m.react("🔍");

  try {
    let info = findPluginInfo(name);

    if (!info) {
      const pluginsDir = path.join(process.cwd(), "plugins");
      info = await findPluginFromFile(pluginsDir, name);
    }

    if (!info) {
      await m.react("❌");
      return m.reply(
        `❌ *غير موجود*\n\n> البلوقن \`${name}\` غير موجود`,
      );
    }

    if (info.error) {
      await m.react("⚠️");
      return m.reply(
        `⚠️ *خطأ في البلوقن*\n\n` +
          `> الملف: \`${info.file}\`\n` +
          `> المجلد: \`${info.folder}\`\n` +
          `> الخطأ: \`${info.error}\``,
      );
    }

    const aliases = Array.isArray(info.alias)
      ? info.alias.join(", ")
      : info.alias || "-";
    const isEnabled = info.isEnabled !== false ? "✅ نعم" : "❌ لا";
    const isOwner = info.isOwner ? "✅ نعم" : "❌ لا";
    const isPremium = info.isPremium ? "✅ نعم" : "❌ لا";
    const isGroup = info.isGroup ? "✅ نعم" : "❌ لا";
    const isAdmin = info.isAdmin ? "✅ نعم" : "❌ لا";

    await m.react("✅");
    return m.reply(
      `📋 *معلومات البلوقن*\n\n` +
        `╭┈┈⬡「 📝 *التفاصيل* 」\n` +
        `┃ 📛 الاسم: \`${info.name || "-"}\`\n` +
        `┃ 🏷️ الاسم المستعار: \`${aliases}\`\n` +
        `┃ 📁 التصنيف: \`${info.category || "-"}\`\n` +
        `┃ 📄 الوصف: ${info.description || "-"}\n` +
        `┃ 📝 طريقة الاستخدام: \`${info.usage || "-"}\`\n` +
        `┃ 📌 مثال: \`${info.example || "-"}\`\n` +
        `╰┈┈⬡\n\n` +
        `╭┈┈⬡「 ⚙️ *الإعدادات* 」\n` +
        `┃ 🔓 مفعل: ${isEnabled}\n` +
        `┃ 👑 للمالك فقط: ${isOwner}\n` +
        `┃ 💎 بريميوم: ${isPremium}\n` +
        `┃ 👥 للمجموعات فقط: ${isGroup}\n` +
        `┃ 🛡️ للمشرفين فقط: ${isAdmin}\n` +
        `┃ ⏱️ وقت الانتظار: \`${info.cooldown || 0}ث\`\n` +
        `┃ 🎫 الحد: \`${info.limit || 0}\`\n` +
        `╰┈┈⬡`,
    );
  } catch (error) {
    console.log(error);
    await m.react("☢");
    await m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };