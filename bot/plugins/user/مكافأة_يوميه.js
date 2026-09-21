import { getDatabase } from "../../src/lib/maro-database.js";
import { getTimeGreeting } from "../../src/lib/maro-formatter.js";

const pluginConfig = {
  name: "مكافأة_يوميه",
  alias: ["daily", "يومي"],
  category: "user",
  description: "الحصول على المكافأة اليومية (خبرة، عملات، جرعات)",
  usage: ".مكافأة_يوميه",
  example: ".مكافأة_يوميه",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 0,
  energi: 0,
  isEnabled: true,
};

const DAILY_COOLDOWN = 24 * 60 * 60 * 1000;

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.cooldowns) user.cooldowns = {};
  const lastDaily = user.cooldowns.daily || 0;
  const now = Date.now();

  if (now - lastDaily < DAILY_COOLDOWN) {
    const remaining = lastDaily + DAILY_COOLDOWN - now;
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return m.reply(
      `🕕 *التبريد*\n\n> لقد حصلت على المكافأة اليومية بالفعل.\n> انتظر: *${hours} ساعة ${minutes} دقيقة* أخرى.`,
    );
  }

  const expReward = Math.floor(Math.random() * 5000) + 1000;
  const moneyReward = Math.floor(Math.random() * 10000) + 5000;
  const potionReward = Math.floor(Math.random() * 3) + 1;

  if (!user.rpg) user.rpg = {};
  db.updateExp(m.sender, expReward);
  user.koin = (user.koin || 0) + moneyReward;

  if (!user.inventory) user.inventory = {};
  user.inventory.potion = (user.inventory.potion || 0) + potionReward;

  user.cooldowns.daily = now;
  db.save();

  const greeting = getTimeGreeting();

  let txt = `🎉 *تم الحصول على المكافأة اليومية*\n`;
  txt += `> ${greeting}، @${m.sender.split("@")[0]}\n\n`;
  txt += `╭┈┈⬡「 🎁 *المكافآت* 」\n`;
  txt += `┃ 🚄 الخبرة: *+${expReward}*\n`;
  txt += `┃ 💰 العملات: *+${moneyReward.toLocaleString("id-ID")}*\n`;
  txt += `┃ 🥤 الجرعات: *+${potionReward}*\n`;
  txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`;
  txt += `> لا تنسى الحصول على المكافأة غداً!`;

  await m.reply(txt, { mentions: [m.sender] });
}

export { pluginConfig as config, handler };