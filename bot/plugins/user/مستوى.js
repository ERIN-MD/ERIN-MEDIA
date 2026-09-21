// مستوى - أمر للتحقق من مستوى المستخدم في واتساب

import { getDatabase } from "../../src/lib/maro-database.js";

const EXP_PER_LEVEL = 10000; // الخبرة المطلوبة لكل مستوى

// تكوين الأمر
const pluginConfig = {
  name: "مستوى",
  alias: ["level"],
  category: "user",
  description: "التحقق من مستوى المستخدم",
  usage: ".مستوى [@مستخدم]",
  example: ".مستوى",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  energi: 0,
  isEnabled: true,
};

// حساب المستوى بناءً على الخبرة
function calculateLevel(exp) {
  return Math.floor(exp / EXP_PER_LEVEL) + 1;
}

// حساب الخبرة المطلوبة لمستوى معين
function expForLevel(level) {
  return (level - 1) * EXP_PER_LEVEL;
}

// حساب الخبرة المتبقية للمستوى التالي
function expToNextLevel(exp) {
  const currentLevel = calculateLevel(exp);
  const nextLevelExp = expForLevel(currentLevel + 1);
  return nextLevelExp - exp;
}

// تحديد الرتبة بناءً على المستوى
function getRole(level) {
  if (level >= 100) return "🐉 أسطوري";
  if (level >= 80) return "⚔️ خرافي";
  if (level >= 60) return "💜 ملحمي";
  if (level >= 40) return "💪 سيد كبير";
  if (level >= 20) return "🎖️ سيد";
  if (level >= 10) return "⭐ نخبة";
  return "🛡️ محارب";
}

// إنشاء شريط التقدم
function getLevelBar(current, target) {
  const totalBars = 10;
  const filledBars = Math.min(
    Math.floor((current / target) * totalBars),
    totalBars,
  );
  const emptyBars = totalBars - filledBars;
  return "▰".repeat(filledBars) + "▱".repeat(emptyBars);
}

// المعالج الرئيسي للأمر
async function handler(m, { sock }) {
  const db = getDatabase();

  let targetJid = m.sender;
  let targetName = m.pushName || "أنت";

  // التحقق من وجود مستخدم مذكور أو مقتبس
  if (m.quoted) {
    targetJid = m.quoted.sender;
    targetName = m.quoted.pushName || targetJid.split("@")[0];
  } else if (m.mentionedJid?.length) {
    targetJid = m.mentionedJid[0];
    targetName = targetJid.split("@")[0];
  }

  // الحصول على بيانات المستخدم
  const user = db.getUser(targetJid) || db.setUser(targetJid);
  if (!user.rpg) user.rpg = {};

  // حساب البيانات
  const exp = user.exp || 0;
  const level = calculateLevel(exp);
  const role = getRole(level);
  const currentLevelExp = expForLevel(level);
  const nextLevelExp = expForLevel(level + 1);
  const expInLevel = exp - currentLevelExp;
  const expNeeded = nextLevelExp - currentLevelExp;
  const progress = getLevelBar(expInLevel, expNeeded);

  // إنشاء الرسالة
  let txt = `╭━━━━━━━━━━━━━━━━━╮\n`;
  txt += `┃ 📊 *معلومات المستوى*\n`;
  txt += `╰━━━━━━━━━━━━━━━━━╯\n\n`;

  txt += `╭┈┈⬡「 👤 *المستخدم* 」\n`;
  txt += `┃ 🏷️ الاسم: *${targetName}*\n`;
  txt += `┃ 🆔 المعرف: @${targetJid.split("@")[0]}\n`;
  txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`;

  txt += `╭┈┈⬡「 📈 *الإحصائيات* 」\n`;
  txt += `┃ 📊 المستوى: *${level}*\n`;
  txt += `┃ ${role}\n`;
  txt += `┃ 🚄 الخبرة: *${exp.toLocaleString("ar-EG")}*\n`;
  txt += `┃ 📊 التقدم:\n`;
  txt += `┃ ${progress}\n`;
  txt += `┃ ${expInLevel.toLocaleString("ar-EG")} / ${expNeeded.toLocaleString("ar-EG")}\n`;
  txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`;

  txt += `> المستوى التالي: *${expToNextLevel(exp).toLocaleString("ar-EG")} خبرة* متبقية!`;

  // إرسال الرسالة مع الإشارة للمستخدم
  await m.reply(txt, { mentions: [targetJid] });
}

// تصدير التكوين والمعالج والدوال المساعدة
export {
  pluginConfig as config,
  handler,
  calculateLevel,
  expForLevel,
  expToNextLevel,
  getRole,
};