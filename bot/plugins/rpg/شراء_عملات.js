// شراء_عملات - أمر لتحويل الخبرة إلى عملات

import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "شراء_عملات",
  alias: ["buykoin"],
  category: "rpg",
  description: "تحويل الخبرة إلى عملات",
  usage: ".شراء_عملات <الكمية>",
  example: ".شراء_عملات 10000",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

const EXP_PER_KOIN = 2;

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};

  const args = m.args || [];
  const amountStr = args[0];

  if (!amountStr) {
    let txt = `💱 *شراء العملات*\n\n`;
    txt += `> تحويل الخبرة إلى عملات!\n\n`;
    txt += `*📊 سعر الصرف:*\n`;
    txt += `> 💎 ${EXP_PER_KOIN} خبرة = 1 عملة\n\n`;
    txt += `*📋 الرصيد:*\n`;
    txt += `> 🚄 الخبرة: *${(user.exp || 0).toLocaleString("ar-EG")}*\n`;
    txt += `> 💰 العملات: *${(user.koin || 0).toLocaleString("ar-EG")}*\n\n`;
    txt += `> مثال: \`.شراء_عملات 10000\`\n`;
    txt += `> سيتم استخدام ${10000 * EXP_PER_KOIN} خبرة للحصول على 10.000 عملة`;

    return m.reply(txt);
  }

  let koinAmount = 0;
  if (amountStr === "all" || amountStr === "max" || amountStr === "الكل") {
    koinAmount = Math.floor((user.exp || 0) / EXP_PER_KOIN);
  } else {
    koinAmount = parseInt(amountStr);
  }

  if (!koinAmount || koinAmount <= 0) {
    return m.reply(`❌ أدخل كمية صالحة من العملات!`);
  }

  const expNeeded = koinAmount * EXP_PER_KOIN;

  if ((user.exp || 0) < expNeeded) {
    const maxPossible = Math.floor((user.exp || 0) / EXP_PER_KOIN);
    return m.reply(
      `❌ *الخبرة غير كافية!*\n\n` +
        `> المطلوب: *${expNeeded.toLocaleString("ar-EG")} خبرة*\n` +
        `> خبرتك: *${(user.exp || 0).toLocaleString("ar-EG")} خبرة*\n\n` +
        `> الحد الأقصى: *${maxPossible.toLocaleString("ar-EG")} عملة*`,
    );
  }

  // تحديث البيانات يدوياً
  const newExp = (user.exp || 0) - expNeeded;
  const newKoin = (user.koin || 0) + koinAmount;

  db.setUser(m.sender, {
    exp: newExp,
    koin: newKoin,
  });

  await m.react("💱");

  let txt = `💱 *تم التحويل بنجاح!*\n\n`;
  txt += `*📋 التفاصيل:*\n`;
  txt += `> 🚄 الخبرة: *-${expNeeded.toLocaleString("ar-EG")}*\n`;
  txt += `> 💰 العملات: *+${koinAmount.toLocaleString("ar-EG")}*\n\n`;
  txt += `*📊 الرصيد الحالي:*\n`;
  txt += `> 🚄 الخبرة: *${newExp.toLocaleString("ar-EG")}*\n`;
  txt += `> 💰 العملات: *${newKoin.toLocaleString("ar-EG")}*`;

  m.reply(txt);
}

export { pluginConfig as config, handler };