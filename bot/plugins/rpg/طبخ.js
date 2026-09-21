// طبخ - أمر لطهي الطعام لاستعادة الصحة

import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "طبخ",
  alias: ["cook"],
  category: "rpg",
  description: "طهي الطعام لاستعادة الصحة",
  usage: ".طبخ",
  example: ".طبخ",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 60,
  energi: 0,
  isEnabled: true,
};

const RECIPES = {
  شوربة_سمك: { name: "🍲 شوربة سمك", materials: { سمكة: 2 }, heal: 30 },
  لحم_مشوي: { name: "🍖 لحم مشوي", materials: { أرنب: 1, خشب: 1 }, heal: 40 },
  فطيرة_تفاح: { name: "🥧 فطيرة تفاح", materials: { تفاح: 3 }, heal: 25 },
  شريحة_لحم: { name: "🥩 شريحة لحم", materials: { خنزير_بري: 1, فحم: 1 }, heal: 60 },
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};
  if (!user.inventory) user.inventory = {};

  user.rpg.health = user.rpg.health || 100;
  user.rpg.maxHealth = user.rpg.maxHealth || 100;

  if (user.rpg.health >= user.rpg.maxHealth) {
    return m.reply(`معدتك ممتلئة! 🤢\nلا تطبخ الآن، ستتخم! 🏃💨`);
  }

  let cooked = null;
  for (const [key, recipe] of Object.entries(RECIPES)) {
    let canCook = true;
    for (const [mat, qty] of Object.entries(recipe.materials)) {
      if ((user.inventory[mat] || 0) < qty) {
        canCook = false;
        break;
      }
    }
    if (canCook) {
      cooked = { key, ...recipe };
      break;
    }
  }

  if (!cooked) {
    let txt = `مرحباً أيها الطاهي! ماذا تريد أن تطبخ اليوم؟ 🍳👨‍🍳\n\n`;
    txt += `قائمة الوصفات المتاحة:\n\n`;
    for (const [key, recipe] of Object.entries(RECIPES)) {
      txt += `*${recipe.name}*\n`;
      txt += `❤️ الاستشفاء: +${recipe.heal} نقطة صحة\n`;
      txt += `📦 المواد المطلوبة:\n`;
      for (const [mat, qty] of Object.entries(recipe.materials)) {
        const has = user.inventory[mat] || 0;
        txt += `• ${has >= qty ? "✅" : "❌"} ${mat}: ${has}/${qty}\n`;
      }
      txt += `\n`;
    }
    txt += `(سيقوم البوت تلقائياً بطهي أول وصفة تتوفر موادها!)`;
    return m.reply(txt);
  }

  for (const [mat, qty] of Object.entries(cooked.materials)) {
    user.inventory[mat] -= qty;
  }

  await m.react("🍳");
  await m.reply(`ششش... طقطقة... 🔥🍳\nأطبخ *${cooked.name}*، رائحته شهية! 🤤`);
  await new Promise((r) => setTimeout(r, 3000));

  const oldHealth = user.rpg.health;
  user.rpg.health = Math.min(user.rpg.health + cooked.heal, user.rpg.maxHealth);

  db.save();

  await m.react("✅");

  let txt = `أممم! الطعام جاهز! 🍽️✨\n\n`;
  txt += `أكلت *${cooked.name}* وشعرت بتحسن!\n`;
  txt += `❤️ الصحة: ${oldHealth} 📈 *${user.rpg.health}*\n\n`;
  txt += `استمر في المغامرة! 🚀🔥`;

  await m.reply(txt);
}

export { pluginConfig as config, handler };