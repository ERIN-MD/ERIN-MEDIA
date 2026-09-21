import { getDatabase } from "../../src/lib/maro-database.js";
import { saluranCtx } from "../../src/lib/maro-context.js";
import config from "../../config.js";

const pluginConfig = {
  name: "قراءة_الرسائل",
  alias: ["autoread", "readchat"],
  category: "owner",
  description: "قراءة تلقائية للرسائل الواردة",
  usage: ".قراءة_الرسائل on/off",
  example: ".قراءة_الرسائل on",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const option = m.text?.toLowerCase()?.trim();

  if (!option) {
    const current = db.setting("autoRead") ?? config.features?.autoRead ?? false;
    return m.reply(
      `📖 *قراءة الرسائل*\n\n` +
        `> الحالة: *${current ? "مفعل ✅" : "معطل ❌"}*\n\n` +
        `*الاستخدام:*\n` +
        `> *${m.prefix}قراءة_الرسائل on* — تفعيل\n` +
        `> *${m.prefix}قراءة_الرسائل off* — تعطيل\n\n` +
        `_البوت سيقرأ الرسائل الواردة تلقائياً_`
    );
  }

  if (option === "on") {
    db.setting("autoRead", true);
    const ctx = saluranCtx();
    return m.reply(
      `📖 *تم تفعيل قراءة الرسائل*\n\n` +
        `> البوت سيقرأ الرسائل الواردة تلقائياً`,
      { contextInfo: ctx }
    );
  }

  if (option === "off") {
    db.setting("autoRead", false);
    return m.reply(
      `📖 *تم تعطيل قراءة الرسائل*\n\n` +
        `> البوت لن يقرأ الرسائل تلقائياً`
    );
  }

  return m.reply(
    `❌ *خيار غير صالح*\n\n> استخدم *${m.prefix}قراءة_الرسائل on* أو *${m.prefix}قراءة_الرسائل off*`
  );
}

export { pluginConfig as config, handler };