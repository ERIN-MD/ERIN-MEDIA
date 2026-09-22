// مغامرة - أمر للذهاب في مغامرة للحصول على خبرة وجوائز

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "مغامرة",
  alias: ["adventure"],
  category: "rpg",
  description: "الذهاب في مغامرة للحصول على خبرة وجوائز",
  usage: ".مغامرة",
  example: ".مغامرة",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 120,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};
  user.rpg.health = user.rpg.health || 100;

  if (user.rpg.health < 30) {
    return m.reply(`أوه لا، صحتك منخفضة جداً! 😭💔\n\nتحتاج على الأقل *30 نقطة صحة* للمغامرة حتى لا تموت في الطريق.\nصحتك الحالية *${user.rpg.health} نقطة*. تعافى أولاً! 💉✨`);
  }

  const locations = ["🌲 الغابة المظلمة", "🏔️ جبل الجليد الأبدي", "🏜️ صحراء الموت", "🌋 البركان", "🏰 القلعة القديمة المسكونة", "🌊 الشاطئ الغامض"];
  const location = locations[Math.floor(Math.random() * locations.length)];

  await m.react("🗺️");
  await m.reply(`تحزم حقيبتك وتشعل المصباح... تدخل *${location}*... ⚔️🗺️\nانتبه، الجو مشؤوم بعض الشيء!`);
  await new Promise((r) => setTimeout(r, 2500));

  const isWin = Math.random() < 0.6;

  if (isWin) {
    const expGain = Math.floor(Math.random() * 2000) + 500;
    const moneyGain = Math.floor(Math.random() * 10000) + 2000;

    user.koin = (user.koin || 0) + moneyGain;
    const levelResult = await addExpWithLevelCheck(sock, m, db, user, expGain);

    db.save();

    let txt = `🗡️ *المغامرة ناجحة!!* 🗡️\n\n`;
    txt += `📍 الموقع: *${location}*\n\n`;
    txt += `رائع! تمكنت من هزيمة وحش الحارس والعثور على صندوق الكنز!\n`;
    txt += `💰 العملات: *+${moneyGain.toLocaleString("ar-EG")}*\n`;
    txt += `📈 الخبرة: *+${expGain.toLocaleString("ar-EG")}*\n\n`;
    txt += `عدت بسلام! عد للمغامرة لاحقاً! 🚀✨`;

    await m.reply(txt);
  } else {
    const healthLoss = Math.floor(Math.random() * 30) + 10;
    user.rpg.health = Math.max(0, user.rpg.health - healthLoss);

    let msg = `☠️ *هجوم وحش!!* ☠️\n\n`;
    msg += `📍 الموقع: *${location}*\n\n`;
    msg += `اكتشفوا خطوتك! هاجمتكم مجموعة من الوحوش بشراسة!\n`;
    msg += `❤️ نقص الصحة: *-${healthLoss} نقطة* (المتبقي: ${user.rpg.health})\n\n`;

    if (user.rpg.health <= 0) {
      user.rpg.health = 0;
      user.exp = Math.floor((user.exp || 0) / 2);
      msg += `💀 *لقد مت!*\nيا للهول... لقد مت في المكان. خسرت 50% من خبرتك. 💔🥀`;
    } else {
      msg += `لحسن الحظ تمكنت من الهروب! استرح لاستعادة صحتك! 🏃💨`;
    }

    db.save();
    await m.reply(msg);
  }
}

export { pluginConfig as config, handler };