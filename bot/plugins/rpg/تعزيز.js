// تعزيز - أمر لترقية المعدات بالتعزيز

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "تعزيز",
  alias: ["enchant"],
  category: "rpg",
  description: "ترقية المعدات بالتعزيز",
  usage: ".تعزيز <العنصر>",
  example: ".تعزيز سيف",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 120,
  energi: 2,
  isEnabled: true,
};

const ENCHANTABLE = {
  سيف: { name: "⚔️ سيف", stat: "هجوم", bonus: 5, cost: 500, successRate: 70 },
  درع: { name: "🛡️ درع", stat: "دفاع", bonus: 4, cost: 500, successRate: 70 },
  درع_جسم: { name: "🦺 درع كامل", stat: "صحة", bonus: 20, cost: 800, successRate: 60 },
  خوذة: { name: "⛑️ خوذة", stat: "دفاع", bonus: 3, cost: 400, successRate: 75 },
  قوس: { name: "🏹 قوس", stat: "هجوم", bonus: 4, cost: 450, successRate: 72 },
  سيف_ذهبي: { name: "🗡️ سيف ذهبي", stat: "هجوم", bonus: 10, cost: 2000, successRate: 50 },
  درع_ماسي: { name: "💎 درع ماسي", stat: "صحة", bonus: 50, cost: 5000, successRate: 40 },
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.inventory) user.inventory = {};
  if (!user.rpg) user.rpg = {};
  if (!user.rpg.enchants) user.rpg.enchants = {};

  const args = m.args || [];
  const itemName = args[0]?.toLowerCase();

  if (!itemName) {
    let txt = `✨ *تعزيز وترقية المعدات*\n\n`;
    txt += `> قم بترقية معداتك للحصول على مكافآت إضافية!\n\n`;
    txt += `*📦 العناصر القابلة للتعزيز:*\n\n`;

    for (const [key, item] of Object.entries(ENCHANTABLE)) {
      const currentLevel = user.rpg.enchants[key] || 0;
      txt += `> ${item.name}\n`;
      txt += `> 📊 المستوى: ${currentLevel}/10\n`;
      txt += `> 💪 المكافأة: +${item.bonus} ${item.stat}\n`;
      txt += `> 💰 التكلفة: ${item.cost.toLocaleString("ar-EG")}\n`;
      txt += `> 🎯 نسبة النجاح: ${item.successRate}%\n`;
      txt += `> → \`${key}\`\n> \n`;
    }

    return m.reply(txt);
  }

  const item = ENCHANTABLE[itemName];
  if (!item) {
    return m.reply(`❌ هذا العنصر غير قابل للتعزيز!\n\n> اكتب \`${m.prefix}تعزيز\` لعرض القائمة.`);
  }

  if ((user.inventory[itemName] || 0) < 1) {
    return m.reply(`❌ ليس لديك ${item.name}!`);
  }

  const currentLevel = user.rpg.enchants[itemName] || 0;
  if (currentLevel >= 10) {
    return m.reply(`❌ ${item.name} بالفعل في المستوى الأقصى (10)!`);
  }

  const cost = item.cost * (currentLevel + 1);
  if ((user.koin || 0) < cost) {
    return m.reply(`❌ *الرصيد غير كافٍ*\n\n` + `> المطلوب: ${cost.toLocaleString("ar-EG")}\n` + `> رصيدك: ${(user.koin || 0).toLocaleString("ar-EG")}`);
  }

  user.koin -= cost;

  await m.react("✨");
  await m.reply(`✨ *جاري تعزيز ${item.name}...*\n\n> المستوى ${currentLevel} → ${currentLevel + 1}`);
  await new Promise((r) => setTimeout(r, 2000));

  const adjustedRate = Math.max(20, item.successRate - currentLevel * 5);
  const isSuccess = Math.random() * 100 < adjustedRate;

  if (isSuccess) {
    user.rpg.enchants[itemName] = currentLevel + 1;
    user.rpg[item.stat] = (user.rpg[item.stat] || 0) + item.bonus;

    await addExpWithLevelCheck(sock, m, db, user, 150);
    db.save();

    await m.react("🎉");
    return m.reply(
      `🎉 *نجح التعزيز!*\n\n` +
        `*✨ النتيجة:*\n` +
        `> 📦 العنصر: *${item.name}*\n` +
        `> 📊 المستوى: *${currentLevel} → ${currentLevel + 1}*\n` +
        `> 💪 المكافأة: *+${item.bonus} ${item.stat}*\n` +
        `> 💰 التكلفة: *-${cost.toLocaleString("ar-EG")}*\n` +
        `> ✨ الخبرة: *+150*`,
    );
  } else {
    db.save();

    await m.react("💔");
    return m.reply(
      `💔 *فشل التعزيز!*\n\n` +
        `*😢 النتيجة:*\n` +
        `> 📦 العنصر: *${item.name}*\n` +
        `> 📊 المستوى: *${currentLevel}* (لم يرتفع)\n` +
        `> 💰 التكلفة: *-${cost.toLocaleString("ar-EG")}* (ضاعت)\n\n` +
        `💡 *نصيحة:* حاول مرة أخرى! نسبة النجاح: ${adjustedRate}%`,
    );
  }
}

export { pluginConfig as config, handler };