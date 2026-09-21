// تفعيل البلوقن - أمر لتفعيل بلوقن معينة

import fs from "fs";
import path from "path";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "تفعيل_البلوقن",
  alias: ["enableplugin"],
  category: "owner",
  description: "تفعيل بلوقن معينة",
  usage: ".تفعيل_البلوقن <اسم_البلوقن>",
  example: ".تفعيل_البلوقن ملصق",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  energi: 0,
  isEnabled: true,
};

async function findPluginFile(pluginName) {
  const pluginsDir = path.join(process.cwd(), "plugins");
  const categories = fs.readdirSync(pluginsDir).filter((f) => {
    return fs.statSync(path.join(pluginsDir, f)).isDirectory();
  });

  for (const category of categories) {
    const categoryPath = path.join(pluginsDir, category);
    const files = fs.readdirSync(categoryPath).filter((f) => f.endsWith(".js"));

    for (const file of files) {
      try {
        const filePath = path.join(categoryPath, file);
        const plugin = await import(`file://${filePath.replace(/\\/g, "/")}`);

        if (!plugin.config) continue;

        const name = Array.isArray(plugin.config.name)
          ? plugin.config.name[0]
          : plugin.config.name;

        const aliases = plugin.config.alias || [];

        if (name === pluginName || aliases.includes(pluginName)) {
          return { filePath, plugin, category, file };
        }
      } catch {}
    }
  }

  return null;
}

async function handler(m, { sock }) {
  const args = m.args || [];
  const pluginName = args[0]?.toLowerCase();

  if (!pluginName) {
    return m.reply(
      `🔌 *تفعيل البلوقن*\n\n` +
        `> أدخل اسم البلوقن التي تريد تفعيلها\n\n` +
        `*مثال:*\n` +
        `> \`${m.prefix}تفعيل_البلوقن ملصق\`\n` +
        `> \`${m.prefix}تفعيل_البلوقن تيك توك\``,
    );
  }

  const found = await findPluginFile(pluginName);

  if (!found) {
    return m.reply(`❌ البلوقن *${pluginName}* غير موجود!`);
  }

  const { filePath, plugin, category, file } = found;

  if (plugin.config.isEnabled !== false) {
    return m.reply(`⚠️ البلوقن *${pluginName}* مفعل بالفعل!`);
  }

  try {
    let content = fs.readFileSync(filePath, "utf-8");

    content = content.replace(/isEnabled:\s*false/i, "isEnabled: true");

    fs.writeFileSync(filePath, content);

    await m.reply(
      `✅ *تم تفعيل البلوقن*\n\n` +
        `╭┈┈⬡「 📋 *التفاصيل* 」\n` +
        `┃ 📦 البلوقن: *${plugin.config.name}*\n` +
        `┃ 📁 التصنيف: *${category}*\n` +
        `┃ 📄 الملف: *${file}*\n` +
        `┃ 🟢 الحالة: *مفعل*\n` +
        `╰┈┈⬡\n\n` +
        `> أعد تشغيل البوت أو استخدم إعادة التحميل السريع لتطبيق التغييرات.`,
    );
  } catch (error) {
    await m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };