// متجر - أمر لشراء وبيع عناصر RPG

import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "متجر",
  alias: ["shop"],
  category: "rpg",
  description: "شراء وبيع عناصر RPG",
  usage: ".متجر <شراء/بيع> <العنصر> <الكمية>",
  example: ".متجر شراء جرعة 1",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  energi: 0,
  isEnabled: true,
};

const ITEMS = {
  جرعة: { price: 500, type: "buyable", name: "🥤 جرعة صحة" },
  جرعة_مانا: { price: 500, type: "buyable", name: "🧪 جرعة مانا" },
  جرعة_طاقة: { price: 1000, type: "buyable", name: "⚡ جرعة طاقة" },

  صندوق_عادي: { price: 2000, type: "buyable", name: "📦 صندوق عادي" },
  صندوق_نادر: { price: 10000, type: "buyable", name: "🛍️ صندوق نادر" },
  صندوق_أسطوري: { price: 50000, type: "buyable", name: "🎁 صندوق أسطوري" },
  صندوق_خرافي: { price: 200000, type: "buyable", name: "💎 صندوق خرافي" },

  قمح: { price: 50, type: "buyable", name: "🌾 قمح" },
  أرز: { price: 50, type: "buyable", name: "🍚 أرز" },
  بيض: { price: 100, type: "buyable", name: "🥚 بيض" },
  لحم: { price: 300, type: "buyable", name: "🥩 لحم" },
  عشبة: { price: 150, type: "buyable", name: "🌿 عشبة" },
  جزر: { price: 50, type: "buyable", name: "🥕 جزر" },
  بطاطس: { price: 50, type: "buyable", name: "🥔 بطاطس" },
  فراولة: { price: 80, type: "buyable", name: "🍓 فراولة" },
  بطيخ: { price: 100, type: "buyable", name: "🍉 بطيخ" },
  تفاح: { price: 50, type: "buyable", name: "🍎 تفاح" },

  حجر: { price: 20, type: "sellable", name: "🪨 حجر" },
  فحم: { price: 50, type: "sellable", name: "⚫ فحم" },
  حديد: { price: 200, type: "sellable", name: "⛓️ حديد" },
  ذهب: { price: 1000, type: "sellable", name: "🥇 ذهب" },
  ماس: { price: 5000, type: "sellable", name: "💠 ماس" },
  زمرد: { price: 10000, type: "sellable", name: "💚 زمرد" },

  نفايات: { price: 10, type: "sellable", name: "🗑️ نفايات" },
  سمكة: { price: 100, type: "sellable", name: "🐟 سمكة" },
  جمبري: { price: 200, type: "sellable", name: "🦐 جمبري" },
  أخطبوط: { price: 500, type: "sellable", name: "🐙 أخطبوط" },
  قرش: { price: 2000, type: "sellable", name: "🦈 قرش" },
  حوت: { price: 10000, type: "sellable", name: "🐳 حوت" },
  
  جلد: { price: 50, type: "sellable", name: "👞 جلد" },
  صندوق_غامض: { price: 1500, type: "sellable", name: "📦 صندوق غامض" },
  كوناي: { price: 100, type: "sellable", name: "🗡️ كوناي" },
  شوريكين: { price: 150, type: "sellable", name: "⚔️ شوريكين" },
  تشاكرا: { price: 500, type: "sellable", name: "🌀 تشاكرا" },
  مخطوطة: { price: 2000, type: "sellable", name: "📜 مخطوطة نينجا" },
  رامن: { price: 800, type: "sellable", name: "🍜 رامن" },
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);
  const args = m.args || [];

  const action = args[0]?.toLowerCase();

  if (!action || (action !== "buy" && action !== "sell" && action !== "شراء" && action !== "بيع")) {
    let txt = `🏪 *متجر RPG* ✨\n\n`;
    txt += `مرحباً! مرحباً بك في المتجر.\nهل تريد شراء جرعة أو بيع خردة؟ 😂\n\n`;
    
    txt += `*طريقة الشراء/البيع:* 💸\n`;
    txt += `اكتب \`.متجر شراء <الاسم> <الكمية>\` للشراء.\n`;
    txt += `اكتب \`.متجر بيع <الاسم> <الكمية>\` للبيع.\n\n`;

    txt += `*🛍️ العناصر المتاحة للشراء:*\n`;
    for (const [key, item] of Object.entries(ITEMS)) {
      if (item.type === "buyable") {
        txt += `${item.name}: *${item.price.toLocaleString("ar-EG")}* عملة\n`;
      }
    }
    txt += `\n`;

    txt += `*💰 العناصر المقبولة للبيع:*\n`;
    for (const [key, item] of Object.entries(ITEMS)) {
      if (item.type === "sellable") {
        txt += `${item.name}: *${item.price.toLocaleString("ar-EG")}* عملة\n`;
      }
    }

    return m.reply(txt);
  }

  const itemKey = args[1]?.toLowerCase();
  const amount = parseInt(args[2]) || 1;

  // دعم الأسماء العربية والعناصر
  const isBuy = action === "buy" || action === "شراء";
  const isSell = action === "sell" || action === "بيع";

  if (!itemKey || !ITEMS[itemKey]) {
    return m.reply(`العنصر *${args[1] || "هذا"}* غير موجود! 😭❌\nتحقق من القائمة باستخدام \`.متجر\``);
  }

  const item = ITEMS[itemKey];

  if (isBuy) {
    if (item.type !== "buyable") {
      return m.reply(`العنصر *${item.name}* مخصص للبيع فقط! 🫣❌`);
    }

    const totalCost = item.price * amount;
    if ((user.koin || 0) < totalCost) {
      return m.reply(`رصيدك غير كافٍ لشراء *${amount}× ${item.name}*! 😭😭\nرصيدك: *${(user.koin || 0).toLocaleString("ar-EG")}* عملة\nتحتاج *${(totalCost - (user.koin || 0)).toLocaleString("ar-EG")}* إضافية. اربح المزيد! 💸🏃💨`);
    }

    user.koin = (user.koin || 0) - totalCost;
    user.inventory = user.inventory || {};
    user.inventory[itemKey] = (user.inventory[itemKey] || 0) + amount;

    db.save();
    return m.reply(`شكراً لتسوقك! 🎉✨\n\nاشتريت:\n🛒 العنصر: *${amount}× ${item.name}*\n💸 الإجمالي: *${totalCost.toLocaleString("ar-EG")}* عملة\n\nنحن في انتظارك مرة أخرى! 💖🛍️`);
  }

  if (isSell) {
    if (item.type !== "sellable") {
      return m.reply(`المتجر لا يقبل *${item.name}*! غير قابل للبيع 😂❌`);
    }

    const userInventory = user.inventory || {};
    const userStock = userInventory[itemKey] || 0;

    if (userStock < amount) {
      return m.reply(`لديك فقط *${userStock}× ${item.name}*، تريد بيع *${amount}*؟! 😂❌`);
    }

    const totalProfit = item.price * amount;

    user.inventory = user.inventory || {};
    user.inventory[itemKey] = userStock - amount;
    user.koin = (user.koin || 0) + totalProfit;

    db.save();
    return m.reply(`نقداً! 💰✨\n\nبعته:\n📦 العنصر: *${amount}× ${item.name}*\n🤑 الأرباح: *${totalProfit.toLocaleString("ar-EG")}* عملة\n\nشكراً لبيعك! 🎉💖`);
  }
}

export { pluginConfig as config, handler };