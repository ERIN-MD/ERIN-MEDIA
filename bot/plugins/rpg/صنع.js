// صنع - أمر لصنع عناصر من المواد الخام

import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "صنع",
  alias: ["craft"],
  category: "rpg",
  description: "صنع عناصر من المواد الخام",
  usage: ".صنع <العنصر>",
  example: ".صنع سيف",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 30,
  energi: 0,
  isEnabled: true,
};

const RECIPES = {
  سيف: {
    name: "⚔️ سيف حديدي",
    materials: { حديد: 5, فحم: 3 },
    result: "سيف",
    bonus: { هجوم: 10 },
  },
  درع: {
    name: "🛡️ درع حديدي",
    materials: { حديد: 10, فحم: 5 },
    result: "درع",
    bonus: { دفاع: 15 },
  },
  معول: {
    name: "⛏️ معول ماسي",
    materials: { ماس: 3, حديد: 2 },
    result: "معول",
    bonus: { تعدين: 20 },
  },
  صنارة: {
    name: "🎣 صنارة ذهبية",
    materials: { ذهب: 5, حديد: 2 },
    result: "صنارة",
    bonus: { صيد: 20 },
  },
  جرعة: {
    name: "🥤 جرعة صحة",
    materials: { سمكة: 3, أرنب: 2 },
    result: "جرعة",
    qty: 2,
  },
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.inventory) user.inventory = {};
  if (!user.rpg) user.rpg = {};

  const args = m.args || [];
  const itemKey = args[0]?.toLowerCase();

  if (!itemKey) {
    let txt = `مرحباً أيها المغامر! ماذا تريد أن تصنع اليوم؟ 🛠️✨\n\n`;
    txt += `*قائمة وصفات الصنع:*\n`;

    for (const [key, recipe] of Object.entries(RECIPES)) {
      txt += `\n*${recipe.name}*\n`;
      txt += `📦 المواد المطلوبة:\n`;
      for (const [mat, qty] of Object.entries(recipe.materials)) {
        const userHas = user.inventory[mat] || 0;
        const status = userHas >= qty ? "✅" : "❌";
        txt += `• ${status} ${mat}: ${userHas}/${qty}\n`;
      }
      txt += `👉 اكتب: \`.صنع ${key}\`\n`;
    }

    return m.reply(txt);
  }

  const recipe = RECIPES[itemKey];
  if (!recipe) {
    return m.reply(`هذا العنصر غير موجود في القائمة! 😂\nتحقق من القائمة باستخدام \`.صنع\``);
  }

  const missingMaterials = [];
  for (const [mat, qty] of Object.entries(recipe.materials)) {
    if ((user.inventory[mat] || 0) < qty) {
      missingMaterials.push(`• ${mat}: ${user.inventory[mat] || 0}/${qty}`);
    }
  }
  
  if (missingMaterials.length > 0) {
      return m.reply(`المواد غير كافية لصنع *${recipe.name}*! 😭\n\nالناقص:\n${missingMaterials.join("\n")}\n\nاجمع المواد أولاً ثم عد! 🏃💨`);
  }

  await m.react("🛠️");
  await m.reply(`دق دق... طرق طرق... 🛠️🔩\nأعمل بجد لصنع *${recipe.name}*... سيكون جاهزاً قريباً!`);
  await new Promise((r) => setTimeout(r, 2000));

  for (const [mat, qty] of Object.entries(recipe.materials)) {
    user.inventory[mat] -= qty;
  }

  const resultQty = recipe.qty || 1;
  user.inventory[recipe.result] = (user.inventory[recipe.result] || 0) + resultQty;

  if (recipe.bonus) {
    for (const [stat, value] of Object.entries(recipe.bonus)) {
      user.rpg[stat] = (user.rpg[stat] || 0) + value;
    }
  }

  await m.react("✅");

  // ترجمة أسماء الإحصائيات
  const statNames = {
    هجوم: "هجوم",
    دفاع: "دفاع",
    تعدين: "تعدين",
    صيد: "صيد"
  };

  let txt = `رائع! تم الصنع بنجاح! 🎉🛠️\n\n`;
  txt += `لقد صنعت:\n`;
  txt += `📦 العنصر: *${recipe.name} ×${resultQty}*\n`;

  if (recipe.bonus) {
    txt += `\n*المكافآت النشطة:*\n`;
    for (const [stat, value] of Object.entries(recipe.bonus)) {
      const statName = statNames[stat] || stat.toUpperCase();
      txt += `📈 ${statName}: *+${value}*\n`;
    }
  }

  await m.reply(txt);
}

export { pluginConfig as config, handler };