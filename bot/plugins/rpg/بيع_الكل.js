// بيع_الكل - أمر لبيع جميع العناصر القابلة للبيع دفعة واحدة

import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "بيع_الكل",
  alias: ["sellall"],
  category: "rpg",
  description: "بيع جميع العناصر القابلة للبيع دفعة واحدة",
  usage: ".بيع_الكل",
  example: ".بيع_الكل",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 30,
  energi: 0,
  isEnabled: true,
};

const SELL_PRICES = {
  حجر: 20,
  فحم: 50,
  حديد: 200,
  ذهب: 1000,
  ماس: 5000,
  زمرد: 10000,
  نفايات: 10,
  سمكة: 100,
  جمبري: 200,
  أخطبوط: 500,
  قرش: 2000,
  حوت: 10000,
  خشب: 30,
  عصا: 15,
  تفاح: 50,
  مطاط: 100,
  أرنب: 150,
  غزال: 300,
  خنزير_بري: 500,
  دب: 1000,
  أسد: 2000,
  تنين: 10000,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.inventory) user.inventory = {};

  let totalEarned = 0;
  let soldItems = [];

  for (const [item, price] of Object.entries(SELL_PRICES)) {
    const qty = user.inventory[item] || 0;
    if (qty > 0) {
      const earned = qty * price;
      totalEarned += earned;
      soldItems.push({ item, qty, earned });
      user.inventory[item] = 0;
    }
  }

  if (soldItems.length === 0) {
    return m.reply(`❌ *لا توجد عناصر*\n\n> لا توجد عناصر قابلة للبيع!`);
  }

  user.koin = (user.koin || 0) + totalEarned;

  db.save();

  let txt = `💰 *تم البيع بنجاح*\n\n`;
  txt += `*📦 العناصر المباعة:*\n`;
  for (const s of soldItems.slice(0, 10)) {
    txt += `> ${s.item}: ${s.qty}× = ${s.earned.toLocaleString("ar-EG")} عملة\n`;
  }
  if (soldItems.length > 10) {
    txt += `> ... و ${soldItems.length - 10} عنصر آخر\n`;
  }
  txt += `\n\n`;
  txt += `> 💵 الإجمالي: *${totalEarned.toLocaleString("ar-EG")}* عملة`;

  await m.reply(txt);
}

export { pluginConfig as config, handler };