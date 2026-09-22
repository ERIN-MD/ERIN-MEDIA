// تاجر - أمر لبيع وشراء العناصر من تاجر NPC

import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "تاجر",
  alias: ["merchant"],
  category: "rpg",
  description: "بيع وشراء العناصر من تاجر NPC",
  usage: ".تاجر <شراء/بيع/قائمة> <العنصر> <الكمية>",
  example: ".تاجر شراء جرعة 5",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

const SHOP_ITEMS = {
  جرعة: { name: "🧪 جرعة", buyPrice: 100, sellPrice: 50, desc: "استعادة 50 نقطة صحة" },
  جرعة_مانا: { name: "💙 جرعة مانا", buyPrice: 150, sellPrice: 75, desc: "استعادة 50 نقطة مانا" },
  ترياق: { name: "💊 ترياق", buyPrice: 80, sellPrice: 40, desc: "علاج السم" },
  خبز: { name: "🍞 خبز", buyPrice: 30, sellPrice: 15, desc: "استعادة 10 طاقة" },
  مشروب_طاقة: { name: "⚡ مشروب طاقة", buyPrice: 200, sellPrice: 100, desc: "استعادة 50 طاقة" },
  معول: { name: "⛏️ معول", buyPrice: 500, sellPrice: 250, desc: "للتعدين" },
  صنارة: { name: "🎣 صنارة", buyPrice: 400, sellPrice: 200, desc: "للصيد" },
  خشب: { name: "🪵 خشب", buyPrice: 50, sellPrice: 25, desc: "مادة أساسية" },
  حديد: { name: "🔩 حديد", buyPrice: 80, sellPrice: 40, desc: "مادة معدنية" },
  جلد: { name: "🧶 جلد", buyPrice: 60, sellPrice: 30, desc: "مادة للدروع" },
  وتر: { name: "🧵 وتر", buyPrice: 40, sellPrice: 20, desc: "مادة للأقواس" },
  عشبة: { name: "🌿 عشبة", buyPrice: 70, sellPrice: 35, desc: "مادة للكيمياء" },
  ذهب: { name: "🪙 ذهب", buyPrice: 500, sellPrice: 250, desc: "مادة نادرة" },
  ماس: { name: "💎 ماس", buyPrice: 2000, sellPrice: 1000, desc: "مادة فاخرة" },
};

function handler(m) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.inventory) user.inventory = {};

  const args = m.args || [];
  const action = args[0]?.toLowerCase();
  const itemKey = args[1]?.toLowerCase();
  const qty = Math.max(1, parseInt(args[2]) || 1);

  if (!action || !["شراء", "بيع", "قائمة"].includes(action) && !["buy", "sell", "list"].includes(action)) {
    let txt = `🏪 *متجر التاجر*\n\n`;
    txt += `> مرحباً بك في المتجر!\n\n`;
    txt += `*📋 الأوامر:*\n`;
    txt += `> ${m.prefix}تاجر قائمة\n`;
    txt += `> ${m.prefix}تاجر شراء <العنصر> <الكمية>\n`;
    txt += `> ${m.prefix}تاجر بيع <العنصر> <الكمية>\n\n`;
    txt += `💰 *الرصيد:* ${(user.koin || 0).toLocaleString("ar-EG")}`;
    return m.reply(txt);
  }

  if (action === "list" || action === "قائمة") {
    let txt = `🏪 *قائمة العناصر*\n\n`;
    txt += `*📦 المتجر:*\n`;

    for (const [key, item] of Object.entries(SHOP_ITEMS)) {
      txt += `> ${item.name}\n`;
      txt += `> 💵 الشراء: ${item.buyPrice.toLocaleString("ar-EG")}\n`;
      txt += `> 💰 البيع: ${item.sellPrice.toLocaleString("ar-EG")}\n`;
      txt += `> 📝 ${item.desc}\n`;
      txt += `> → \`${key}\`\n`;
      txt += `> \n`;
    }

    return m.reply(txt);
  }

  if (action === "buy" || action === "شراء") {
    if (!itemKey) {
      return m.reply(`❌ حدد العنصر!\n\n> مثال: \`${m.prefix}تاجر شراء جرعة 5\``);
    }

    const item = SHOP_ITEMS[itemKey];
    if (!item) {
      return m.reply(`❌ العنصر غير موجود!\n\n> اكتب \`${m.prefix}تاجر قائمة\` لعرض القائمة.`);
    }

    const totalCost = item.buyPrice * qty;
    if ((user.koin || 0) < totalCost) {
      return m.reply(`❌ *الرصيد غير كافٍ*\n\n` + `> السعر: ${totalCost.toLocaleString("ar-EG")}\n` + `> رصيدك: ${(user.koin || 0).toLocaleString("ar-EG")}`);
    }

    user.koin -= totalCost;
    user.inventory[itemKey] = (user.inventory[itemKey] || 0) + qty;
    db.save();

    return m.reply(
      `✅ *تم الشراء بنجاح*\n\n` +
        `*🛒 التفاصيل:*\n` +
        `> 📦 العنصر: *${item.name}*\n` +
        `> 📊 الكمية: *${qty}*\n` +
        `> 💵 الإجمالي: *-${totalCost.toLocaleString("ar-EG")}*\n` +
        `> 💰 المتبقي: *${user.koin.toLocaleString("ar-EG")}*`,
    );
  }

  if (action === "sell" || action === "بيع") {
    if (!itemKey) {
      return m.reply(`❌ حدد العنصر!\n\n> مثال: \`${m.prefix}تاجر بيع حديد 10\``);
    }

    const item = SHOP_ITEMS[itemKey];
    if (!item) {
      return m.reply(`❌ هذا العنصر لا يمكن بيعه للتاجر!`);
    }

    const have = user.inventory[itemKey] || 0;
    if (have < qty) {
      return m.reply(`❌ *العنصر غير كافٍ*\n\n` + `> لديك: ${have}\n` + `> تريد بيع: ${qty}`);
    }

    const totalEarn = item.sellPrice * qty;
    user.koin = (user.koin || 0) + totalEarn;
    user.inventory[itemKey] -= qty;
    if (user.inventory[itemKey] <= 0) delete user.inventory[itemKey];
    db.save();

    return m.reply(
      `✅ *تم البيع بنجاح*\n\n` +
        `*💰 التفاصيل:*\n` +
        `> 📦 العنصر: *${item.name}*\n` +
        `> 📊 الكمية: *${qty}*\n` +
        `> 💵 الإجمالي: *+${totalEarn.toLocaleString("ar-EG")}*\n` +
        `> 💰 الرصيد: *${user.koin.toLocaleString("ar-EG")}*`,
    );
  }
}

export { pluginConfig as config, handler };