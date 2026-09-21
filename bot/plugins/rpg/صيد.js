// صيد - أمر لصيد الحيوانات للحصول على عناصر

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "صيد",
  alias: ["berburu"],
  category: "rpg",
  description: "صيد الحيوانات للحصول على عناصر",
  usage: ".صيد",
  example: ".صيد",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 120,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};
  if (!user.inventory) user.inventory = {};

  const staminaCost = 25;
  user.rpg.stamina = user.rpg.stamina ?? 100;

  if (user.rpg.stamina < staminaCost) {
    return m.reply(`طاقتك قليلة جداً! 😭⚡\n\nتحتاج *${staminaCost}* طاقة للصيد، لكن لديك فقط *${user.rpg.stamina}*.\nاسترح قليلاً! 🛌💤`);
  }

  user.rpg.stamina -= staminaCost;

  await m.react("🏹");
  await m.reply(`تتسلل بهدوء إلى الغابة... 🤫🌳\nجهز قوسك وأطلق السهم بدقة! 🏹👀`);
  await new Promise((r) => setTimeout(r, 3000));

  const animals = [
    { name: "🐰 أرنب", item: "لحم_أرنب", chance: 80, min: 1, max: 3, exp: 50, money: 500 },
    { name: "🦌 غزال", item: "لحم_غزال", chance: 50, min: 1, max: 2, exp: 100, money: 1500 },
    { name: "🐗 خنزير بري", item: "لحم_خنزير", chance: 40, min: 1, max: 2, exp: 150, money: 2000 },
    { name: "🦊 ثعلب", item: "فراء_ثعلب", chance: 30, min: 1, max: 1, exp: 200, money: 3000 },
    { name: "🐻 دب", item: "مخلب_دب", chance: 15, min: 1, max: 1, exp: 500, money: 10000 },
    { name: "🦁 أسد", item: "ناب_أسد", chance: 5, min: 1, max: 1, exp: 1000, money: 25000 },
  ];

  const caught = animals.filter((a) => Math.random() * 100 <= a.chance);

  if (caught.length === 0) {
    await m.react("😢");
    db.save();
    return m.reply(`للأسف، اليوم ليس يوماً جيداً! 😭😭\n\nجميع الحيوانات هربت، لم تحصل على شيء.\nخسرت *-${staminaCost}* طاقة. حاول مرة أخرى لاحقاً! 🥺🌿`);
  }

  let results = [];
  let totalExp = 0;
  let totalMoney = 0;

  for (const animal of caught.slice(0, 3)) {
    const qty = Math.floor(Math.random() * (animal.max - animal.min + 1)) + animal.min;
    user.inventory[animal.item] = (user.inventory[animal.item] || 0) + qty;
    totalExp += animal.exp * qty;
    totalMoney += animal.money * qty;
    results.push({ name: animal.name, qty, money: animal.money * qty });
  }

  user.koin = (user.koin || 0) + totalMoney;
  const levelResult = await addExpWithLevelCheck(sock, m, db, user, totalExp);

  db.save();

  await m.react("✅");

  let txt = `أصبت الهدف! 🎯🏹\n\nعدت بالصيد التالي:\n`;
  for (const r of results) {
    txt += `• ${r.name}: *+${r.qty} قطعة*\n`;
  }
  txt += `\nتم بيع الصيد تلقائياً! 🎉\n`;
  txt += `💸 العملات: *+${totalMoney.toLocaleString("ar-EG")}*\n`;
  txt += `📈 الخبرة: *+${totalExp}*\n`;
  txt += `⚡ الطاقة المستخدمة: *-${staminaCost}*\n\n`;
  txt += `ممتاز! عد للصيد مرة أخرى قريباً! 🔥🥩`;

  m.reply(txt);
}

export { pluginConfig as config, handler };