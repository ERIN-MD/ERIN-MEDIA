// بعثة - أمر لإرسال بعثات استكشافية للحصول على عناصر

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "بعثة",
  alias: ["expedition"],
  category: "rpg",
  description: "إرسال بعثات استكشافية للحصول على عناصر",
  usage: ".بعثة <بدء/استلام/حالة>",
  example: ".بعثة بدء غابة",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 0,
  isEnabled: true,
};

const EXPEDITIONS = {
  غابة: { name: "🌲 غابة العناكب", duration: 1800000, rewards: ["خشب", "عشبة", "فطر"], exp: 100, minLevel: 1 },
  كهف: { name: "🏔️ كهف الخفافيش", duration: 3600000, rewards: ["حديد", "ذهب", "جوهرة"], exp: 200, minLevel: 5 },
  بركان: { name: "🌋 جبل التنين", duration: 7200000, rewards: ["حمم", "حراشف_تنين", "قلب_عملاق"], exp: 400, minLevel: 15 },
  محيط: { name: "🌊 محيط الكراكن", duration: 5400000, rewards: ["سمكة", "لؤلؤة", "جوهرة_بحرية"], exp: 300, minLevel: 10 },
  أطلال: { name: "🏛️ أطلال قديمة", duration: 10800000, rewards: ["عملة_قديمة", "تحفة", "صندوق_غامض"], exp: 600, minLevel: 20 },
};

