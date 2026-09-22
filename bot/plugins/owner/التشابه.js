import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "اقتراحات",
  alias: ["التشابه", "similarity", "suggestions", "suggest"],
  category: "owner",
  description: "تفعيل أو تعطيل اقتراح الأوامر غير الموجودة",
  usage: ".اقتراحات on/off",
  example: ".اقتراحات on",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 0,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { db: contextDb } = {}) {
  const db = contextDb || getDatabase();
  const option = String(m.text || "").trim().toLowerCase();
  const current = db.setting("similarity") !== false;
  const prefix = m.prefix || ".";

  if (!option) {
    return m.reply(
      `╭━━━〔 Tarboo Bot 〕━━━╮\n` +
        `┃ ⚙️ إعداد اقتراحات الأوامر\n` +
        `┃\n` +
        `┃ الحالة الحالية: *${current ? "مفعلة ✅" : "معطلة ❌"}*\n` +
        `┃\n` +
        `┃ للتفعيل: *${prefix}اقتراحات on*\n` +
        `┃ للتعطيل: *${prefix}اقتراحات off*\n` +
        `╰━━━━━━━━━━━━━━━━━━╯`,
    );
  }

  if (["on", "تشغيل", "enable", "enabled"].includes(option)) {
    db.setting("similarity", true);
    return m.reply(
      `╭━━━〔 Tarboo Bot 〕━━━╮\n` +
        `┃ ✅ تم تفعيل اقتراحات الأوامر\n` +
        `┃\n` +
        `┃ سيقترح البوت الأمر الأقرب عند\n` +
        `┃ كتابة أمر غير موجود.\n` +
        `╰━━━━━━━━━━━━━━━━━━╯`,
    );
  }

  if (["off", "إيقاف", "ايقاف", "disable", "disabled"].includes(option)) {
    db.setting("similarity", false);
    return m.reply(
      `╭━━━〔 Tarboo Bot 〕━━━╮\n` +
        `┃ ❌ تم تعطيل اقتراحات الأوامر\n` +
        `┃\n` +
        `┃ لن يرسل البوت اقتراحات عند\n` +
        `┃ كتابة أمر غير موجود.\n` +
        `╰━━━━━━━━━━━━━━━━━━╯`,
    );
  }

  return m.reply(
    `❌ خيار غير صالح\n\n` +
      `استخدم:\n` +
      `> ${prefix}اقتراحات on\n` +
      `> ${prefix}اقتراحات off`,
  );
}

export { pluginConfig as config, handler };