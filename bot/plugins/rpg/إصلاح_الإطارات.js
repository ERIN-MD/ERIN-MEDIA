// إصلاح_الإطارات - أمر لفتح ورشة إصلاح الإطارات (احترس من الانفجار!)

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "إصلاح_الإطارات",
  alias: ["nambalban"],
  category: "rpg",
  description: "فتح ورشة إصلاح الإطارات (احترس من الانفجار!)",
  usage: ".إصلاح_الإطارات",
  example: ".إصلاح_الإطارات",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 150,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};
  
  const staminaCost = 14;
  user.rpg.stamina = user.rpg.stamina ?? 100;

  if (user.rpg.stamina < staminaCost) {
    return m.reply(`مضخة الهواء عالقة، يديك متعبة! 🤕\n\nإصلاح الإطارات يحتاج *${staminaCost}* طاقة، طاقتك المتبقية *${user.rpg.stamina}*. اشرب شاياً! 🧊`);
  }

  user.rpg.stamina -= staminaCost;
  await m.react("🛠️");
  await m.reply(`ششش... فحص الإطار المتسرب بالماء والصابون... 🫧\nوجدت مسماراً! 📍`);
  await new Promise(r => setTimeout(r, 3000));

  const gacha = Math.random();

  if (gacha < 0.15) {
    const healthLoss = 15;
    user.rpg.health = Math.max(0, (user.rpg.health ?? 100) - healthLoss);
    await m.react("💥");
    return m.reply(`بوووم! انفجار الإطار! 💥😭\n\nضغطت بقوة وانفجر إطار الشاحنة في وجهك!\n💔 نقص الصحة: -${healthLoss}\n⚡ الطاقة المستهلكة: -${staminaCost}\n💵 الأرباح: 0\n\nوجهك اسود من الدخان! 💀`);
  }

  const earning = Math.floor(Math.random() * 20000) + 10000;
  user.koin = (user.koin || 0) + earning;
  const expGain = Math.floor(earning / 25);
  await addExpWithLevelCheck(sock, m, db, user, expGain);

  await m.react("✅");
  m.reply(`تم إصلاح الإطار! 🛠️✨\n\n💵 الأرباح: *+${earning.toLocaleString("ar-EG")}* عملة\n📈 الخبرة: *+${expGain}*\n⚡ الطاقة المستهلكة: -${staminaCost}\n\nأتمنى ألا يتسرب مرة أخرى! 💨`);
}

export { pluginConfig as config, handler };