function formatTime(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (hours > 0) return `${hours}س ${minutes}د`;
  return minutes > 0 ? `${minutes}د ${seconds}ث` : `${seconds}ث`;
}

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.inventory) user.inventory = {};
  if (!user.rpg) user.rpg = {};
  if (!user.rpg.expeditions) user.rpg.expeditions = [];

  const args = m.args || [];
  const action = args[0]?.toLowerCase();
  const expType = args[1]?.toLowerCase();

  const maxExpeditions = Math.min(5, 1 + Math.floor((user.level || 1) / 10));

  if (!action || !["بدء", "استلام", "حالة", "قائمة"].includes(action) && !["start", "claim", "status", "list"].includes(action)) {
    let txt = `🗺️ *مقر البعثات* 🗺️\n\n`;
    txt += `أرسل فرق استكشافية لجلب العناصر النادرة وأنت تستريح!\n\n`;
    txt += `*قائمة الأوامر:*\n`;
    txt += `📜 \`.بعثة قائمة\` (عرض المناطق)\n`;
    txt += `🚀 \`.بعثة بدء <المنطقة>\` (بدء البعثة)\n`;
    txt += `⏳ \`.بعثة حالة\` (عرض الوقت المتبقي)\n`;
    txt += `💰 \`.بعثة استلام\` (سحب النتائج)\n\n`;
    txt += `📊 سعة البعثات لديك: *${user.rpg.expeditions.length}/${maxExpeditions} فريق*`;
    return m.reply(txt);
  }

  if (action === "list" || action === "قائمة") {
    let txt = `📜 *خريطة العالم للاستكشاف* 📜\n\n`;

    for (const [key, exp] of Object.entries(EXPEDITIONS)) {
      const canGo = (user.level || 1) >= exp.minLevel;
      txt += `📍 ${exp.name} ${canGo ? "🔓" : "🔒"}\n`;
      txt += `   ├ ⏳ الوقت: ${formatTime(exp.duration)}\n`;
      txt += `   ├ 🎁 الغنائم المحتملة: ${exp.rewards.join(", ")}\n`;
      txt += `   ├ 📈 الخبرة: ${exp.exp} (الحد الأدنى للمستوى ${exp.minLevel})\n`;
      txt += `   └ 🚀 رمز المنطقة: \`${key}\`\n\n`;
    }
    return m.reply(txt);
  }

  if (action === "start" || action === "بدء") {
    if (user.rpg.expeditions.length >= maxExpeditions) {
      return m.reply(`سعة البعثات ممتلئة! (${user.rpg.expeditions.length}/${maxExpeditions})\nانتظر عودة الفرق الأخرى!`);
    }

    if (!expType) {
      return m.reply(`اختر منطقة البعثة!\nمثال: \`.بعثة بدء غابة\``);
    }

    const exp = EXPEDITIONS[expType];
    if (!exp) {
      return m.reply(`منطقة *${expType}* غير موجودة على الخريطة!`);
    }

    if ((user.level || 1) < exp.minLevel) {
      return m.reply(`مستواك منخفض جداً. تحتاج *المستوى ${exp.minLevel}* للذهاب إلى هناك!`);
    }

    user.rpg.expeditions.push({
      type: expType,
      startedAt: Date.now(),
      duration: exp.duration,
    });
    db.save();

    let txt = `🚀 *انطلقت البعثة!* 🚀\n\n`;
    txt += `انطلق فريق الاستكشاف نحو الهدف!\n`;
    txt += `📍 الهدف: *${exp.name}*\n`;
    txt += `⏱️ الوقت المتوقع: *${formatTime(exp.duration)}*\n\n`;
    txt += `> استرخِ قليلاً، ثم استلم النتائج باستخدام \`.بعثة استلام\`!`;

    return m.reply(txt);
  }

  if (action === "status" || action === "حالة") {
    if (user.rpg.expeditions.length === 0) {
      return m.reply(`لا توجد بعثات نشطة حالياً. أرسل واحدة الآن! 🏕️`);
    }

    let txt = `⏳ *رادار البعثات* ⏳\n\n`;

    for (let i = 0; i < user.rpg.expeditions.length; i++) {
      const exp = user.rpg.expeditions[i];
      const expInfo = EXPEDITIONS[exp.type];
      const elapsed = Date.now() - exp.startedAt;
      const remaining = Math.max(0, exp.duration - elapsed);
      const done = remaining <= 0;

      txt += `🗺️ *الفريق ${i + 1}* → ${expInfo.name}\n`;
      txt += `   └ الحالة: ${done ? "✅ انتهت! (جاهزة للاستلام)" : `🕒 متبقي ${formatTime(remaining)}`}\n\n`;
    }
    return m.reply(txt);
  }

  if (action === "claim" || action === "استلام") {
    const completedExps = user.rpg.expeditions.filter((e) => {
      return Date.now() - e.startedAt >= e.duration;
    });

    if (completedExps.length === 0) {
      return m.reply(`لا توجد بعثات منتهية! تحقق باستخدام \`.بعثة حالة\`!`);
    }

    let totalExp = 0;
    let allRewards = [];

    for (const exp of completedExps) {
      const expInfo = EXPEDITIONS[exp.type];
      totalExp += expInfo.exp;

      for (const rewardItem of expInfo.rewards) {
        if (Math.random() > 0.4) {
          const qty = Math.floor(Math.random() * 5) + 1;
          user.inventory[rewardItem] = (user.inventory[rewardItem] || 0) + qty;
          allRewards.push(`${rewardItem} ×${qty}`);
        }
      }
    }

    user.rpg.expeditions = user.rpg.expeditions.filter((e) => {
      return Date.now() - e.startedAt < e.duration;
    });

    await addExpWithLevelCheck(sock, m, db, user, totalExp);
    db.save();

    await m.react("✅");

    let txt = `🎉 *انتهت البعثة!* 🎉\n\n`;
    txt += `عاد الفريق ومعه نتائج *${completedExps.length} بعثة*!\n\n`;
    txt += `*🎁 نتائج البحث:*\n`;
    txt += `✨ الخبرة: *+${totalExp}*\n`;
    if (allRewards.length > 0) {
      txt += `📦 العناصر:\n`;
      for (const r of allRewards) {
        txt += `  • ${r}\n`;
      }
    } else {
      txt += `📦 العناصر: *للأسف، لم يتم العثور على شيء هذه المرة...* 😭\n`;
    }

    return m.reply(txt);
  }
}

export { pluginConfig as config, handler };