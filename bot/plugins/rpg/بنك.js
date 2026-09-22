// بنك - نظام بنك لتخزين الأموال بأمان من السرقة

import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "بنك",
  alias: ["bank"],
  category: "rpg",
  description: "نظام بنك لتخزين الأموال بأمان من السرقة",
  usage: ".بنك <إيداع/سحب> <المبلغ>",
  example: ".بنك إيداع 10000",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const cleanJid = m.sender.replace(/@.+/g, "");

  let user = db.getUser(m.sender);
  if (!user) {
    user = db.setUser(m.sender, {});
  }

  if (!db.db.data.users[cleanJid].rpg) {
    db.db.data.users[cleanJid].rpg = {};
  }
  if (typeof db.db.data.users[cleanJid].rpg.bank !== "number") {
    db.db.data.users[cleanJid].rpg.bank = 0;
  }

  const currentBalance = db.db.data.users[cleanJid].koin || 0;
  const currentBank = db.db.data.users[cleanJid].rpg.bank || 0;

  const args = m.args || [];
  const action = args[0]?.toLowerCase();
  const amountStr = args[1];

  if (action === "deposit" || action === "depo" || action === "إيداع") {
    let amount = 0;
    if (amountStr === "all" || amountStr === "الكل") {
      amount = currentBalance;
    } else {
      amount = parseInt(amountStr);
    }

    if (!amount || amount <= 0) return m.reply(`أدخل مبلغاً صحيحاً من العملات! لا تضع أرقاماً وهمية 😂💸`);
    if (currentBalance < amount) return m.reply(`رصيدك النقدي غير كافٍ! 😭\nلديك فقط *${currentBalance.toLocaleString("ar-EG")}* عملة. اربح المزيد أولاً! 🏃💨`);

    db.db.data.users[cleanJid].koin = currentBalance - amount;
    db.db.data.users[cleanJid].rpg.bank = currentBank + amount;

    await db.save();

    const newBank = db.db.data.users[cleanJid].rpg.bank;
    return m.reply(`شكراً لإيداعك في بنك RPG! 🏦💖\n\n✅ تم الإيداع: *${amount.toLocaleString("ar-EG")}* عملة\n💳 رصيد التوفير: *${newBank.toLocaleString("ar-EG")}* عملة\n\nأموالك في أمان! 🔒✨`);
  }

  if (action === "withdraw" || action === "tarik" || action === "سحب") {
    let amount = 0;
    if (amountStr === "all" || amountStr === "الكل") {
      amount = currentBank;
    } else {
      amount = parseInt(amountStr);
    }

    if (!amount || amount <= 0) return m.reply(`أدخل مبلغاً صحيحاً من العملات! هل تريد سحب الهواء؟ 😂💸`);
    if (currentBank < amount) return m.reply(`رصيد التوفير غير كافٍ! 😭\nلديك فقط *${currentBank.toLocaleString("ar-EG")}* عملة في الحساب. لا تبالغ! 🫣`);

    db.db.data.users[cleanJid].rpg.bank = currentBank - amount;
    db.db.data.users[cleanJid].koin = currentBalance + amount;

    await db.save();

    const newBalance = db.db.data.users[cleanJid].koin;
    return m.reply(`تم سحب أموالك بنجاح! 🏧💸\n\n✅ السحب: *${amount.toLocaleString("ar-EG")}* عملة\n💰 الرصيد النقدي: *${newBalance.toLocaleString("ar-EG")}* عملة\n\nأنفقها بحكمة! 🛍️✨`);
  }

  let txt = `مرحباً في بنك RPG! 🏦✨\nهل تريد التحقق من رصيدك أم لديك طلب آخر؟\n\n`;
  txt += `💰 الرصيد النقدي: *${currentBalance.toLocaleString("ar-EG")}* عملة\n`;
  txt += `💳 رصيد التوفير: *${currentBank.toLocaleString("ar-EG")}* عملة\n\n`;
  txt += `*الخدمات المصرفية:* 💁‍♀️\n`;
  txt += `إيداع: \`.بنك إيداع <المبلغ>\`\n`;
  txt += `سحب نقدي: \`.بنك سحب <المبلغ>\`\n\n`;
  txt += `*(استخدم كلمة 'الكل' لإيداع/سحب كل شيء دفعة واحدة!)* 🚀`;

  await m.reply(txt);
}

export { pluginConfig as config, handler };