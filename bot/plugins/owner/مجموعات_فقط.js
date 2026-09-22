// المجموعات فقط - أمر لتفعيل/تعطيل وضع البوت في المجموعات فقط

import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "مجموعات_فقط",
  alias: ["onlygc"],
  category: "owner",
  description: "تفعيل/تعطيل وضع البوت في المجموعات فقط",
  usage: ".مجموعات_فقط تشغيل/إيقاف",
  example: ".مجموعات_فقط تشغيل",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const option = m.text?.toLowerCase()?.trim();

  if (!option) {
    const current = db.setting("onlyGc") || false;
    return m.reply(
      `🏘️ *المجموعات فقط*\n\n` +
        `> الحالة: *${current ? "مفعل ✅" : "معطل ❌"}*\n\n` +
        `*طريقة الاستخدام:*\n` +
        `> *${m.prefix}مجموعات_فقط تشغيل* — البوت يعمل فقط في المجموعات\n` +
        `> *${m.prefix}مجموعات_فقط إيقاف* — البوت يعمل في أي مكان\n\n` +
        `_إذا تم التفعيل، سيتم تعطيل وضع الخاص فقط تلقائياً_`
    );
  }

  if (option === "on" || option === "تشغيل") {
    db.setting("onlyGc", true);
    db.setting("onlyPc", false);
    await m.react("✅");
    return m.reply(
      `🏘️ *تم تفعيل المجموعات فقط*\n\n` +
        `> البوت يعمل فقط في المجموعات\n` +
        `> تم تعطيل وضع الخاص فقط`
    );
  }

  if (option === "off" || option === "إيقاف") {
    db.setting("onlyGc", false);
    await m.react("❌");
    return m.reply(
      `🏘️ *تم تعطيل المجموعات فقط*\n\n` +
        `> البوت يعمل في أي مكان`
    );
  }

  return m.reply(
    `❌ *خيار غير صالح*\n\n> استخدم *${m.prefix}مجموعات_فقط تشغيل* أو *${m.prefix}مجموعات_فقط إيقاف*`
  );
}

export { pluginConfig as config, handler };