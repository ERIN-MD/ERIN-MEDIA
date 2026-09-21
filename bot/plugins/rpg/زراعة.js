// زراعة - أمر للزراعة للحصول على محصول

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "زراعة",
  alias: ["berladang"],
  category: "rpg",
  description: "الزراعة للحصول على محصول",
  usage: ".زراعة",
  example: ".زراعة",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 180,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};
  if (!user.inventory) user.inventory = {};

  const staminaCost = 20;
  user.rpg.stamina = user.rpg.stamina ?? 100;

  if (user.rpg.stamina < staminaCost) {
    return m.reply(`طاقتك منخفضة! 🥵\n\nتحتاج *${staminaCost}* طاقة للحراثة، لديك *${user.rpg.stamina}* طاقة.\nتناول الطعام أو استرح أولاً! 🛌💤`);
  }

  user.rpg.stamina -= staminaCost;

  await m.react("🌾");
  await m.reply(`جهز المعول واسقي الأرض... 🌱💧\nأتمنى أن يكون الحصاد وفيراً اليوم!`);
  await new Promise((r) => setTimeout(r, 3000));

  const crops = [
    { item: "أرز", name: "🌾 أرز", chance: 90, min: 2, max: 8, price: 100 },
    { item: "ذرة", name: "🌽 ذرة", chance: 70, min: 1, max: 5, price: 150 },
    { item: "طماطم", name: "🍅 طماطم", chance: 50, min: 1, max: 4, price: 200 },
    { item: "جزر", name: "🥕 جزر", chance: 40, min: 1, max: 3, price: 250 },
    { item: "فراولة", name: "🍓 فراولة", chance: 20, min: 1, max: 2, price: 500 },
    { item: "بطيخ", name: "🍈 بطيخ", chance: 10, min: 1, max: 1, price: 1000 },
  ];

  let results = [];
  let totalValue = 0;

  for (const crop of crops) {
    if (Math.random() * 100 <= crop.chance) {
      const qty = Math.floor(Math.random() * (crop.max - crop.min + 1)) + crop.min;
      user.inventory[crop.item] = (user.inventory[crop.item] || 0) + qty;
      const value = qty * crop.price;
      totalValue += value;
      results.push({ name: crop.name, qty, value });
    }
  }

  if (results.length === 0) {
    user.inventory["أرز"] = (user.inventory["أرز"] || 0) + 1;
    results.push({ name: "🌾 أرز", qty: 1, value: 100 });
    totalValue = 100;
  }

  const expGain = Math.floor(totalValue / 10) + Math.floor(Math.random() * 100);
  const levelResult = await addExpWithLevelCheck(sock, m, db, user, expGain);

  db.save();

  await m.react("✅");

  let txt = `حصاد وفير! 🚜🌾\n\n`;
  txt += `أرضك أنتجت الكثير اليوم:\n`;
  for (const r of results) {
    txt += `• ${r.name}: *+${r.qty}* (قيمة تقريبية ${r.value.toLocaleString("ar-EG")} عملة)\n`;
  }
  txt += `\n💰 إجمالي القيمة التقديرية: *${totalValue.toLocaleString("ar-EG")}* عملة\n`;
  txt += `📈 خبرة الفلاح: *+${expGain}*\n`;
  txt += `⚡ الطاقة المستخدمة: *-${staminaCost}*\n\n`;
  txt += `يمكنك بيع المحصول في السوق باستخدام \`${m.prefix}بيع_الكل\`! 🧺✨`;

  m.reply(txt);
}

export { pluginConfig as config, handler };