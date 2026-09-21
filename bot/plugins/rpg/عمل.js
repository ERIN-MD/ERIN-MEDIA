// عمل - أمر للعمل لكسب المال

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "عمل",
  alias: ["work"],
  category: "rpg",
  description: "العمل لكسب المال",
  usage: ".عمل",
  example: ".عمل",
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

  const staminaCost = 10;
  user.rpg.stamina = user.rpg.stamina || 100;

  if (user.rpg.stamina < staminaCost) {
    return m.reply(`أنت متعب جداً! 🥵💦\n\nالعمل يحتاج *${staminaCost}* طاقة، لديك *${user.rpg.stamina}* فقط.\nاسترح قليلاً! 🛌💤`);
  }

  user.rpg.stamina -= staminaCost;

  const jobs = [
    { name: "👨‍🌾 مزارع", min: 1000, max: 3000 },
    { name: "🧹 عامل نظافة", min: 2000, max: 5000 },
    { name: "📦 ساعي", min: 3000, max: 7000 },
    { name: "👨‍🍳 طاهٍ", min: 4000, max: 10000 },
    { name: "👨‍💻 مبرمج", min: 8000, max: 20000 },
    { name: "👨‍⚕️ طبيب", min: 15000, max: 30000 },
  ];

  const job = jobs[Math.floor(Math.random() * jobs.length)];
  const salary = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;
  const expGain = Math.floor(salary / 10);

  await m.reply(`ذاهب للعمل كـ *${job.name.substring(3)}*! 🏃💼💨`);
  await new Promise((r) => setTimeout(r, 3000));

  user.koin = (user.koin || 0) + salary;
  const levelResult = await addExpWithLevelCheck(sock, m, db, user, expGain);

  db.save();

  let txt = `انتهيت من العمل! 💸✨\n\n`;
  txt += `الراتب جيد جداً:\n`;
  txt += `💼 المهنة: *${job.name}*\n`;
  txt += `💵 الراتب: *+${salary.toLocaleString("ar-EG")}* عملة\n`;
  txt += `📈 الخبرة: *+${expGain}*\n`;
  txt += `⚡ الطاقة المستهلكة: *-${staminaCost}*\n\n`;
  txt += `العمل الجاد يؤتي ثماره! استمر! 🐴🔥`;

  await m.reply(txt);
}

export { pluginConfig as config, handler };