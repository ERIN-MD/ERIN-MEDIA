// تدريب - أمر للتدريب لتحسين الإحصائيات

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "تدريب",
  alias: ["training"],
  category: "rpg",
  description: "التدريب لتحسين الإحصائيات",
  usage: ".تدريب <هجوم/دفاع/صحة>",
  example: ".تدريب هجوم",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 180,
  energi: 1,
  isEnabled: true,
};

const TRAINING_TYPES = {
  هجوم: { name: "⚔️ تدريب الهجوم", stat: "هجوم", bonus: [1, 3], exp: 80, staminaCost: 20 },
  دفاع: { name: "🛡️ تدريب الدفاع", stat: "دفاع", bonus: [1, 2], exp: 70, staminaCost: 15 },
  صحة: { name: "❤️ تدريب الصحة", stat: "صحة", bonus: [5, 15], exp: 90, staminaCost: 25 },
  سرعة: { name: "💨 تدريب السرعة", stat: "سرعة", bonus: [1, 2], exp: 75, staminaCost: 18 },
  حظ: { name: "🍀 تدريب الحظ", stat: "حظ", bonus: [1, 2], exp: 85, staminaCost: 22 },
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};

  const args = m.args || [];
  const trainType = args[0]?.toLowerCase();

  if (!trainType) {
    let txt = `🏋️ *نظام التدريب*\n\n`;
    txt += `> تدرب لتحسين إحصائياتك!\n\n`;
    txt += `*📊 إحصائياتك الحالية:*\n`;
    txt += `> ⚔️ الهجوم: *${user.rpg.هجوم || 10}*\n`;
    txt += `> 🛡️ الدفاع: *${user.rpg.دفاع || 5}*\n`;
    txt += `> ❤️ الصحة: *${user.rpg.صحة || 100}*\n`;
    txt += `> 💨 السرعة: *${user.rpg.سرعة || 10}*\n`;
    txt += `> 🍀 الحظ: *${user.rpg.حظ || 5}*\n`;
    txt += `> ⚡ الطاقة: *${user.rpg.stamina ?? 100}*\n\n`;
    txt += `*🏋️ أنواع التدريب:*\n`;
    for (const [key, train] of Object.entries(TRAINING_TYPES)) {
      txt += `> ${train.name}\n`;
      txt += `> ⚡ الطاقة: ${train.staminaCost}\n`;
      txt += `> → \`${m.prefix}تدريب ${key}\`\n> \n`;
    }
    return m.reply(txt);
  }

  const training = TRAINING_TYPES[trainType];
  if (!training) {
    return m.reply(`❌ هذا النوع من التدريب غير موجود!\n\n> اكتب \`${m.prefix}تدريب\` لعرض القائمة.`);
  }

  user.rpg.stamina = user.rpg.stamina ?? 100;

  if (user.rpg.stamina < training.staminaCost) {
    return m.reply(`⚡ *الطاقة غير كافية*\n\n` + `> المطلوب: ${training.staminaCost}\n` + `> لديك: ${user.rpg.stamina}\n\n` + `💡 استخدم \`.تأمل\` أو تناول الطعام`);
  }

  user.rpg.stamina -= training.staminaCost;

  await m.react("🏋️");
  await m.reply(`🏋️ *جاري تدريب ${training.name}...*`);
  await new Promise((r) => setTimeout(r, 2500));

  const statBonus = Math.floor(Math.random() * (training.bonus[1] - training.bonus[0] + 1)) + training.bonus[0];
  const currentStat = user.rpg[training.stat] || (training.stat === "صحة" ? 100 : training.stat === "هجوم" ? 10 : 5);
  user.rpg[training.stat] = currentStat + statBonus;

  await addExpWithLevelCheck(sock, m, db, user, training.exp);
  db.save();

  await m.react("💪");
  return m.reply(
    `💪 *اكتمل التدريب!*\n\n` +
      `*📊 النتيجة:*\n` +
      `> 🏋️ التدريب: *${training.name}*\n` +
      `> 📈 ${training.stat}: *${currentStat} → ${currentStat + statBonus}* (+${statBonus})\n` +
      `> ⚡ الطاقة المستهلكة: *-${training.staminaCost}*\n` +
      `> ✨ الخبرة: *+${training.exp}*`,
  );
}

export { pluginConfig as config, handler };