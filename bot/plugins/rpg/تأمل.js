// تأمل - أمر للراحة واستعادة الصحة والطاقة

import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "تأمل",
  alias: ["meditation"],
  category: "rpg",
  description: "الراحة لاستعادة الصحة والطاقة",
  usage: ".تأمل",
  example: ".تأمل",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 600,
  energi: 0,
  isEnabled: true,
};

async function handler(m) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};

  const currentStamina = user.rpg.stamina ?? 100;
  const currentHealth = user.rpg.health || 100;
  const currentMana = user.rpg.mana || 50;

  const maxStamina = 100;
  const maxHealth = 100 + (user.level || 1) * 5;
  const maxMana = 50 + (user.level || 1) * 3;

  if (currentStamina >= maxStamina && currentHealth >= maxHealth && currentMana >= maxMana) {
    return m.reply(
      `💤 *جميع المؤشرات ممتلئة*\n\n` +
        `> ⚡ الطاقة: ${currentStamina}/${maxStamina}\n` +
        `> ❤️ الصحة: ${currentHealth}/${maxHealth}\n` +
        `> 💙 المانا: ${currentMana}/${maxMana}\n\n` +
        `💡 أنت في حالة ممتازة!`,
    );
  }

  await m.react("💤");
  await m.reply(`💤 *جاري الاسترخاء...*\n\n> استعادة الطاقة...`);
  await new Promise((r) => setTimeout(r, 3000));

  const staminaRecovered = Math.min(maxStamina - currentStamina, 40 + Math.floor(Math.random() * 20));
  const healthRecovered = Math.min(maxHealth - currentHealth, 30 + Math.floor(Math.random() * 20));
  const manaRecovered = Math.min(maxMana - currentMana, 25 + Math.floor(Math.random() * 15));

  user.rpg.stamina = Math.min(maxStamina, currentStamina + staminaRecovered);
  user.rpg.health = Math.min(maxHealth, currentHealth + healthRecovered);
  user.rpg.mana = Math.min(maxMana, currentMana + manaRecovered);

  db.save();

  await m.react("✨");
  return m.reply(
    `✨ *اكتمل الاسترخاء!*\n\n` +
      `*💖 تم الاستعادة:*\n` +
      `> ⚡ الطاقة: *+${staminaRecovered}* (${user.rpg.stamina}/${maxStamina})\n` +
      `> ❤️ الصحة: *+${healthRecovered}* (${user.rpg.health}/${maxHealth})\n` +
      `> 💙 المانا: *+${manaRecovered}* (${user.rpg.mana}/${maxMana})\n\n` +
      `> تشعر بتحسن كبير! 🌟`,
  );
}

export { pluginConfig as config, handler };