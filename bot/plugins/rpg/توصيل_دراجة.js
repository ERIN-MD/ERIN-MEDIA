// توصيل_دراجة - أمر للعمل كسائق توصيل لكسب المال

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "توصيل_دراجة",
  alias: ["ngojek"],
  category: "rpg",
  description: "العمل كسائق توصيل لكسب المال",
  usage: ".توصيل_دراجة",
  example: ".توصيل_دراجة",
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

  const staminaCost = 15;
  user.rpg.stamina = user.rpg.stamina ?? 100;

  if (user.rpg.stamina < staminaCost) {
    return m.reply(`محرك الدراجة ساخن جداً، استرح قليلاً! 🥵🏍️💨\n\nالتوصيل يحتاج *${staminaCost}* طاقة، طاقتك المتبقية *${user.rpg.stamina}*. اشرب قهوة! ☕`);
  }

  user.rpg.stamina -= staminaCost;

  await m.react("🏍️");

  const orders = [
    { type: "🍔 طعام", distance: "2كم", min: 5000, max: 15000 },
    { type: "👤 ركاب", distance: "5كم", min: 10000, max: 25000 },
    { type: "📦 طرود", distance: "3كم", min: 8000, max: 20000 },
    { type: "🛒 مشتريات", distance: "4كم", min: 12000, max: 30000 },
    { type: "👥 ركاب+" , distance: "10كم", min: 20000, max: 50000 },
  ];

  const order = orders[Math.floor(Math.random() * orders.length)];
  const earning = Math.floor(Math.random() * (order.max - order.min + 1)) + order.min;
  const tips = Math.random() > 0.7 ? Math.floor(Math.random() * 5000) + 1000 : 0;
  const totalEarning = earning + tips;

  await m.reply(`شغل المحرك! ابحث عن ركاب... 🏍️💨\nطلب *${order.type}* لمسافة *${order.distance}*، انطلق! 🗺️`);
  await new Promise((r) => setTimeout(r, 3000));

  user.koin = (user.koin || 0) + totalEarning;

  const expGain = Math.floor(totalEarning / 20);
  const levelResult = await addExpWithLevelCheck(sock, m, db, user, expGain);

  db.save();

  await m.react("✅");

  let txt = `الحمد لله! انتهى الطلب! 🏍️✨\n\n`;
  txt += `تفاصيل التوصيل:\n`;
  txt += `📱 النوع: *${order.type}*\n`;
  txt += `💵 الأجرة: *+${earning.toLocaleString("ar-EG")}* عملة\n`;
  if (tips > 0) {
    txt += `🎁 إكرامية العميل: *+${tips.toLocaleString("ar-EG")}* عملة\n`;
  }
  txt += `📈 الخبرة: *+${expGain}*\n`;
  txt += `⚡ الطاقة المستهلكة: *-${staminaCost}*\n\n`;
  txt += `ممتاز! عد للتوصيل مرة أخرى! 🔥💪`;

  m.reply(txt);
}

export { pluginConfig as config, handler };