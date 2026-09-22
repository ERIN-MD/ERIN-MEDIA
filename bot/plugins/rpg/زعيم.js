// زعيم - أمر لمحاربة الزعيم للحصول على جوائز كبيرة

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "زعيم",
  alias: ["boss"],
  category: "rpg",
  description: "محاربة الزعيم للحصول على جوائز كبيرة",
  usage: ".زعيم",
  example: ".زعيم",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 600,
  energi: 3,
  isEnabled: true,
};

const BOSSES = [
  {
    name: "🐉 تنين عجوز",
    hp: 500,
    attack: 50,
    minLevel: 10,
    exp: 2000,
    gold: 5000,
    drops: ["حراشف_تنين", "عظم_تنين"],
  },
  {
    name: "👹 سيد الشياطين",
    hp: 400,
    attack: 60,
    minLevel: 15,
    exp: 2500,
    gold: 7000,
    drops: ["روح_شيطان", "جوهرة_ملعونة"],
  },
  {
    name: "🧟 ملك الموتى",
    hp: 350,
    attack: 45,
    minLevel: 8,
    exp: 1500,
    gold: 4000,
    drops: ["حجر_الروح", "عظم_قديم"],
  },
  {
    name: "🦑 كراكن",
    hp: 600,
    attack: 40,
    minLevel: 12,
    exp: 2200,
    gold: 6000,
    drops: ["مخلب_كراكن", "جوهرة_بحرية"],
  },
  {
    name: "🌋 عملاق البركان",
    hp: 700,
    attack: 55,
    minLevel: 20,
    exp: 3000,
    gold: 10000,
    drops: ["قلب_عملاق", "جوهرة_حمم"],
  },
  {
    name: "❄️ ملكة الجليد",
    hp: 450,
    attack: 50,
    minLevel: 18,
    exp: 2800,
    gold: 8000,
    drops: ["قلب_جليدي", "تاج_جليدي"],
  },
  {
    name: "⚡ إله الرعد",
    hp: 550,
    attack: 65,
    minLevel: 25,
    exp: 4000,
    gold: 15000,
    drops: ["حجر_رعد", "قلب_إلهي"],
  },
];

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};
  if (!user.inventory) user.inventory = {};

  const userLevel = user.level || 1;
  const availableBosses = BOSSES.filter((b) => userLevel >= b.minLevel);

  if (availableBosses.length === 0) {
    const lowestBoss = BOSSES.reduce((a, b) => (a.minLevel < b.minLevel ? a : b));
    let txt = `مستواك منخفض جداً لمحاربة الزعيم! 😭\n\n`;
    txt += `مستواك الحالي: *${userLevel}*\n`;
    txt += `الحد الأدنى للمستوى المطلوب: *${lowestBoss.minLevel}*\n\n`;
    txt += `💡 _نصيحة: ارفع مستواك من خلال التعدين أو الصيد أو المغامرة!_`;
    return m.reply(txt);
  }

  const staminaCost = 50;
  user.rpg.stamina = user.rpg.stamina ?? 100;

  if (user.rpg.stamina < staminaCost) {
    return m.reply(`⚡ طاقتك منخفضة!\n\nتحتاج *${staminaCost}* طاقة لمحاربة الزعيم.\nطاقتك المتبقية: *${user.rpg.stamina}*`);
  }

  user.rpg.stamina -= staminaCost;

  const boss = availableBosses[Math.floor(Math.random() * availableBosses.length)];

  await m.react("⚔️");
  let introTxt = `⚠️ *تحذير خطر!* ⚠️\n\n`;
  introTxt += `هالة من الظلام تغطي الساحة... ظهر *${boss.name}* أمامك!\n\n`;
  introTxt += `❤️ صحة الزعيم: *${boss.hp} نقطة*\n`;
  introTxt += `⚔️ قوته: *${boss.attack} هجوم*\n\n`;
  introTxt += `_جهز سلاحك! المعركة تبدأ..._`;
  
  await m.reply(introTxt);
  await new Promise((r) => setTimeout(r, 2500));

  const userAttack = (user.rpg.attack || 10) + userLevel * 3;
  const userDefense = (user.rpg.defense || 5) + userLevel * 2;
  const userMaxHp = (user.rpg.health || 100) + userLevel * 5;

  let userHp = userMaxHp;
  let bossHp = boss.hp;
  let round = 0;
  let battleLog = [];

  while (userHp > 0 && bossHp > 0 && round < 15) {
    round++;

    const playerDmg = Math.max(10, userAttack + Math.floor(Math.random() * 20) - 5);
    const critChance = Math.random();
    const finalPlayerDmg = critChance > 0.9 ? playerDmg * 2 : playerDmg;
    bossHp -= finalPlayerDmg;

    if (critChance > 0.9) {
      battleLog.push(`💥 *ضربة قاضية!!* هجومك القاتل: *-${finalPlayerDmg} نقطة صحة*`);
    } else {
      battleLog.push(`⚔️ ضربت الزعيم: *-${finalPlayerDmg} نقطة صحة*`);
    }

    if (bossHp <= 0) break;

    const bossDmg = Math.max(10, boss.attack - userDefense + Math.floor(Math.random() * 15));
    userHp -= bossDmg;
    battleLog.push(`👹 الزعيم يهاجم بشراسة: *-${bossDmg} نقطة صحة*`);
  }

  await m.reply(
    `⚔️ *المعركة ضارية...*\n\n${battleLog
      .slice(-6)
      .map((l) => `> ${l}`)
      .join("\n")}`,
  );
  await new Promise((r) => setTimeout(r, 1500));

  const isWin = bossHp <= 0;

  let txt = ``;

  if (isWin) {
    const expReward = boss.exp + Math.floor(Math.random() * 500);
    const goldReward = boss.gold + Math.floor(Math.random() * 2000);

    user.koin = (user.koin || 0) + goldReward;
    await addExpWithLevelCheck(sock, m, db, user, expReward);

    const droppedItems = [];
    for (const drop of boss.drops) {
      if (Math.random() > 0.5) {
        const qty = Math.floor(Math.random() * 3) + 1;
        user.inventory[drop] = (user.inventory[drop] || 0) + qty;
        droppedItems.push(`${drop} (×${qty})`);
      }
    }

    txt = `🏆 *تم هزيمة الزعيم!!* 🎉\n\n`;
    txt += `أحسنت! تمكنت من هزيمة الوحش العملاق *${boss.name}*!\n\n`;
    txt += `*🎁 كنوز الزعيم:*\n`;
    txt += `✨ الخبرة: *+${expReward.toLocaleString("ar-EG")}*\n`;
    txt += `💰 العملات الذهبية: *+${goldReward.toLocaleString("ar-EG")}*\n`;
    if (droppedItems.length > 0) {
      txt += `📦 الغنائم: *${droppedItems.join(", ")}*\n`;
    }
    txt += `\n> ❤️ صحتك المتبقية: *${Math.max(0, userHp)}/${userMaxHp}*`;

    await m.react("🏆");
  } else {
    const goldLoss = Math.floor((user.koin || 0) * 0.15);
    user.koin = Math.max(0, (user.koin || 0) - goldLoss);
    user.rpg.health = Math.max(1, (user.rpg.health || 100) - 50);

    txt = `💀 *للأسف... لقد هُزمت...* 💔\n\n`;
    txt += `قوة *${boss.name}* لا تزال كبيرة جداً!\n\n`;
    txt += `*عقوبة الهزيمة:*\n`;
    txt += `💸 العملات المفقودة: *-${goldLoss.toLocaleString("ar-EG")}*\n`;
    txt += `❤️ نقص الصحة: *-50 نقطة*\n\n`;
    txt += `> 💡 _نصيحة: حاول رفع مستواك وتطوير أسلحتك قبل مواجهته مرة أخرى!_`;

    await m.react("💀");
  }

  db.save();
  return m.reply(txt);
}

export { pluginConfig as config, handler };