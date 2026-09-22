// استشفاء - أمر لاستعادة الصحة والطاقة بالراحة (مجاني لكنه بطيء)

import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "استشفاء",
  alias: ["heal"],
  category: "rpg",
  description: "استعادة الصحة والطاقة بالراحة (مجاني لكنه بطيء)",
  usage: ".استشفاء",
  example: ".استشفاء",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 600,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};
  user.rpg.health = user.rpg.health || 100;
  user.rpg.maxHealth = user.rpg.maxHealth || 100;
  user.rpg.stamina = user.rpg.stamina || 100;
  user.rpg.maxStamina = user.rpg.maxStamina || 100;

  if (user.rpg.health >= user.rpg.maxHealth && user.rpg.stamina >= user.rpg.maxStamina) {
    return m.reply(`أنت بحالة جيدة! 🏋️✨\nلا تحتاج إلى الراحة، استمر في المغامرة! 🚀`);
  }

  await m.react("🛌");
  await m.reply("نم قليلاً... ززز... 🛌💤");
  await new Promise((r) => setTimeout(r, 3000));

  const healthRecover = 30;
  const staminaRecover = 50;

  const oldHealth = user.rpg.health;
  const oldStamina = user.rpg.stamina;

  user.rpg.health = Math.min(user.rpg.health + healthRecover, user.rpg.maxHealth);
  user.rpg.stamina = Math.min(user.rpg.stamina + staminaRecover, user.rpg.maxStamina);

  let txt = `نعاس... كم أنت منتعش بعد النوم! 🥱🌞\n\n`;
  txt += `حالتك تحسنت:\n`;
  txt += `❤️ الصحة: ${oldHealth} 📈 *${user.rpg.health}*\n`;
  txt += `⚡ الطاقة: ${oldStamina} 📈 *${user.rpg.stamina}*\n\n`;
  txt += `إذا كنت كسولاً في انتظار الراحة، يمكنك شراء جرعة من \`.متجر\` واستخدام \`.استخدام جرعة\` للتعافي الفوري! 🥤💖`;

  db.save();
  await m.reply(txt);
}

export { pluginConfig as config, handler };