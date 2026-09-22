import { getDatabase } from "../../src/lib/maro-database.js";
import te from "../../src/lib/maro-error.js";
import config from "../../config.js";

const pluginConfig = {
  name: "تفعيل_الخاص",
  alias: ["selfgc"],
  category: "group",
  description: "تفعيل الوضع الخاص لهذه المجموعة فقط",
  usage: ".تفعيل_الخاص",
  example: ".تفعيل_الخاص",
  isOwner: true,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 3,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const selfGroups = db.setting("selfGroups") || [];
  const publicGroups = db.setting("publicGroups") || [];

  const isSelfGroup = selfGroups.includes(m.chat);

  if (isSelfGroup) {
    return m.reply(
      `ℹ️ *المجموعة في الوضع الخاص بالفعل*\n\n` +
        `> البوت يستجيب فقط للمالك والبوت نفسه\n\n` +
        `_استخدم ${m.prefix}تفعيل_العام لفتح الوصول_`,
    );
  }

  if (!selfGroups.includes(m.chat)) {
    db.setting("selfGroups", [...selfGroups, m.chat]);
  }

  const updatedPublic = publicGroups.filter((id) => id !== m.chat);
  db.setting("publicGroups", updatedPublic);

  m.react("🔒");
  return m.reply(
    `🔒 *تم تفعيل الوضع الخاص*\n\n` +
      `> البوت في هذه المجموعة الآن يستجيب فقط لـ:\n` +
      `> • مالك البوت\n` +
      `> • البوت نفسه\n\n` +
      `📋 *المجموعات الأخرى لم تتأثر*\n\n` +
      `_استخدم ${m.prefix}تفعيل_العام لفتح الوصول_`,
  );
}

export { pluginConfig as config, handler };