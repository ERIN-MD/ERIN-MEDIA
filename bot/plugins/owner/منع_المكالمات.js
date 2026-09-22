import { getDatabase } from "../../src/lib/maro-database.js";
import { saluranCtx } from "../../src/lib/maro-context.js";
import config from "../../config.js";

const pluginConfig = {
  name: "منع_المكالمات",
  alias: ["anticall"],
  category: "owner",
  description: "رفض المكالمات الواردة تلقائياً",
  usage: ".منع_المكالمات on/off",
  example: ".منع_المكالمات on",
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
    const current = db.setting("antiCall") ?? config.features?.antiCall ?? true;
    return m.reply(
      `📞 *منع المكالمات*\n\n` +
        `> الحالة: *${current ? "مفعل ✅" : "معطل ❌"}*\n\n` +
        `*الاستخدام:*\n` +
        `> *${m.prefix}منع_المكالمات on* — تفعيل\n` +
        `> *${m.prefix}منع_المكالمات off* — تعطيل\n\n` +
        `_البوت سيرفض المكالمات الواردة تلقائياً_`
    );
  }

  if (option === "on") {
    db.setting("antiCall", true);
    const ctx = saluranCtx();
    return m.reply(
      `📞 *تم تفعيل منع المكالمات*\n\n` +
        `> البوت سيرفض المكالمات الواردة تلقائياً`,
      { contextInfo: ctx }
    );
  }

  if (option === "off") {
    db.setting("antiCall", false);
    return m.reply(
      `📞 *تم تعطيل منع المكالمات*\n\n` +
        `> البوت لن يرفض المكالمات الواردة`
    );
  }

  return m.reply(
    `❌ *خيار غير صالح*\n\n> استخدم *${m.prefix}منع_المكالمات on* أو *${m.prefix}منع_المكالمات off*`
  );
}

export { pluginConfig as config, handler };