// حطب - أمر لقطع الأشجار للحصول على الخشب

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "حطب",
  alias: ["woodcut"],
  category: "rpg",
  description: "قطع الأشجار للحصول على الخشب",
  usage: ".حطب",
  example: ".حطب",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 60,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};
  if (!user.inventory) user.inventory = {};

  const staminaCost = 15;
  user.rpg.stamina = user.rpg.stamina || 100;

  if (user.rpg.stamina < staminaCost) {
    return m.reply(`يديك متعبة من حمل الفأس! 🥵🪓\n\nالقطع يحتاج *${staminaCost}* طاقة، لديك *${user.rpg.stamina}* فقط. استرح! 🛌💤`);
  }

  user.rpg.stamina -= staminaCost;

  await m.react("🪓");
  await m.reply("دق! دق! سقطت! 🪓🌳\nقطع شجرة كبيرة بكل قوتك...");
  await new Promise((r) => setTimeout(r, 3000));

  const drops = [
    { item: "خشب", chance: 70, name: "🪵 خشب", min: 2, max: 5 },
    { item: "عصا", chance: 50, name: "🥢 عصا", min: 1, max: 3 },
    { item: "تفاح", chance: 20, name: "🍎 تفاح", min: 1, max: 2 },
    { item: "مطاط", chance: 10, name: "⚫ مطاط", min: 1, max: 1 },
  ];

  let results = [];
  for (const drop of drops) {
    if (Math.random() * 100 <= drop.chance) {
      const qty = Math.floor(Math.random() * (drop.max - drop.min + 1)) + drop.min;
      user.inventory[drop.item] = (user.inventory[drop.item] || 0) + qty;
      results.push({ name: drop.name, qty });
    }
  }

  if (results.length === 0) {
    user.inventory["خشب"] = (user.inventory["خشب"] || 0) + 1;
    results.push({ name: "🪵 خشب", qty: 1 });
  }

  const expGain = Math.floor(Math.random() * 200) + 50;
  const levelResult = await addExpWithLevelCheck(sock, m, db, user, expGain);

  db.save();

  await m.react("✅");

  let txt = `سقطت الشجرة! 🪓✨\n\n`;
  txt += `جمعت هذه العناصر:\n`;
  for (const r of results) {
    txt += `• ${r.name}: *+${r.qty}*\n`;
  }
  txt += `\n📈 الخبرة: *+${expGain}*\n`;
  txt += `⚡ الطاقة المستهلكة: *-${staminaCost}*\n\n`;
  txt += `انتبه لظهرك، استرح إذا تعبت (\`.تأمل\`)! 🥵🍃`;

  await m.reply(txt);
}

export { pluginConfig as config, handler };