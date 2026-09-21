// ارتباط - أمر للارتباط (بدون زواج)

import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "ارتباط",
  alias: ["marry"],
  category: "rpg",
  description: "الارتباط بشخص آخر (بدون زواج رسمي)",
  usage: ".ارتباط @مستخدم",
  example: ".ارتباط @مستخدم",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 60,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};

  const target = m.mentionedJid?.[0] || m.quoted?.sender;

  if (!target) {
    let txt = `💒 *الارتباط في RPG* 💒\n\n`;
    txt += `ارتبط بلاعب آخر (بدون زواج رسمي)!\n\n`;
    txt += `*طريقة الارتباط:*\n`;
    txt += `👉 \`${m.prefix}ارتباط @مستخدم\`\n\n`;
    txt += `*الشروط:*\n`;
    txt += `💍 رسوم الارتباط: *50000* عملة\n`;
    txt += `(تأكد من أن الطرف الآخر غير مرتبط!)`;
    return m.reply(txt);
  }

  if (target === m.sender) {
    return m.reply(`هل تريد الارتباط بنفسك؟ ابحث عن شريك حقيقي! 😭💔`);
  }

  const partner = db.getUser(target) || db.setUser(target);
  if (!partner.rpg) partner.rpg = {};

  if (user.rpg.spouse) {
    return m.reply(`أنت مرتبط بالفعل بـ @${user.rpg.spouse.split("@")[0]}!\nانفصل باستخدام \`.انفصال\` 😡🔪`, { mentions: [user.rpg.spouse] });
  }

  if (partner.rpg.spouse) {
    return m.reply(`للأسف... 🥀\n@${target.split("@")[0]} مرتبط بالفعل بشخص آخر!\nأحلامك تحطمت...`, { mentions: [target] });
  }

  const marriageCost = 50000;
  if ((user.koin || 0) < marriageCost) {
    return m.reply(`رسوم الارتباط *50000* عملة، لكن لديك فقط *${(user.koin || 0).toLocaleString("ar-EG")}* عملة.\nاعمل بجد أولاً!`);
  }

  user.koin -= marriageCost;
  user.rpg.spouse = target;
  user.rpg.marriedAt = Date.now();
  partner.rpg.spouse = m.sender;
  partner.rpg.marriedAt = Date.now();

  db.save();

  await m.react("💍");

  let txt = `💒 *إعلان الارتباط!!* 💒\n\n`;
  txt += `جميع أعضاء الخادم يهنئون:\n\n`;
  txt += `👤 @${m.sender.split("@")[0]}\n`;
  txt += `           💖 مع 💖\n`;
  txt += `👤 @${target.split("@")[0]}\n\n`;
  txt += `🎉 *أصبحا مرتبطين رسمياً!* 🎉\n\n`;
  txt += `💍 تكاليف الحفل: *-${marriageCost.toLocaleString("ar-EG")}* عملة\n\n`;
  txt += `> _"أتمنى لهما السعادة!" - كاهن البوت_ 🥺💕`;

  await m.reply(txt, { mentions: [m.sender, target] });
}

export { pluginConfig as config, handler };