// موقف_سيارات - أمر للعمل كحارس موقف سيارات (احترس من الشرطة!)

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "موقف_سيارات",
  alias: ["parkir"],
  category: "rpg",
  description: "العمل كحارس موقف سيارات (احترس من الشرطة!)",
  usage: ".موقف_سيارات",
  example: ".موقف_سيارات",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 120,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};
  
  const staminaCost = 12;
  user.rpg.stamina = user.rpg.stamina ?? 100;

  if (user.rpg.stamina < staminaCost) {
    return m.reply(`ساقاك متعبة من الوقوف! 😫\n\nحراسة الموقف تحتاج *${staminaCost}* طاقة، طاقتك المتبقية *${user.rpg.stamina}*. استرح في الكشك! 🏚️`);
  }

  user.rpg.stamina -= staminaCost;
  await m.react("🅿️");
  await m.reply(`صوت الصفارة! اذهب، اذهب، انعطف يساراً! 🏁\nابدأ في جمع رسوم موقف السيارات... 💰`);
  await new Promise(r => setTimeout(r, 3000));

  const gacha = Math.random();

  if (gacha < 0.1) {
    const denda = Math.floor(Math.random() * 5000) + 1000;
    user.koin = Math.max(0, (user.koin || 0) - denda);
    await m.react("🚨");
    return m.reply(`هناك مداهمة من شرطة المرور! 🚓💨\n\nهربت مسرعاً وسقطت نقودك بقيمة *${denda.toLocaleString("ar-EG")}* عملة!\n⚡ الطاقة المستهلكة: -${staminaCost}\n\nيوم سيء! 😭`);
  } else if (gacha > 0.9) {
    const jackpot = Math.floor(Math.random() * 50000) + 20000;
    user.koin = (user.koin || 0) + jackpot;
    const expGain = Math.floor(jackpot / 20);
    await addExpWithLevelCheck(sock, m, db, user, expGain);
    await m.react("🤑");
    return m.reply(`جائزة كبرى! سيارة فاخرة لرجل ثري! 🏎️✨\n\nقبل أن يغادر، نزل نافذته وأعطاك أوراقاً نقدية!\n💵 الأرباح: *+${jackpot.toLocaleString("ar-EG")}* عملة\n📈 الخبرة: *+${expGain}*\n⚡ الطاقة المستهلكة: -${staminaCost}\n\nالحمد لله! 🙏`);
  }

  const earning = Math.floor(Math.random() * 8000) + 2000;
  user.koin = (user.koin || 0) + earning;
  const expGain = Math.floor(earning / 20);
  await addExpWithLevelCheck(sock, m, db, user, expGain);

  await m.react("✅");
  m.reply(`حصيلة موقف السيارات اليوم! 🅿️✨\n\n💵 الأرباح: *+${earning.toLocaleString("ar-EG")}* عملة\n📈 الخبرة: *+${expGain}*\n⚡ الطاقة المستهلكة: -${staminaCost}\n\nعملة تلو الأخرى تصبح جبلاً! 💪`);
}

export { pluginConfig as config, handler };