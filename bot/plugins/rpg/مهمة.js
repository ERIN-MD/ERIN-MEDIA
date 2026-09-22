// مهمة - أمر لالتقاط المهام اليومية للحصول على مكافآت إضافية

import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "مهمة",
  alias: ["quest"],
  category: "rpg",
  description: "التقاط المهام اليومية للحصول على مكافآت إضافية",
  usage: ".مهمة",
  example: ".مهمة",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 0,
  energi: 0,
  isEnabled: true,
};

const QUESTS = [
  {
    id: "تعدين5",
    name: "عامل منجم مبتدئ",
    desc: "التعدين 5 مرات",
    target: 5,
    reward: { money: 10000, exp: 1000 },
  },
  {
    id: "صيد5",
    name: "صياد ماهر",
    desc: "الصيد 5 مرات",
    target: 5,
    reward: { money: 8000, exp: 800 },
  },
  {
    id: "مغامرة3",
    name: "مغامر حقيقي",
    desc: "المغامرة 3 مرات",
    target: 3,
    reward: { money: 15000, exp: 1500 },
  },
  {
    id: "عمل10",
    name: "عامل مجتهد",
    desc: "العمل 10 مرات",
    target: 10,
    reward: { money: 20000, exp: 2000 },
  },
  {
    id: "صيد_بري5",
    name: "صياد محترف",
    desc: "الصيد البري 5 مرات",
    target: 5,
    reward: { money: 12000, exp: 1200 },
  },
];

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};
  if (!user.quest) user.quest = {};

  const args = m.args || [];
  const sub = args[0]?.toLowerCase();

  if (sub === "claim" || sub === "استلام") {
    const questId = args[1];
    if (!questId || !user.quest[questId]) {
      return m.reply(`هذه المهمة غير موجودة في قائمتك! 📜❌`);
    }

    const quest = QUESTS.find((q) => q.id === questId);
    if (!quest) {
      return m.reply(`معرف المهمة خاطئ! تحقق من لوحة المكافآت! 🔍`);
    }

    if (user.quest[questId].progress < quest.target) {
      return m.reply(`لم تنتهِ هذه المهمة بعد!\nتقدمك: *${user.quest[questId].progress}/${quest.target}* 🏃‍♂️💦`);
    }

    if (user.quest[questId].claimed) {
      return m.reply(`لقد استلمت مكافأة هذه المهمة بالفعل! 😒`);
    }

    user.koin = (user.koin || 0) + quest.reward.money;
    db.updateExp(m.sender, quest.reward.exp);
    user.quest[questId].claimed = true;

    db.save();
    let txt = `💰 *اكتملت المهمة!!* 💰\n\n`;
    txt += `أنهيت مهمة *${quest.name}* بنجاح!\n`;
    txt += `هذه مكافأتك:\n`;
    txt += `💵 مكافأة المهمة: *+${quest.reward.money.toLocaleString("ar-EG")}* عملة\n`;
    txt += `📈 خبرة إضافية: *+${quest.reward.exp}*\n\n`;
    txt += `> _"أحسنت!" - موظف الاستقبال_ 👩‍💼`;
    return m.reply(txt);
  }

  if (sub === "take" || sub === "التقاط") {
    const questId = args[1];
    const quest = QUESTS.find((q) => q.id === questId);
    if (!quest) {
      return m.reply(`المهمة غير موجودة! انظر القائمة الكاملة في \`.مهمة\``);
    }

    if (user.quest[questId]) {
      return m.reply(`لقد التقطت هذه المهمة بالفعل! أنجزها أولاً! ⚔️`);
    }

    user.quest[questId] = { progress: 0, claimed: false, takenAt: Date.now() };
    db.save();

    let txt = `📜 *تم التقاط المهمة!* 📜\n\n`;
    txt += `أخذت مهمة من لوحة المكافآت! 📜✨\n`;
    txt += `🎯 الهدف: *${quest.name}* (${quest.desc})\n`;
    txt += `🎁 المكافأة: *${quest.reward.money.toLocaleString("ar-EG")}* عملة و *${quest.reward.exp}* خبرة\n\n`;
    txt += `> _"حظاً موفقاً!"_ 💖`;
    return m.reply(txt);
  }

  let txt = `📌 *لوحة المكافآت (المهام اليومية)* 📌\n\n`;
  txt += `أكمل المهام اليومية للحصول على مكافآت إضافية!\n\n`;

  for (const quest of QUESTS) {
    const userQuest = user.quest[quest.id];
    let status = "📜 متاحة";
    if (userQuest) {
      if (userQuest.claimed) {
        status = "✅ منتهية";
      } else if (userQuest.progress >= quest.target) {
        status = "🎁 جاهزة للاستلام";
      } else {
        status = `🏃 قيد التنفيذ (${userQuest.progress}/${quest.target})`;
      }
    }

    txt += `🎯 *${quest.name}*\n`;
    txt += `   ├ المهمة: ${quest.desc}\n`;
    txt += `   ├ المكافأة: ${quest.reward.money.toLocaleString("ar-EG")} عملة و ${quest.reward.exp} خبرة\n`;
    txt += `   ├ الحالة: *${status}*\n`;
    txt += `   ─ التقاط: \`${m.prefix}مهمة التقاط ${quest.id}\`\n\n`;
  }

  txt += `> 💡 عند الانتهاء من المهمة، اكتب: \`.مهمة استلام <معرف_المهمة>\``;

  await m.reply(txt);
}

export { pluginConfig as config, handler };