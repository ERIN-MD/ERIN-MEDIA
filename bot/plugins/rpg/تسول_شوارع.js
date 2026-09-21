// تسول_شوارع - أمر للتسول في الشوارع مع فرصة الحصول على وجبة

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "تسول_شوارع",
  alias: ["ngemis"],
  category: "rpg",
  description: "التسول في الشوارع مع فرصة الحصول على وجبة (زيادة الطاقة)",
  usage: ".تسول_شوارع",
  example: ".تسول_شوارع",
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
  
  const staminaCost = 5;
  user.rpg.stamina = user.rpg.stamina ?? 100;

  if (user.rpg.stamina < staminaCost) {
    return m.reply(`طاقتك انتهت! 🥺\n\nالتسول يحتاج *${staminaCost}* طاقة، طاقتك المتبقية *${user.rpg.stamina}*. لا تستطيع الاستمرار... 💔`);
  }

  user.rpg.stamina -= staminaCost;
  await m.react("🤲");
  await m.reply(`يا سادة، تصدقوا قليلاً... 🥺\nأتمنى أن يمر كريم في هذا التقاطع... 🚶‍♂️`);
  await new Promise(r => setTimeout(r, 3000));

  const gacha = Math.random();

  if (gacha < 0.3) {
    const heal = Math.floor(Math.random() * 20) + 10;
    user.rpg.stamina = Math.min(100, user.rpg.stamina + heal);
    await m.react("🍱");
    return m.reply(`الحمد لله! وجبة غداء! 🍱✨\n\nرجل طيب أعطاك علبة طعام!\n💖 زيادة الطاقة: *+${heal}*\n💵 الأموال: 0\n\nشبعان وسعيد! 🥰`);
  }

  if (gacha > 0.9) {
    await m.react("💢");
    return m.reply(`طردك حراس السوق! 💢\n\n"هذا مكاني! ابتعد!"\nهربت خائفاً دون أن تحصل على شيء...\n⚡ الطاقة المستهلكة: -${staminaCost}\n\nالتسول صعب هذه الأيام! 😭`);
  }

  const earning = Math.floor(Math.random() * 3000) + 500;
  user.koin = (user.koin || 0) + earning;
  const expGain = Math.floor(earning / 10);
  await addExpWithLevelCheck(sock, m, db, user, expGain);

  await m.react("✅");
  m.reply(`حصيلة التسول اليوم! 🤲✨\n\n💵 الأموال: *+${earning.toLocaleString("ar-EG")}* عملة\n📈 الخبرة: *+${expGain}*\n⚡ الطاقة المستهلكة: -${staminaCost}\n\nالشكر لله على هذه النعمة، وإن كانت قليلة! 🙏`);
}

export { pluginConfig as config, handler };