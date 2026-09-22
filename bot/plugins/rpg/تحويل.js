// تحويل - أمر لتحويل الأموال أو العناصر إلى مستخدم آخر

import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "تحويل",
  alias: ["transfer"],
  category: "rpg",
  description: "تحويل الأموال أو العناصر إلى مستخدم آخر",
  usage: ".تحويل <مال/اسم_العنصر> <الكمية> @مستخدم",
  example: ".تحويل مال 10000 @مستخدم",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

function handler(m, { sock }) {
  const db = getDatabase();
  const sender = db.getUser(m.sender);

  const args = m.args || [];
  if (args.length < 3) {
    let txt = `🏦 *البنك المركزي RPG* 🏦\n\n`;
    txt += `خدمة تحويل العملات والعناصر بين اللاعبين!\n\n`;
    txt += `*صيغة التحويل:*\n`;
    txt += `👉 \`.تحويل مال 10000 @مستخدم\` (لتحويل العملات)\n`;
    txt += `👉 \`.تحويل جرعة 5 @مستخدم\` (لتحويل العناصر)\n`;
    return m.reply(txt);
  }

  const type = args[0].toLowerCase();
  const amount = parseInt(args[1]);
  const target = m.mentionedJid?.[0] || m.quoted?.sender;

  if (!target) {
    return m.reply(`لم تحدد المستلم! أشر إلى المستخدم الذي تريد التحويل إليه! 📦🔍`);
  }

  if (target === m.sender) {
    return m.reply(`هل تحاول التحويل لنفسك؟ ابحث عن شخص آخر! 😂❌`);
  }

  if (!amount || amount <= 0) {
    return m.reply(`الكمية يجب أن تكون أكبر من *0*! 🌬️`);
  }

  const recipient = db.getUser(target) || db.setUser(target);

  if (type === "money" || type === "balance" || type === "koin" || type === "مال") {
    if ((sender.koin || 0) < amount) {
      return m.reply(`فشل التحويل! ❌\nرصيدك غير كافٍ. رصيدك: *${(sender.koin || 0).toLocaleString("ar-EG")}* عملة | المطلوب: *${amount.toLocaleString("ar-EG")}* عملة 💸`);
    }

    sender.koin -= amount;
    recipient.koin = (recipient.koin || 0) + amount;

    db.setUser(m.sender, sender);
    db.setUser(target, recipient);
    db.save();
    
    let txt = `💸 *تم التحويل بنجاح!* 💸\n\n`;
    txt += `تم إرسال المبلغ:\n`;
    txt += `💳 المبلغ: *${amount.toLocaleString("ar-EG")}* عملة\n`;
    txt += `👤 المستلم: @${target.split("@")[0]}\n\n`;
    txt += `> _"شكراً لاستخدام خدمة البنك!"_ 🏦✨`;

    return m.reply(txt, { mentions: [target] });
  } else {
    sender.inventory = sender.inventory || {};
    recipient.inventory = recipient.inventory || {};

    if ((sender.inventory[type] || 0) < amount) {
      return m.reply(`فشل التحويل! ❌\nلديك *${sender.inventory[type] || 0}* من *${type}*، تريد تحويل *${amount}*! 📦`);
    }

    sender.inventory[type] -= amount;
    recipient.inventory[type] = (recipient.inventory[type] || 0) + amount;

    db.setUser(m.sender, sender);
    db.setUser(target, recipient);
    db.save();

    let txt = `📦 *تم تسليم الطرد!* 📦\n\n`;
    txt += `تم تسليم العناصر:\n`;
    txt += `🎁 المحتوى: *${type}* (×${amount})\n`;
    txt += `👤 المستلم: @${target.split("@")[0]}\n\n`;
    txt += `> _"تم التسليم!" - ساعي البوت_ 🛵💨`;

    return m.reply(txt, { mentions: [target] });
  }
}

export { pluginConfig as config, handler };