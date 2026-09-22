// بيع_متجول - أمر للبيع المتجول

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "بيع_متجول",
  alias: ["jualan"],
  category: "rpg",
  description: "البيع المتجول",
  usage: ".بيع_متجول",
  example: ".بيع_متجول",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 180,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};
  
  const staminaCost = 18;
  user.rpg.stamina = user.rpg.stamina ?? 100;

  if (user.rpg.stamina < staminaCost) {
    return m.reply(`ساقاك متعبة من التجوال! 🥵\n\nالبيع يحتاج *${staminaCost}* طاقة، طاقتك المتبقية *${user.rpg.stamina}*. استرح قليلاً! 🏖️`);
  }

  user.rpg.stamina -= staminaCost;
  await m.react("🛒");
  await m.reply(`تسوووق! مكسرات وحلويات! 🍬\nاعرض بضاعتك على المارة... 🗣️`);
  await new Promise(r => setTimeout(r, 3000));

  const gacha = Math.random();

  if (gacha < 0.2) {
    const rugi = Math.floor(Math.random() * 10000) + 5000;
    user.koin = Math.max(0, (user.koin || 0) - rugi);
    await m.react("🌧️");
    return m.reply(`مطر غزير! لا أحد يشتري! 🌧️🥶\n\nبضاعتك تبللت ولم يشتري أحد.\nخسارة رأس المال: *${rugi.toLocaleString("ar-EG")}* عملة\n⚡ الطاقة: -${staminaCost}\n\nتحقق من الطقس غداً! ☂️`);
  } else if (gacha > 0.85) {
    const lakuKeras = Math.floor(Math.random() * 80000) + 40000;
    user.koin = (user.koin || 0) + lakuKeras;
    const expGain = Math.floor(lakuKeras / 20);
    await addExpWithLevelCheck(sock, m, db, user, expGain);
    await m.react("🤑");
    return m.reply(`عميل ثري اشترى كل شيء! 🚴‍♂️✨\n\nاشترى كل بضاعتك دفعة واحدة!\n💵 الأرباح: *+${lakuKeras.toLocaleString("ar-EG")}* عملة\n📈 الخبرة: *+${expGain}*\n⚡ الطاقة: -${staminaCost}\n\nيمكنك العودة إلى المنزل مبكراً! 🎉`);
  }

  const earning = Math.floor(Math.random() * 25000) + 10000;
  user.koin = (user.koin || 0) + earning;
  const expGain = Math.floor(earning / 20);
  await addExpWithLevelCheck(sock, m, db, user, expGain);

  await m.react("✅");
  m.reply(`بيع ناجح! 🛒✨\n\n💵 الأرباح: *+${earning.toLocaleString("ar-EG")}* عملة\n📈 الخبرة: *+${expGain}*\n⚡ الطاقة: -${staminaCost}\n\nعد للتسوق غداً! 🛍️`);
}

export { pluginConfig as config, handler };