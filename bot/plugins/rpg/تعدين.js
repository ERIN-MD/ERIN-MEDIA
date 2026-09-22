// تعدين - أمر للتعدين للحصول على الخامات والأحجار الكريمة

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "تعدين",
  alias: ["mining"],
  category: "rpg",
  description: "التعدين للحصول على الخامات والأحجار الكريمة",
  usage: ".تعدين",
  example: ".تعدين",
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

  const staminaCost = 20;
  user.rpg.stamina = user.rpg.stamina || 100;

  if (user.rpg.stamina < staminaCost) {
    return m.reply(`طاقتك منخفضة جداً! 🥵\n\nالتعدين يحتاج *${staminaCost}* طاقة. طاقتك المتبقية *${user.rpg.stamina}*. استرح أولاً! 🛌💤`);
  }

  user.rpg.stamina -= staminaCost;

  await m.react("⛏️");
  await m.reply("دق! دق! ⛏️💎\nتكسير الصخور في أعماق الكهف...");
  await new Promise((r) => setTimeout(r, 3000));

  const drops = [
    { item: "حجر", chance: 80, name: "🪨 حجر", min: 2, max: 5 },
    { item: "فحم", chance: 50, name: "⚫ فحم", min: 1, max: 3 },
    { item: "حديد", chance: 30, name: "⛓️ حديد", min: 1, max: 2 },
    { item: "ذهب", chance: 15, name: "🥇 ذهب", min: 1, max: 1 },
    { item: "ماس", chance: 5, name: "💠 ماس", min: 1, max: 1 },
    { item: "زمرد", chance: 2, name: "💚 زمرد", min: 1, max: 1 },
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
    user.inventory["حجر"] = (user.inventory["حجر"] || 0) + 1;
    results.push({ name: "🪨 حجر", qty: 1 });
  }

  const expGain = Math.floor(Math.random() * 500) + 100;
  const levelResult = await addExpWithLevelCheck(sock, m, db, user, expGain);

  db.save();

  await m.react("✅");

  let txt = `تحطمت الصخرة! ⛏️✨\n\n`;
  txt += `حصلت على المواد التالية:\n`;
  for (const r of results) {
    txt += `• ${r.name}: *+${r.qty}*\n`;
  }
  txt += `\n📈 الخبرة: *+${expGain}*\n`;
  txt += `⚡ الطاقة المستهلكة: *-${staminaCost}*\n\n`;
  txt += `احتفظ بها جيداً، يمكنك استخدامها في الصنع أو البيع! 💎💰`;

  await m.reply(txt);
}

export { pluginConfig as config, handler };