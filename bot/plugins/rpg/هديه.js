// هديه - أمر لإعطاء هدية للشريك لزيادة المحبة

import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "هديه",
  alias: ["gift"],
  category: "rpg",
  description: "إعطاء هدية للشريك لزيادة المحبة",
  usage: ".هديه <العنصر> <الكمية>",
  example: ".هديه ماس 1",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 30,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};

  if (!user.rpg.spouse) {
    return m.reply(`❌ *لم تتزوج بعد*\n\n` + `> لم تتزوج بعد!\n` + `> تزوج باستخدام \`.زواج @مستخدم\``);
  }

  const args = m.args || [];
  const itemKey = args[0]?.toLowerCase();
  const amount = parseInt(args[1]) || 1;

  if (!itemKey) {
    return m.reply(
      `🎁 *هديه*\n\n` +
        `*📋 طريقة الاستخدام:*\n` +
        `> اختر العنصر لتقديمه\n` +
        `> \`.هديه ماس 1\``,
    );
  }

  user.inventory = user.inventory || {};

  if ((user.inventory[itemKey] || 0) < amount) {
    return m.reply(`❌ *العنصر غير كافٍ*\n\n` + `> العنصر *${itemKey}* لديك: ${user.inventory[itemKey] || 0}\n` + `> المطلوب: ${amount}`);
  }

  const spouseJid = user.rpg.spouse;
  const partner = db.getUser(spouseJid);

  if (!partner) {
    return m.reply(`❌ *الشريك غير موجود*\n\n> الشريك غير موجود في قاعدة البيانات!`);
  }

  partner.inventory = partner.inventory || {};

  user.inventory[itemKey] -= amount;
  partner.inventory[itemKey] = (partner.inventory[itemKey] || 0) + amount;

  user.rpg.love = (user.rpg.love || 0) + amount * 10;
  if (partner.rpg) partner.rpg.love = (partner.rpg.love || 0) + amount * 10;

  db.save();

  let txt = `🎁 *تم تقديم الهدية بنجاح*\n\n`;
  txt += `> 💝 قدمت ${amount}× ${itemKey}\n`;
  txt += `> 👤 لـ: @${spouseJid.split("@")[0]}\n`;
  txt += `> 💕 المحبة: +${amount * 10}\n\n`;
  txt += `> *كم أنت رومانسي! 💖*`;

  await m.reply(txt, { mentions: [spouseJid] });
}

export { pluginConfig as config, handler };