// ساعوي - أمر للحصول على المكافأة كل ساعة

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";
import config from "../../config.js";

const pluginConfig = {
  name: "ساعوي",
  alias: ["hourly"],
  category: "rpg",
  description: "الحصول على المكافأة كل ساعة",
  usage: ".ساعوي",
  example: ".ساعوي",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 0,
  energi: 0,
  isEnabled: true,
};

function msToTime(duration) {
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const seconds = Math.floor((duration / 1000) % 60);
  return `${minutes} دقيقة ${seconds} ثانية`;
}

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);
  const isPremium = config.isPremium?.(m.sender) || false;

  if (!user.rpg) user.rpg = {};

  const COOLDOWN = 3600000;
  const lastClaim = user.rpg.lastHourly || 0;
  const now = Date.now();

  if (now - lastClaim < COOLDOWN) {
    const remaining = COOLDOWN - (now - lastClaim);
    return m.reply(`لقد حصلت على مكافأتك لهذه الساعة بالفعل! 😂\n\nانتظر *${msToTime(remaining)}* ثم عد! 🏃💨`);
  }

  const expReward = isPremium ? 1000 : 200;
  const moneyReward = isPremium ? 5000 : 1000;

  user.rpg.lastHourly = now;
  user.koin = (user.koin || 0) + moneyReward;

  const levelResult = await addExpWithLevelCheck(sock, m, db, user, expReward);
  db.save();

  await m.react("⏰");

  let txt = `حان وقت المكافأة الساعية! ⏰✨\n\n`;
  txt += `حصتك:\n`;
  txt += `💸 العملات: *+${moneyReward.toLocaleString("ar-EG")}*\n`;
  txt += `📈 الخبرة: *+${expReward.toLocaleString("ar-EG")}*\n\n`;
  txt += `عد بعد ساعة! 😘`;

  m.reply(txt);
}

export { pluginConfig as config, handler };