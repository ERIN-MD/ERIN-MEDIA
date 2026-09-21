// عمل_حر - أمر للعمل في مشاريع عبر الإنترنت (تصميم/برمجة)

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "عمل_حر",
  alias: ["freelance"],
  category: "rpg",
  description: "العمل في مشاريع عبر الإنترنت (تصميم/برمجة)",
  usage: ".عمل_حر",
  example: ".عمل_حر",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 200,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};
  
  const staminaCost = 25;
  user.rpg.stamina = user.rpg.stamina ?? 100;

  if (user.rpg.stamina < staminaCost) {
    return m.reply(`دماغك سخنة من التفكير! 🤯\n\nالعمل الحر يحتاج *${staminaCost}* طاقة، طاقتك المتبقية *${user.rpg.stamina}*. خذ قسطاً من الراحة! 🌿`);
  }

  user.rpg.stamina -= staminaCost;
  await m.react("💻");
  await m.reply(`تكتب كوداً / ترسم على الكمبيوتر... ⌨️\nأتمنى ألا يطلب العميل تعديلات! 🙏`);
  await new Promise(r => setTimeout(r, 4000));

  const gacha = Math.random();

  if (gacha < 0.2) {
    await m.react("📉");
    return m.reply(`العميل هرب ولم يدفع! 📉😡\n\nعملت لمدة 3 أيام وليالٍ، ثم اختفى!\n💵 الأرباح: 0\n⚡ الطاقة المستهلكة: -${staminaCost}\n\nخذها درساً، اطلب دفعة مقدمة في المرة القادمة! 😭`);
  } else if (gacha > 0.85) {
    const dollarRate = 16000;
    const payment = Math.floor(Math.random() * 10) + 5;
    const totalRupiah = payment * dollarRate;
    
    user.koin = (user.koin || 0) + totalRupiah;
    const expGain = Math.floor(totalRupiah / 30);
    await addExpWithLevelCheck(sock, m, db, user, expGain);
    
    await m.react("💸");
    return m.reply(`دفع بالدولار من عميل أجنبي! 💸✨\n\nالعميل الأجنبي سعيد جداً وأعطى $${payment}!\n💵 الأرباح: *+${totalRupiah.toLocaleString("ar-EG")}* عملة\n📈 الخبرة: *+${expGain}*\n⚡ الطاقة: -${staminaCost}\n\nأموال السلاطين في انتظارك! 🤑`);
  }

  const earning = Math.floor(Math.random() * 40000) + 15000;
  user.koin = (user.koin || 0) + earning;
  const expGain = Math.floor(earning / 20);
  await addExpWithLevelCheck(sock, m, db, user, expGain);

  await m.react("✅");
  m.reply(`تم إنجاز المشروع والموافقة عليه! 💻✨\n\n💵 الأرباح المحلية: *+${earning.toLocaleString("ar-EG")}* عملة\n📈 الخبرة: *+${expGain}*\n⚡ الطاقة: -${staminaCost}\n\nكافٍ لشراء بعض القهوة! ☕`);
}

export { pluginConfig as config, handler };