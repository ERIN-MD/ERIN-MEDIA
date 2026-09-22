// انفصال - أمر للانفصال عن الشريك

import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: ["انفصال"],
  alias: ["divorce", "فراق", "فسخ"],
  category: "rpg",
  description: "الانفصال عن الشريك",
  usage: ".انفصال",
  example: ".انفصال",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 60,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};

  if (!user.rpg.spouse) {
    return m.reply(`أنت لست مرتبطاً بأحد! 😂💔\nابحث عن شريك باستخدام \`.ارتباط @مستخدم\``);
  }

  const spouseJid = user.rpg.spouse;
  const partner = db.getUser(spouseJid);

  const divorceCost = 25000;
  if ((user.koin || 0) < divorceCost) {
    return m.reply(`رسوم الانفصال باهظة! 😭\nتحتاج *25000* عملة، لديك فقط *${(user.koin || 0).toLocaleString("ar-EG")}* عملة.\nتحمّل قليلاً!`);
  }

  user.koin -= divorceCost;
  user.rpg.spouse = null;
  user.rpg.marriedAt = null;

  if (partner && partner.rpg) {
    partner.rpg.spouse = null;
    partner.rpg.marriedAt = null;
  }

  db.save();

  await m.react("💔");

  let txt = `⛈️ *تم الانفصال* ⛈️\n\n`;
  txt += `انتهى الارتباط بين:\n`;
  txt += `💔 @${m.sender.split("@")[0]}\n`;
  txt += `         -- وانفصل عن --\n`;
  txt += `💔 @${spouseJid.split("@")[0]}\n\n`;
  txt += `😭 *تم الانفصال رسمياً! عدتما أعزبين!* 😭\n\n`;
  txt += `💸 رسوم الانفصال: *-${divorceCost.toLocaleString("ar-EG")}* عملة\n\n`;
  txt += `> _"انتهى الأمر... ابكِ في الزاوية. الحياة تستمر..." - قاضي البوت_ 🥀🚬`;

  await m.reply(txt, { mentions: [m.sender, spouseJid] });
}

export { pluginConfig as config, handler };