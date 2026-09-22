// ساعي - أمر لتوصيل الطرود (احترس من الكلاب!)

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "ساعي",
  alias: ["kurir"],
  category: "rpg",
  description: "توصيل الطرود للناس (احترس من الكلاب!)",
  usage: ".ساعي",
  example: ".ساعي",
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
  
  const staminaCost = 15;
  user.rpg.stamina = user.rpg.stamina ?? 100;

  if (user.rpg.stamina < staminaCost) {
    return m.reply(`ظهرك يؤلمك من حمل الصناديق! 😩\n\nالتوصيل يحتاج *${staminaCost}* طاقة، طاقتك المتبقية *${user.rpg.stamina}*. استرح قليلاً! 💆‍♂️`);
  }

  user.rpg.stamina -= staminaCost;
  await m.react("📦");
  await m.reply(`طرد!!! 📦\nابحث عن العنوان على الخريطة... 🗺️`);
  await new Promise(r => setTimeout(r, 3000));

  const gacha = Math.random();

  if (gacha < 0.2) {
    const extraStamina = 10;
    user.rpg.stamina = Math.max(0, user.rpg.stamina - extraStamina);
    
    const expGain = 500;
    await addExpWithLevelCheck(sock, m, db, user, expGain);
    
    await m.react("🐕");
    return m.reply(`هوووووف! كلب شرس يطاردك! 🐕💨\n\nركضت حول الحي لإنقاذ الطرد!\n⚡ طاقة إضافية مستهلكة: -${extraStamina}\n📈 خبرة الجري: *+${expGain}*\n💵 الأرباح: 0 (رميت الطرد فوق السياج)\n\nأنت تلهث بشدة! 🥵`);
  }

  const items = ["وثيقة سرية", "ملابس أونلاين", "مستحضرات تجميل", "قدر طبخ"];
  const item = items[Math.floor(Math.random() * items.length)];
  const earning = Math.floor(Math.random() * 15000) + 5000;
  let tips = 0;

  if (gacha > 0.8) {
    tips = Math.floor(Math.random() * 10000) + 2000;
  }

  const totalEarning = earning + tips;
  user.koin = (user.koin || 0) + totalEarning;
  const expGain = Math.floor(totalEarning / 20);
  await addExpWithLevelCheck(sock, m, db, user, expGain);

  await m.react("✅");
  let txt = `الحمد لله، وصل الطرد! 📦✨\n\nالعنصر: *${item}*\n💵 أجرة التوصيل: *+${earning.toLocaleString("ar-EG")}* عملة\n`;
  if (tips > 0) txt += `🎁 إكرامية إضافية: *+${tips.toLocaleString("ar-EG")}* عملة\n`;
  txt += `📈 الخبرة: *+${expGain}*\n⚡ الطاقة: -${staminaCost}\n\nتم التوصيل في الوقت المحدد! 🚚💨`;
  m.reply(txt);
}

export { pluginConfig as config, handler };