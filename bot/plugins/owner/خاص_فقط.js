// الخاص فقط - أمر لتفعيل/تعطيل وضع البوت في المحادثات الخاصة فقط

import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "خاص_فقط",
  alias: ["onlypc"],
  category: "owner",
  description: "تفعيل/تعطيل وضع البوت في المحادثات الخاصة فقط",
  usage: ".خاص_فقط تشغيل/إيقاف",
  example: ".خاص_فقط تشغيل",
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
    const current = db.setting("onlyPc") || false;
    return m.reply(
      `💬 *الخاص فقط*\n\n` +
        `> الحالة: *${current ? "مفعل ✅" : "معطل ❌"}*\n\n` +
        `*طريقة الاستخدام:*\n` +
        `> *${m.prefix}خاص_فقط تشغيل* — البوت يعمل فقط في المحادثات الخاصة\n` +
        `> *${m.prefix}خاص_فقط إيقاف* — البوت يعمل في أي مكان\n\n` +
        `_إذا تم التفعيل، سيتم تعطيل وضع المجموعات فقط تلقائياً_`
    );
  }

  if (option === "on" || option === "تشغيل") {
    db.setting("onlyPc", true);
    db.setting("onlyGc", false);
    await m.react("✅");
    return m.reply(
      `💬 *تم تفعيل الخاص فقط*\n\n` +
        `> البوت يعمل فقط في المحادثات الخاصة\n` +
        `> تم تعطيل وضع المجموعات فقط`
    );
  }

  if (option === "off" || option === "إيقاف") {
    db.setting("onlyPc", false);
    await m.react("❌");
    return m.reply(
      `💬 *تم تعطيل الخاص فقط*\n\n` +
        `> البوت يعمل في أي مكان`
    );
  }

  return m.reply(
    `❌ *خيار غير صالح*\n\n> استخدم *${m.prefix}خاص_فقط تشغيل* أو *${m.prefix}خاص_فقط إيقاف*`
  );
}

export { pluginConfig as config, handler };