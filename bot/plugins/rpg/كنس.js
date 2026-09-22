// كنس - أمر لكنس الشوارع (قد تجد شيئاً ثميناً!)

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "كنس",
  alias: ["nyapu"],
  category: "rpg",
  description: "كنس الشوارع (قد تجد شيئاً ثميناً!)",
  usage: ".كنس",
  example: ".كنس",
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
  
  const staminaCost = 10;
  user.rpg.stamina = user.rpg.stamina ?? 100;

  if (user.rpg.stamina < staminaCost) {
    return m.reply(`يديك متعبة من حمل المكنسة! 😖\n\nالكنس يحتاج *${staminaCost}* طاقة، طاقتك المتبقية *${user.rpg.stamina}*. استرح تحت شجرة! 🌳`);
  }

  user.rpg.stamina -= staminaCost;
  await m.react("🧹");
  await m.reply(`ششش... 🧹\nتنظيف نفايات الناس... 🗑️`);
  await new Promise(r => setTimeout(r, 3000));

  const gacha = Math.random();

  if (gacha < 0.1) {
    const goldFound = Math.floor(Math.random() * 50000) + 15000;
    user.koin = (user.koin || 0) + goldFound;
    await m.react("💍");
    return m.reply(`حظ كبير! وجدت خاتماً ذهبياً! 💍✨\n\nأثناء كنس الرصيف، وجدت خاتماً ذهبياً وبعته!\n💵 أرباح مفاجئة: *+${goldFound.toLocaleString("ar-EG")}* عملة\n⚡ الطاقة المستهلكة: -${staminaCost}\n\nالرزق يأتي من حيث لا تحتسب! 🥳`);
  }

  const earning = Math.floor(Math.random() * 8000) + 3000;
  user.koin = (user.koin || 0) + earning;
  const expGain = Math.floor(earning / 20);
  await addExpWithLevelCheck(sock, m, db, user, expGain);

  await m.react("✅");
  m.reply(`الحمد لله! انتهى التنظيف! 🧹✨\n\n💵 الأجر اليومي: *+${earning.toLocaleString("ar-EG")}* عملة\n📈 الخبرة: *+${expGain}*\n⚡ الطاقة المستهلكة: -${staminaCost}\n\nالعالم أصبح أنظف! 🌍`);
}

export { pluginConfig as config, handler };