// كتابة_قصص - أمر لكتابة القصص للحصول على إتاوات

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "كتابة_قصص",
  alias: ["nulis"],
  category: "rpg",
  description: "كتابة القصص للحصول على إتاوات",
  usage: ".كتابة_قصص",
  example: ".كتابة_قصص",
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
    return m.reply(`أفكارك جفت! 😵‍💫\n\nالكتابة تحتاج *${staminaCost}* طاقة، طاقتك المتبقية *${user.rpg.stamina}*. ابحث عن إلهام! 💡`);
  }

  user.rpg.stamina -= staminaCost;
  await m.react("📝");
  await m.reply(`ترتيب الكلمات... ✍️\nأتمنى أن يلاحظك ناشر! 📚`);
  await new Promise(r => setTimeout(r, 3000));

  const gacha = Math.random();

  if (gacha < 0.15) {
    await m.react("🚮");
    return m.reply(`رفض الناشر المخطوطة! 🚮🥺\n\nالسبب: "القصة مكررة وباهتة."\n💵 الإتاوات: 0\n⚡ الطاقة المستهلكة: -${staminaCost}\n\nلا تستسلم، اكتب غداً! 💪`);
  } else if (gacha > 0.9) {
    const viralRoyalti = Math.floor(Math.random() * 60000) + 30000;
    user.koin = (user.koin || 0) + viralRoyalti;
    const expGain = Math.floor(viralRoyalti / 20);
    await addExpWithLevelCheck(sock, m, db, user, expGain);
    
    await m.react("🌟");
    return m.reply(`قصتك حققت مبيعات ضخمة! 🌟📘\n\nقراؤك بكوا كثيراً، الإتاوات تتدفق!\n💵 الإتاوات: *+${viralRoyalti.toLocaleString("ar-EG")}* عملة\n📈 الخبرة: *+${expGain}*\n⚡ الطاقة المستهلكة: -${staminaCost}\n\nقد يحولونها إلى فيلم! 🎬`);
  }

  const earning = Math.floor(Math.random() * 15000) + 5000;
  user.koin = (user.koin || 0) + earning;
  const expGain = Math.floor(earning / 20);
  await addExpWithLevelCheck(sock, m, db, user, expGain);

  await m.react("✅");
  m.reply(`تم صرف إتاوات كتابة القصص! 📝✨\n\n💵 الأرباح: *+${earning.toLocaleString("ar-EG")}* عملة\n📈 الخبرة: *+${expGain}*\n⚡ الطاقة المستهلكة: -${staminaCost}\n\nاستمر في الإبداع! 🎓`);
}

export { pluginConfig as config, handler };