import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "العاب",
  alias: ["game"],
  category: "group",
  description: "تفعيل أو تعطيل الألعاب في المجموعة",
  usage: ".العاب <تشغيل/إيقاف>",
  example: ".العاب تشغيل",
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
      `🎮 *الألعاب*\n\n` +
        `استخدم هذا الأمر للتحكم في وصول الأعضاء للألعاب.\n\n` +
        `• *${m.prefix}العاب تشغيل* - يمكن للأعضاء اللعب\n` +
        `• *${m.prefix}العاب إيقاف* - لا يمكن للأعضاء اللعب\n\n` +
        `*ملاحظة:* المشرفون يمكنهم الوصول للألعاب حتى لو كانت معطلة.`,
    );
  }

  const db = getDatabase();
  const group = db.getGroup(m.chat) || db.setGroup(m.chat);

  const isEnable = args === "تشغيل" || args === "on";

  if (group.game === isEnable) {
    return m.reply(`🎮 الألعاب بالفعل *${isEnable ? "مفعلة" : "معطلة"}* في هذه المجموعة.`);
  }

  group.game = isEnable;
  db.setGroup(m.chat, group);

  await m.react("✅");
  return m.reply(
    `✅ تم *${isEnable ? "تفعيل" : "تعطيل"}* الألعاب في هذه المجموعة!\n\n` +
    (isEnable
      ? `يمكن للأعضاء الآن استخدام جميع أوامر الألعاب.`
      : `لن يتمكن الأعضاء من استخدام أوامر الألعاب بعد الآن.`),
  );
}

export { pluginConfig as config, handler };