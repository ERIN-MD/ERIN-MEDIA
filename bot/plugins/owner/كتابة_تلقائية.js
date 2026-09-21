import { getDatabase } from "../../src/lib/maro-database.js";
import { saluranCtx } from "../../src/lib/maro-context.js";
import config from "../../config.js";

const pluginConfig = {
  name: "كتابة_تلقائية",
  alias: ["autotyping"],
  category: "owner",
  description: "إظهار مؤشر الكتابة تلقائياً عند استقبال رسالة",
  usage: ".كتابة_تلقائية on/off",
  example: ".كتابة_تلقائية on",
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
    const current = db.setting("autoTyping") ?? config.features?.autoTyping ?? true;
    return m.reply(
      `⌨️ *كتابة تلقائية*\n\n` +
        `> الحالة: *${current ? "مفعل ✅" : "معطل ❌"}*\n\n` +
        `*الاستخدام:*\n` +
        `> *${m.prefix}كتابة_تلقائية on* — تفعيل\n` +
        `> *${m.prefix}كتابة_تلقائية off* — تعطيل\n\n` +
        `_البوت سيظهر مؤشر الكتابة عند استقبال الرسائل_`
    );
  }

  if (option === "on") {
    db.setting("autoTyping", true);
    const ctx = saluranCtx();
    return m.reply(
      `⌨️ *تم تفعيل الكتابة التلقائية*\n\n` +
        `> البوت سيظهر مؤشر الكتابة`,
      { contextInfo: ctx }
    );
  }

  if (option === "off") {
    db.setting("autoTyping", false);
    return m.reply(
      `⌨️ *تم تعطيل الكتابة التلقائية*\n\n` +
        `> البوت لن يظهر مؤشر الكتابة`
    );
  }

  return m.reply(
    `❌ *خيار غير صالح*\n\n> استخدم *${m.prefix}كتابة_تلقائية on* أو *${m.prefix}كتابة_تلقائية off*`
  );
}

export { pluginConfig as config, handler };