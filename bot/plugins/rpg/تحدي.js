// تحدي - أمر للتحدي اليومي للحصول على جوائز خاصة

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "تحدي",
  alias: ["challenge"],
  category: "rpg",
  description: "التحدي اليومي للحصول على جوائز خاصة",
  usage: ".تحدي",
  example: ".تحدي",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 0,
  isEnabled: true,
};

const CHALLENGES = [
  { name: "⚔️ هزيمة 5 وحوش", type: "kill", target: 5, reward: { gold: 500, exp: 200 } },
  { name: "🎣 صيد 3 أسماك", type: "fish", target: 3, reward: { gold: 300, exp: 150 } },
  { name: "⛏️ تعدين 10 خامات", type: "mine", target: 10, reward: { gold: 400, exp: 180 } },
  { name: "🌱 حصاد 5 محاصيل", type: "harvest", target: 5, reward: { gold: 350, exp: 160 } },
  { name: "🧪 صنع 3 جرعات", type: "craft", target: 3, reward: { gold: 450, exp: 190 } },
  { name: "💰 جمع 1000 عملة", type: "earn", target: 1000, reward: { gold: 500, exp: 250 } },
  { name: "🗺️ إكمال رحلتين", type: "expedition", target: 2, reward: { gold: 600, exp: 300 } },
];

function getNewDailyChallenge() {
  return {
    ...CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)],
    progress: 0,
    date: new Date().toDateString(),
    claimed: false,
  };
}

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};

  const today = new Date().toDateString();

  if (!user.rpg.dailyChallenge || user.rpg.dailyChallenge.date !== today) {
    user.rpg.dailyChallenge = getNewDailyChallenge();
    db.save();
  }

  const challenge = user.rpg.dailyChallenge;
  const isComplete = challenge.progress >= challenge.target;

  const args = m.args || [];
  const action = args[0]?.toLowerCase();

  if (action === "claim" || action === "استلام") {
    if (!isComplete) {
      return m.reply(`❌ لم تكتمل التحديات بعد!\nتقدمك الحالي: *${challenge.progress}/${challenge.target}*`);
    }

    if (challenge.claimed) {
      return m.reply(`لقد استلمت الجائزة اليوم! انتظر تحدياً جديداً غداً! 😉`);
    }

    user.koin = (user.koin || 0) + challenge.reward.gold;
    await addExpWithLevelCheck(sock, m, db, user, challenge.reward.exp);

    challenge.claimed = true;
    db.save();

    await m.react("🎉");
    return m.reply(
      `🎉 *اكتمل التحدي اليومي!!* 🎉\n\n` +
        `أحسنت! إليك جائزتك من النقابة:\n` +
        `💰 العملات: *+${challenge.reward.gold.toLocaleString("ar-EG")}*\n` +
        `✨ الخبرة: *+${challenge.reward.exp}*\n` +
        `\n\n` +
        `> _سيظهر تحدٍ جديد غداً!_`
    );
  }

  let txt = `📋 *التحدي اليومي للنقابة* 📋\n\n`;
  txt += `أكمل المهمة المخصصة اليوم للحصول على مصروف إضافي!\n\n`;
  
  txt += `*مهمتك اليوم:*\n`;
  txt += `🎯 *${challenge.name}*\n`;
  txt += `📊 التقدم: *${challenge.progress}/${challenge.target}*\n`;
  txt += `الحالة: ${isComplete ? "✅ *جاهز للاستلام!*" : "⏳ _قيد التنفيذ..._"}\n\n`;

  txt += `*🎁 الجائزة الإضافية:*\n`;
  txt += `💰 العملات: *${challenge.reward.gold.toLocaleString("ar-EG")}*\n`;
  txt += `✨ الخبرة: *${challenge.reward.exp}*\n\n`;

  if (isComplete && !challenge.claimed) {
    txt += `> 💡 اكتب \`${m.prefix}تحدي استلام\` للحصول على الجائزة!`;
  } else if (challenge.claimed) {
    txt += `> ✅ أحسنت! تم استلام الجائزة. غداً مهمة جديدة!`;
  } else {
    txt += `> استمر في العمل! عندما تنتهي، احصل على جائزتك.`;
  }

  return m.reply(txt);
}

export { pluginConfig as config, handler };