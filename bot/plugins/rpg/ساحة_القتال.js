// ساحة_القتال - أمر للقتال في ساحة PvP

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "ساحة_القتال",
  alias: ["arena"],
  category: "rpg",
  description: "القتال في ساحة PvP",
  usage: ".ساحة_القتال @مستخدم",
  example: ".ساحة_القتال @مستخدم",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 180,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};
  if (!user.inventory) user.inventory = {};

  const mentioned = m.mentionedJid?.[0] || m.quoted?.sender;
  if (!mentioned) {
    let txt = `⚔️ *ساحة المصارعين* ⚔️\n\n`;
    txt += `تحدى أصدقاءك في ساحة القتال!\n\n`;
    txt += `*طريقة التحدي:*\n`;
    txt += `🗡️ \`${m.prefix}ساحة_القتال @مستخدم\`\n`;
    txt += `🗡️ أو رد على رسالته بـ \`${m.prefix}ساحة_القتال\`\n\n`;
    txt += `> _⚠️ انتبه، إذا خسرت ستفقد 20% من عملاتك!_`;
    return m.reply(txt);
  }

  if (mentioned === m.sender) {
    return m.reply(`هل تريد ضرب نفسك؟ ابحث عن خصم آخر! 😂`);
  }

  const opponent = db.getUser(mentioned);
  if (!opponent) {
    return m.reply(`الخصم الذي أشرت إليه غير مسجل في قاعدة البيانات!`);
  }

  if (!opponent.rpg) opponent.rpg = {};

  const myHealth = user.rpg.health || 100;
  const myAttack = (user.rpg.attack || 10) + (user.level || 1) * 2;
  const myDefense = (user.rpg.defense || 5) + (user.level || 1);

  const oppHealth = opponent.rpg.health || 100;
  const oppAttack = (opponent.rpg.attack || 10) + (opponent.level || 1) * 2;
  const oppDefense = (opponent.rpg.defense || 5) + (opponent.level || 1);

  await m.react("⚔️");
  await m.reply(`⚔️ *بدأت المعركة!* ⚔️\n\n@${m.sender.split("@")[0]} يهاجم @${mentioned.split("@")[0]}!\nحظاً سعيداً! 🔥`, { mentions: [m.sender, mentioned] });
  await new Promise((r) => setTimeout(r, 2000));

  let myHp = myHealth;
  let oppHp = oppHealth;
  let round = 0;
  let battleLog = [];

  while (myHp > 0 && oppHp > 0 && round < 10) {
    round++;

    const myDmg = Math.max(5, myAttack - oppDefense + Math.floor(Math.random() * 10));
    oppHp -= myDmg;
    battleLog.push(`🔥 وجهت ضربة قوية: *-${myDmg} نقطة صحة*`);

    if (oppHp <= 0) break;

    const oppDmg = Math.max(5, oppAttack - myDefense + Math.floor(Math.random() * 10));
    myHp -= oppDmg;
    battleLog.push(`💢 رد الخصم بقوة: *-${oppDmg} نقطة صحة*`);
  }

  const isWin = myHp > oppHp;

  let txt = `⚔️ *نتيجة المعركة* ⚔️\n\n`;
  txt += `*📊 الحالة النهائية:*\n`;
  txt += `🧑 أنت: *${Math.max(0, myHp)}/${myHealth} نقطة صحة*\n`;
  txt += `👤 الخصم: *${Math.max(0, oppHp)}/${oppHealth} نقطة صحة*\n`;
  txt += `🔄 المدة: *${round} جولة*\n\n`;

  txt += `📜 *ملخص المعركة:*\n`;
  txt += battleLog
    .slice(-6)
    .map((l) => `> ${l}`)
    .join("\n");
  txt += `\n\n`;

  if (isWin) {
    const expReward = 300 + (opponent.level || 1) * 50;
    const goldReward = Math.floor((opponent.koin || 0) * 0.1);

    user.koin = (user.koin || 0) + goldReward;
    opponent.koin = Math.max(0, (opponent.koin || 0) - goldReward);

    await addExpWithLevelCheck(sock, m, db, user, expReward);

    txt += `🏆 *لقد فزت!* 🎉\n`;
    txt += `أحسنت! إليك الجوائز:\n`;
    txt += `✨ الخبرة: *+${expReward}*\n`;
    txt += `💰 العملات المسلوبة: *+${goldReward.toLocaleString("ar-EG")}*`;

    await m.react("🏆");
  } else {
    const goldLoss = Math.floor((user.koin || 0) * 0.2);
    user.koin = Math.max(0, (user.koin || 0) - goldLoss);

    txt += `💀 *للأسف، لقد خسرت...* 💔\n`;
    txt += `لا تحزن، حاول مرة أخرى لاحقاً!\n`;
    txt += `💸 العملات المفقودة: *-${goldLoss.toLocaleString("ar-EG")}*`;

    await m.react("💀");
  }

  db.setUser(m.sender, user);
  db.setUser(mentioned, opponent);
  db.save();

  return m.reply(txt, { mentions: [m.sender, mentioned] });
}

export { pluginConfig as config, handler };