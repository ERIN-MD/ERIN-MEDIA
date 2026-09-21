import { getDatabase } from "../../src/lib/maro-database.js";
import te from "../../src/lib/maro-error.js";
import config from "../../config.js";

const pluginConfig = {
  name: "تفعيل_العام",
  alias: ["publicgc"],
  category: "group",
  description: "تفعيل الوضع العام لهذه المجموعة فقط",
  usage: ".تفعيل_العام",
  example: ".تفعيل_العام",
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
  const isPublicGroup = publicGroups.includes(m.chat);

  if (isPublicGroup && !isSelfGroup) {
    return m.reply(
      `ℹ️ *المجموعة في الوضع العام بالفعل*\n\n` +
        `> البوت يستجيب لجميع الأعضاء في هذه المجموعة\n\n` +
        `_استخدم ${m.prefix}تفعيل_الخاص لإغلاق الوصول_`,
    );
  }

  const updatedSelf = selfGroups.filter((id) => id !== m.chat);
  db.setting("selfGroups", updatedSelf);

  if (!publicGroups.includes(m.chat)) {
    db.setting("publicGroups", [...publicGroups, m.chat]);
  }

  m.react("🌐");
  return m.reply(
    `🌐 *تم تفعيل الوضع العام*\n\n` +
      `> البوت الآن يستجيب لجميع الأعضاء في هذه المجموعة\n` +
      `> يتجاوز الوضع العام لهذه المجموعة\n\n` +
      `📋 *المجموعات الأخرى لم تتأثر*\n\n` +
      `_استخدم ${m.prefix}تفعيل_الخاص لإغلاق الوصول_`,
  );
}

export { pluginConfig as config, handler };