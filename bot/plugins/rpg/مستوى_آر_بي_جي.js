// مستوى_آر_بي_جي - أمر لتفعيل/تعطيل إشعارات رفع المستوى في RPG

import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "مستوى_آر_بي_جي",
  alias: ["leveluprpg"],
  category: "rpg",
  description: "تفعيل/تعطيل إشعارات رفع المستوى في RPG",
  usage: ".مستوى_آر_بي_جي <تشغيل/إيقاف>",
  example: ".مستوى_آر_بي_جي تشغيل",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);
  const args = m.args || [];
  const sub = args[0]?.toLowerCase();

  if (!user.settings) user.settings = {};

  if (sub === "on" || sub === "تشغيل") {
    user.settings.rpgLevelupNotif = true;
    db.save();
    return m.reply(`✅ *إشعارات رفع مستوى RPG*\n\n` + `> الحالة: *مفعل* ✅\n` + `> ستتلقى إشعارات عند رفع مستواك في RPG!`);
  }

  if (sub === "off" || sub === "إيقاف") {
    user.settings.rpgLevelupNotif = false;
    db.save();
    return m.reply(`❌ *إشعارات رفع مستوى RPG*\n\n` + `> الحالة: *معطل* ❌\n` + `> تم تعطيل إشعارات رفع مستوى RPG.`);
  }

  const status = user.settings.rpgLevelupNotif !== false ? "مفعل ✅" : "معطل ❌";
  return m.reply(
    `🔔 *إشعارات رفع مستوى RPG*\n\n` +
      `> الحالة الحالية: *${status}*\n\n` +
      `*📋 طريقة الاستخدام:*\n` +
      `> \`.مستوى_آر_بي_جي تشغيل\` - تفعيل\n` +
      `> \`.مستوى_آر_بي_جي إيقاف\` - تعطيل`,
  );
}

export { pluginConfig as config, handler };