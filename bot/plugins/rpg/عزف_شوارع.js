// عزف_شوارع - أمر للعزف في الشوارع لكسب العملات

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "عزف_شوارع",
  alias: ["ngamen"],
  category: "rpg",
  description: "العزف في الشوارع لكسب العملات",
  usage: ".عزف_شوارع",
  example: ".عزف_شوارع",
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
    return m.reply(`صوتك بحة، حلقك جاف! 🥵\n\nالعزف يحتاج *${staminaCost}* طاقة، طاقتك المتبقية *${user.rpg.stamina}*. اشرب شاياً! ☕`);
  }

  user.rpg.stamina -= staminaCost;

  await m.react("🎸");

  const locations = [
    { name: "تقاطع الإشارات", min: 3000, max: 10000 },
    { name: "مقهى شعبي", min: 5000, max: 15000 },
    { name: "أمام سوبر ماركت", min: 4000, max: 12000 },
    { name: "مقهى راقي", min: 8000, max: 25000 },
    { name: "مطعم شعبي", min: 2000, max: 8000 }
  ];

  const loc = locations[Math.floor(Math.random() * locations.length)];
  const earning = Math.floor(Math.random() * (loc.max - loc.min + 1)) + loc.min;

  await m.reply(`بدأت العزف على الجيتار في *${loc.name}*... 🎶\nأتمنى أن يكرمك الناس اليوم! 💸`);
  await new Promise((resolve) => setTimeout(resolve, 3000));

  user.koin = (user.koin || 0) + earning;

  const expGain = Math.floor(earning / 20);
  await addExpWithLevelCheck(sock, m, db, user, expGain);

  await m.react("✅");

  let txt = `الحمد لله! أرباح العزف! 🎸✨\n\n`;
  txt += `الموقع: *${loc.name}*\n`;
  txt += `💵 الأرباح: *+${earning.toLocaleString("ar-EG")}* عملة\n`;
  txt += `📈 الخبرة: *+${expGain}*\n`;
  txt += `⚡ الطاقة المستهلكة: *-${staminaCost}*\n\n`;
  txt += `يكفي لشراء وجبة اليوم! 🤤`;

  m.reply(txt);
}

export { pluginConfig as config, handler };