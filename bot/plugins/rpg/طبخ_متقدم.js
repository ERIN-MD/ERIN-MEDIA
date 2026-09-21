// طبخ_متقدم - أمر لطهي الطعام لاستعادة الطاقة والصحة والمانا

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "طبخ_متقدم",
  alias: ["cooking"],
  category: "rpg",
  description: "طهي الطعام لاستعادة الطاقة والصحة والمانا",
  usage: ".طبخ_متقدم <الوصفة>",
  example: ".طبخ_متقدم أرز_مقلي",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 60,
  energi: 1,
  isEnabled: true,
};

const RECIPES = {
  خبز: { name: "🍞 خبز", materials: { قمح: 2 }, effect: { stamina: 10, health: 5 }, exp: 30 },
  أرز_مقلي: { name: "🍚 أرز مقلي", materials: { أرز: 2, بيض: 1 }, effect: { stamina: 25, health: 15 }, exp: 60 },
  شريحة_لحم: { name: "🥩 شريحة لحم", materials: { لحم: 2, عشبة: 1 }, effect: { stamina: 40, health: 30 }, exp: 100 },
  شوربة: { name: "🍲 شوربة", materials: { جزر: 2, بطاطس: 2, لحم: 1 }, effect: { stamina: 35, health: 40 }, exp: 90 },
  سوشي: { name: "🍣 سوشي", materials: { سمكة: 3, أرز: 2 }, effect: { stamina: 30, health: 25 }, exp: 80 },
  كعكة: { name: "🍰 كعكة", materials: { قمح: 3, بيض: 2, فراولة: 2 }, effect: { stamina: 50, health: 20 }, exp: 120 },
  رامين: { name: "🍜 رامين", materials: { قمح: 2, بيض: 1, لحم: 1, عشبة: 1 }, effect: { stamina: 45, health: 35 }, exp: 110 },
  بيتزا: { name: "🍕 بيتزا", materials: { قمح: 3, طماطم: 2, لحم: 2 }, effect: { stamina: 60, health: 30 }, exp: 140 },
  عصير: { name: "🥤 عصير", materials: { فراولة: 3, بطيخ: 1 }, effect: { stamina: 30, مانا: 20 }, exp: 70 },
  طعام_سحري: { name: "✨ طعام سحري", materials: { عشبة: 5, ماس: 1, ذهب: 2 }, effect: { stamina: 100, health: 100, mana: 50 }, exp: 300 },
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.inventory) user.inventory = {};
  if (!user.rpg) user.rpg = {};

  const args = m.args || [];
  const recipeName = args[0]?.toLowerCase();

  if (!recipeName) {
    let txt = `مرحباً أيها الطاهي الرئيسي! أي وصفة تريد طهيها اليوم؟ 👨‍🍳🍳\n\n`;
    txt += `*قائمة الوصفات السرية:*\n`;

    for (const [key, recipe] of Object.entries(RECIPES)) {
      const mats = Object.entries(recipe.materials)
        .map(([m, qty]) => `${qty}x ${m}`)
        .join(", ");
      const effects = Object.entries(recipe.effect)
        .map(([e, v]) => `+${v} ${e}`)
        .join(", ");
      txt += `\n*${recipe.name}*\n`;
      txt += `📦 المواد: ${mats}\n`;
      txt += `💫 التأثير: ${effects}\n`;
      txt += `👉 اكتب: \`.طبخ_متقدم ${key}\`\n`;
    }

    return m.reply(txt);
  }

  const recipe = RECIPES[recipeName];
  if (!recipe) {
    return m.reply(`هذه الوصفة غير موجودة في قائمة الطعام! 😂\nتحقق من القائمة باستخدام \`.طبخ_متقدم\``);
  }

  const missingMaterials = [];
  for (const [material, needed] of Object.entries(recipe.materials)) {
    const have = user.inventory[material] || 0;
    if (have < needed) {
      missingMaterials.push(`• ${material}: ${have}/${needed}`);
    }
  }

  if (missingMaterials.length > 0) {
    return m.reply(`المواد غير كافية لطهي *${recipe.name}*! 😭\n\nالناقص:\n${missingMaterials.join("\n")}\n\nاجمع المواد أولاً! 🛒🏃`);
  }

  await m.react("👨‍🍳");
  await m.reply(`ششش... طقطقة... 🔥🍳\nأطبخ *${recipe.name}*، رائحته تملأ المكان! 🤤`);
  await new Promise((r) => setTimeout(r, 3000));

  for (const [material, needed] of Object.entries(recipe.materials)) {
    user.inventory[material] -= needed;
    if (user.inventory[material] <= 0) delete user.inventory[material];
  }

  const userLevel = user.level || 1;
  const maxStamina = 100;
  const maxHealth = 100 + userLevel * 5;
  const maxMana = 50 + userLevel * 3;

  if (recipe.effect.stamina) {
    user.rpg.stamina = Math.min(maxStamina, (user.rpg.stamina ?? 100) + recipe.effect.stamina);
  }
  if (recipe.effect.health) {
    user.rpg.health = Math.min(maxHealth, (user.rpg.health || 100) + recipe.effect.health);
  }
  if (recipe.effect.mana) {
    user.rpg.mana = Math.min(maxMana, (user.rpg.mana || 50) + recipe.effect.mana);
  }

  await addExpWithLevelCheck(sock, m, db, user, recipe.exp);
  db.save();

  await m.react("✅");

  // ترجمة أسماء التأثيرات
  const effectNames = {
    stamina: "طاقة",
    health: "صحة",
    mana: "مانا"
  };

  const effectTexts = Object.entries(recipe.effect)
    .map(([e, v]) => `• ${effectNames[e] || e.toUpperCase()}: +${v}`)
    .join("\n");

  return m.reply(
    `هاهو! الطعام جاهز! 🍽️✨\n\n` +
      `أكلت *${recipe.name}* اللذيذ!\n` +
      `التأثيرات التي حصلت عليها:\n` +
      `${effectTexts}\n\n` +
      `📈 خبرة الطهي الإضافية: *+${recipe.exp}*\n\n` +
      `شبعان جداً، جاهز للقتال! 🔥`
  );
}

export { pluginConfig as config, handler };