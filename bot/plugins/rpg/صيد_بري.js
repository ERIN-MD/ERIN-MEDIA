// صيد_بري - أمر لصيد الحيوانات البرية للحصول على اللحوم والجلود

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "صيد_بري",
  alias: ["hunt"],
  category: "rpg",
  description: "صيد الحيوانات البرية للحصول على اللحوم والجلود",
  usage: ".صيد_بري",
  example: ".صيد_بري",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 90,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};
  if (!user.inventory) user.inventory = {};

  const staminaCost = 25;
  user.rpg.stamina = user.rpg.stamina || 100;

  if (user.rpg.stamina < staminaCost) {
    return m.reply(`⚡ طاقتك منخفضة!\n\nتحتاج *${staminaCost}* طاقة للصيد.\nطاقتك المتبقية: *${user.rpg.stamina}*`);
  }

  user.rpg.stamina -= staminaCost;

  await m.reply("🏹 _تتسلل خلف الأدغال... تجهز السهم..._ 🌿🤫");
  await new Promise((r) => setTimeout(r, 2500));

  const animals = [
    { name: "🐰 أرنب بري", item: "أرنب", chance: 50, exp: 100 },
    { name: "🦌 غزال", item: "غزال", chance: 30, exp: 200 },
    { name: "🐗 خنزير بري", item: "خنزير_بري", chance: 20, exp: 300 },
    { name: "🐻 دب عسل", item: "دب", chance: 10, exp: 500 },
    { name: "🦁 أسد السافانا", item: "أسد", chance: 5, exp: 800 },
    { name: "🐉 تنين صغير", item: "تنين", chance: 1, exp: 2000 },
  ];

  const rand = Math.random() * 100;
  let caught = null;

  for (const animal of animals.sort((a, b) => a.chance - b.chance)) {
    if (rand <= animal.chance) {
      caught = animal;
      break;
    }
  }

  if (!caught) {
    caught = animals.find((a) => a.item === "أرنب");
  }

  user.inventory[caught.item] = (user.inventory[caught.item] || 0) + 1;
  const levelResult = await addExpWithLevelCheck(sock, m, db, user, caught.exp);

  db.save();

  let txt = `🏹 *صيد ناجح!* 🏹\n\n`;
  txt += `أصابت سهمك الهدف! لقد صطت:\n`;
  txt += `🎯 *${caught.name}* (+1)\n\n`;
  txt += `*نتيجة الصيد:*\n`;
  txt += `✨ الخبرة المكتسبة: *+${caught.exp}*\n`;
  txt += `⚡ الطاقة المستهلكة: *-${staminaCost}*`;

  await m.reply(txt);
}

export { pluginConfig as config, handler };