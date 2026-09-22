// أسبوعي - أمر للحصول على المكافأة الأسبوعية (أكبر من اليومية)

import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "أسبوعي",
  alias: ["weekly"],
  category: "rpg",
  description: "الحصول على المكافأة الأسبوعية (أكبر من اليومية)",
  usage: ".أسبوعي",
  example: ".أسبوعي",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 0,
  energi: 0,
  isEnabled: true,
};

const WEEKLY_COOLDOWN = 7 * 24 * 60 * 60 * 1000;

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.cooldowns) user.cooldowns = {};
  const lastWeekly = user.cooldowns.weekly || 0;
  const now = Date.now();

  if (now - lastWeekly < WEEKLY_COOLDOWN) {
    const remaining = lastWeekly + WEEKLY_COOLDOWN - now;
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return m.reply(`انتهت حصتك الأسبوعية! 😂\n\nانتظر *${days} يوم ${hours} ساعة* للحصول على المكافأة الأسبوعية التالية! 🗓️💨`);
  }

  const expReward = Math.floor(Math.random() * 20000) + 10000;
  const moneyReward = Math.floor(Math.random() * 50000) + 30000;
  const crateReward = Math.floor(Math.random() * 3) + 1;

  if (!user.rpg) user.rpg = {};
  db.updateExp(m.sender, expReward);
  user.koin = (user.koin || 0) + moneyReward;

  if (!user.inventory) user.inventory = {};
  user.inventory.صندوق_نادر = (user.inventory.صندوق_نادر || 0) + crateReward;

  user.cooldowns.weekly = now;
  db.save();

  let txt = `رن! المكافأة الأسبوعية! 🎉🎊🤑\n\n`;
  txt += `حصتك هذا الأسبوع كبيرة جداً:\n`;
  txt += `📈 الخبرة: *+${expReward.toLocaleString("ar-EG")}*\n`;
  txt += `💰 العملات: *+${moneyReward.toLocaleString("ar-EG")}* عملة\n`;
  txt += `🛍️ صندوق نادر: *+${crateReward}×*\n\n`;
  txt += `لا تنسَ إيداع أموالك في البنك (\`.بنك\`)! 🏦💖`;

  await m.reply(txt);
}

export { pluginConfig as config, handler };