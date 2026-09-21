// حداد - أمر لصنع الأسلحة والدروع من المواد

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "حداد",
  alias: ["blacksmith"],
  category: "rpg",
  description: "صنع الأسلحة والدروع من المواد",
  usage: ".حداد <العنصر>",
  example: ".حداد سيف",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 120,
  energi: 1,
  isEnabled: true,
};

const RECIPES = {
  سيف: { materials: { حديد: 3, خشب: 2 }, result: "سيف", name: "⚔️ سيف حديدي", exp: 200, price: 500 },
  درع: { materials: { حديد: 4, جلد: 2 }, result: "درع", name: "🛡️ درع حديدي", exp: 250, price: 600 },
  خوذة: { materials: { حديد: 2, جلد: 1 }, result: "خوذة", name: "⛑️ خوذة حديدية", exp: 150, price: 400 },
  درع_جسم: { materials: { حديد: 5, جلد: 3 }, result: "درع_جسم", name: "🦺 درع حديدي كامل", exp: 350, price: 800 },
  فأس: { materials: { حديد: 2, خشب: 3 }, result: "فأس", name: "🪓 فأس حديدي", exp: 180, price: 450 },
  معول: { materials: { حديد: 3, خشب: 2 }, result: "معول", name: "⛏️ معول", exp: 180, price: 450 },
  قوس: { materials: { خشب: 4, وتر: 2 }, result: "قوس", name: "🏹 قوس", exp: 200, price: 500 },
  سهم: { materials: { خشب: 1, حديد: 1 }, result: "سهم", name: "🏹 سهم ×10", exp: 50, price: 100, qty: 10 },
  سيف_ذهبي: { materials: { ذهب: 5, ماس: 2, حديد: 3 }, result: "سيف_ذهبي", name: "🗡️ سيف ذهبي", exp: 500, price: 2000 },
  درع_ماسي: { materials: { ماس: 8, حديد: 5, جلد: 3 }, result: "درع_ماسي", name: "💎 درع ماسي", exp: 800, price: 5000 },
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.inventory) user.inventory = {};
  if (!user.rpg) user.rpg = {};

  const args = m.args || [];
  const itemName = args[0]?.toLowerCase();

  if (!itemName) {
    let txt = `مرحباً أيها المغامر! مرحباً بك في ورشة الحداد! 🔨⚒️\nماذا تريد أن تصنع اليوم؟\n\n`;
    txt += `*قائمة الأسلحة والدروع:*\n`;

    for (const [key, recipe] of Object.entries(RECIPES)) {
      const mats = Object.entries(recipe.materials)
        .map(([m, qty]) => `${qty}x ${m}`)
        .join(", ");
      txt += `\n*${recipe.name}*\n`;
      txt += `📦 المواد: ${mats}\n`;
      txt += `📈 الخبرة: +${recipe.exp}\n`;
      txt += `👉 اكتب: \`.حداد ${key}\`\n`;
    }
    txt += `\n💡 *نصيحة:* يمكنك الحصول على المواد من \`.تعدين\` أو \`.صيد\`!`;

    return m.reply(txt);
  }

  const recipe = RECIPES[itemName];
  if (!recipe) {
    return m.reply(`هذه الوصفة غير موجودة في سجلاتي! 😂\nتحقق من القائمة باستخدام \`.حداد\`!`);
  }

  const missingMaterials = [];
  for (const [material, needed] of Object.entries(recipe.materials)) {
    const have = user.inventory[material] || 0;
    if (have < needed) {
      missingMaterials.push(`• ${material}: ${have}/${needed}`);
    }
  }

  if (missingMaterials.length > 0) {
    return m.reply(`المواد غير كافية لصنع *${recipe.name}*! 😭\n\nالناقص:\n${missingMaterials.join("\n")}\n\nاجمع المواد أولاً ثم عد! 🏃💨`);
  }

  await m.react("🔨");
  await m.reply(`دق! دق! تشش... 🔥🔨\nأشعل النار وأطرق الحديد لصنع *${recipe.name}*... العملية ستستغرق بعض الوقت!`);
  await new Promise((r) => setTimeout(r, 4000));

  for (const [material, needed] of Object.entries(recipe.materials)) {
    user.inventory[material] -= needed;
    if (user.inventory[material] <= 0) delete user.inventory[material];
  }

  const resultQty = recipe.qty || 1;
  user.inventory[recipe.result] = (user.inventory[recipe.result] || 0) + resultQty;

  await addExpWithLevelCheck(sock, m, db, user, recipe.exp);
  db.save();

  await m.react("✅");

  let txt = `تم الصنع بنجاح! ⚔️🛡️\n\n`;
  txt += `النتيجة رائعة! هذا ما صنعناه:\n`;
  txt += `🔨 العنصر: *${recipe.name}*\n`;
  txt += `📊 الكمية: *+${resultQty}*\n`;
  txt += `📈 خبرة الصنع: *+${recipe.exp}*\n\n`;
  txt += `جاهز للقتال! 😎🔥`;

  return m.reply(txt);
}

export { pluginConfig as config, handler };