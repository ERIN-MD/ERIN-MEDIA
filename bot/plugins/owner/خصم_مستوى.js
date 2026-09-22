// خصم مستوى - أمر لحذف مستويات من المستخدمين

import { getDatabase } from "../../src/lib/maro-database.js";
import { calculateLevel, getRole } from "../user/مستوى.js";

const EXP_PER_LEVEL = 10000;

// تكوين الأمر
const pluginConfig = {
  name: "خصم_مستوى",
  alias: ["dellevel"],
  category: "owner",
  description: "خصم مستوى من مستخدم (عبر الخبرة)",
  usage: ".خصم_مستوى <الكمية> @المستخدم",
  example: ".خصم_مستوى 5 @المستخدم",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  energi: 0,
  isEnabled: true,
};

// استخراج المستخدم المستهدف
function extractTarget(m) {
  if (m.quoted) return m.quoted.sender;
  if (m.mentionedJid?.length) return m.mentionedJid[0];
  return null;
}

// المعالج الرئيسي للأمر
async function handler(m, { sock }) {
  const db = getDatabase();
  const args = m.args;

  // البحث عن الرقم في الوسائط
  const numArg = args.find((a) => !isNaN(a) && !a.startsWith("@"));
  let levels = parseInt(numArg) || 0;

  let targetJid = await extractTarget(m);

  // إذا لم يتم تحديد مستهدف وكانت الكمية أكبر من صفر
  if (!targetJid && levels > 0) {
    targetJid = m.sender;
  }

  // التحقق من صحة المدخلات
  if (!targetJid || levels <= 0) {
    return m.reply(
      `📊 *خصم مستوى*\n\n` +
        `╭┈┈⬡「 📋 *طريقة الاستخدام* 」\n` +
        `┃ > \`.خصم_مستوى <الكمية>\` - لنفسك\n` +
        `┃ > \`.خصم_مستوى <الكمية> @المستخدم\` - لشخص آخر\n` +
        `╰┈┈┈┈┈┈┈┈⬡\n\n` +
        `> مثال: \`${m.prefix}خصم_مستوى 5\``,
    );
  }

  // الحصول على بيانات المستخدم
  const user = db.getUser(targetJid) || db.setUser(targetJid);

  // حفظ المستوى القديم
  const oldLevel = calculateLevel(user.exp || 0);
  
  // حساب الخبرة المطلوب حذفها
  const expToRemove = levels * EXP_PER_LEVEL;
  
  // خصم الخبرة (تأكد من عدم السالب)
  user.exp = Math.max(0, (user.exp || 0) - expToRemove);
  
  // حساب المستوى الجديد
  const newLevel = calculateLevel(user.exp);

  // حفظ التغييرات
  db.save();
  await m.react("✅"); // رد بإيموجي تأكيد

  // إرسال رسالة النتيجة
  await m.reply(
    `✅ *تم خصم المستوى بنجاح*\n\n` +
      `╭┈┈⬡「 📋 *التفاصيل* 」\n` +
      `┃ 👤 المستخدم: @${targetJid.split("@")[0]}\n` +
      `┃ ➖ المخصوم: *-${levels} مستوى*\n` +
      `┃ 🚄 الخبرة المحذوفة: *-${expToRemove.toLocaleString("ar-EG")}* خبرة\n` +
      `┃ 📊 المستوى: *${oldLevel} → ${newLevel}*\n` +
      `┃ ${getRole(newLevel)}\n` +
      `╰┈┈┈┈┈┈┈┈⬡`,
    { mentions: [targetJid] },
  );
}

// تصدير التكوين والمعالج
export { pluginConfig as config, handler };