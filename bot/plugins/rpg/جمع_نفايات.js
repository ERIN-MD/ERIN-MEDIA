// جمع_نفايات - أمر لجمع النفايات للحصول على عناصر

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "جمع_نفايات",
  alias: ["mulung"],
  category: "rpg",
  description: "جمع النفايات للحصول على عناصر",
  usage: ".جمع_نفايات",
  example: ".جمع_نفايات",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 300,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};
  if (!user.inventory) user.inventory = {};

  const staminaCost = 15;
  user.rpg.stamina = user.rpg.stamina ?? 100;

  if (user.rpg.stamina < staminaCost) {
    return m.reply(`جمع النفايات يحتاج طاقة! 🥵🗑️\n\nطاقتك المتبقية *${user.rpg.stamina}*، تحتاج *${staminaCost}*. استرح أولاً! 🛌💤`);
  }

  user.rpg.stamina -= staminaCost;

  await m.react("🗑️");
  await m.reply(`تبحث في صناديق القمامة بأمل... 🗑️👀\nأتمنى أن تجد شيئاً جيداً اليوم! ✨`);
  await new Promise((r) => setTimeout(r, 3000));

  const drops = [
    { item: "زجاجة", name: "🍶 زجاجة", min: 1, max: 10 },
    { item: "علبة", name: "🥫 علبة", min: 1, max: 8 },
    { item: "كرتون", name: "📦 كرتون", min: 1, max: 5 },
    { item: "نفايات", name: "🗑️ نفايات", min: 1, max: 15 },
    { item: "جريدة", name: "📰 جريدة", min: 0, max: 3 },
  ];

  let results = [];
  let moneyEarned = 0;

  for (const drop of drops) {
    const qty = Math.floor(Math.random() * (drop.max - drop.min + 1)) + drop.min;
    if (qty > 0) {
      user.inventory[drop.item] = (user.inventory[drop.item] || 0) + qty;
      results.push({ name: drop.name, qty });
      moneyEarned += qty * Math.floor(Math.random() * 50 + 10);
    }
  }

  user.koin = (user.koin || 0) + moneyEarned;

  const expGain = Math.floor(Math.random() * 200) + 50;
  const levelResult = await addExpWithLevelCheck(sock, m, db, user, expGain);

  db.save();

  await m.react("✅");

  let txt = `وجدت نفايات! 🗑️💸\n\n`;
  txt += `جمعت هذه العناصر:\n`;
  for (const r of results) {
    txt += `• ${r.name}: *+${r.qty}*\n`;
  }
  txt += `\nتم بيع النفايات فوراً!\n`;
  txt += `💵 أرباح البيع: *+${moneyEarned.toLocaleString("ar-EG")}* عملة\n`;
  txt += `📈 الخبرة: *+${expGain}*\n`;
  txt += `⚡ الطاقة المستهلكة: *-${staminaCost}*\n\n`;
  txt += `استمر في جمع النفايات حتى تصبح غنياً! 🔥🚀`;

  m.reply(txt);
}

export { pluginConfig as config, handler };