// يومي - أمر للحصول على المكافأة اليومية

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";
import config from "../../config.js";

const pluginConfig = {
  name: "يومي",
  alias: ["daily"],
  category: "rpg",
  description: "الحصول على المكافأة اليومية",
  usage: ".يومي",
  example: ".يومي",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 0,
  energi: 0,
  isEnabled: true,
};

function msToTime(duration) {
  const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const seconds = Math.floor((duration / 1000) % 60);
  return `${hours} ساعة ${minutes} دقيقة ${seconds} ثانية`;
}

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);
  const isPremium = config.isPremium?.(m.sender) || false;

  if (!user.rpg) user.rpg = {};

  const COOLDOWN = 86400000;
  const lastClaim = user.rpg.lastDaily || 0;
  const now = Date.now();

  if (now - lastClaim < COOLDOWN) {
    const remaining = COOLDOWN - (now - lastClaim);
    return m.reply(`لقد حصلت على مكافأتك اليومية بالفعل! 😂\n\nانتظر *${msToTime(remaining)}* للحصول على مكافأة الغد. لا تكن طماعاً! 🏃💨`);
  }

  const expReward = isPremium ? 5000 : 1000;
  const moneyReward = isPremium ? 25000 : 5000;
  const energiReward = isPremium ? 10 : 3;

  user.rpg.lastDaily = now;
  user.koin = (user.koin || 0) + moneyReward;
  user.energi = (user.energi || 0) + energiReward;

  const levelResult = await addExpWithLevelCheck(sock, m, db, user, expReward);
  db.save();

  await m.react("🎁");

  let txt = `رائع! تم صرف المكافأة اليومية! 🎉✨\n\n`;
  txt += `حصتك لهذا اليوم:\n`;
  txt += `💸 العملات: *+${moneyReward.toLocaleString("ar-EG")}*\n`;
  txt += `📈 الخبرة: *+${expReward.toLocaleString("ar-EG")}*\n`;
  txt += `⚡ الطاقة: *+${energiReward}*\n\n`;
  
  if (isPremium) {
    txt += `👑 *واو! مكافأة الأعضاء المميزين مختلفة! الأثرياء أحرار!* 😎💸`;
  } else {
    txt += `تريد مكافأة أكبر؟ قم بترقية عضويتك إلى *Premium*! لتصبح أكثر ثراءً! 🤑💎`;
  }

  m.reply(txt);
}

export { pluginConfig as config, handler };