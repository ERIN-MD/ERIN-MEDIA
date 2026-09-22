import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "اربيجي",
  alias: ["rpg"],
  category: "group",
  description: "تفعيل أو تعطيل ألعاب RPG في المجموعة",
  usage: ".اربيجي <تشغيل/إيقاف>",
  example: ".اربيجي تشغيل",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  isAdmin: true,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const args = m.text?.trim()?.toLowerCase();

  if (args !== "تشغيل" && args !== "ايقاف" && args !== "on" && args !== "off") {
    return m.reply(
      `⚔️ *ألعاب RPG*\n\n` +
        `استخدم هذا الأمر للتحكم في وصول الأعضاء لألعاب RPG.\n\n` +
        `• *${m.prefix}اربيجي تشغيل* - يمكن للأعضاء اللعب\n` +
        `• *${m.prefix}اربيجي إيقاف* - لا يمكن للأعضاء اللعب\n\n` +
        `*ملاحظة:* المشرفون يمكنهم الوصول للألعاب حتى لو كانت معطلة.`,
    );
  }

  const db = getDatabase();
  const group = db.getGroup(m.chat) || db.setGroup(m.chat);

  const isEnable = args === "تشغيل" || args === "on";

  if (group.rpg === isEnable) {
    return m.reply(`⚔️ ألعاب RPG بالفعل *${isEnable ? "مفعلة" : "معطلة"}* في هذه المجموعة.`);
  }

  group.rpg = isEnable;
  db.setGroup(m.chat, group);

  await m.react("✅");
  return m.reply(
    `✅ تم *${isEnable ? "تفعيل" : "تعطيل"}* ألعاب RPG في هذه المجموعة!\n\n` +
    (isEnable
      ? `يمكن للأعضاء الآن استخدام جميع أوامر RPG.`
      : `لن يتمكن الأعضاء من استخدام أوامر RPG بعد الآن.`),
  );
}

export { pluginConfig as config, handler };