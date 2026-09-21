// سارق - أمر لسرقة الناس في السوق (أكثر خطورة من الجريمة)

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";
import { sendRpgPreview } from "../../src/lib/maro-context.js";

const pluginConfig = {
  name: "سارق",
  alias: ["maling"],
  category: "rpg",
  description: "سرقة الناس في السوق (أكثر خطورة من الجريمة)",
  usage: ".سارق",
  example: ".سارق",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 180,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};
  user.rpg.health = user.rpg.health || 100;

  if (user.rpg.health < 40) {
    return m.reply(`أنت متعب جداً لتسرق! 🤒\nتحتاج على الأقل *40 نقطة صحة*، صحتك الحالية *${user.rpg.health}*. استرح أولاً!`);
  }

  await sendRpgPreview(sock, m.chat, "تتسلل في ازدحام السوق... تتربص بحقيبة إحدى النساء... 🦹‍♂️🤏", "🦹 سارق", "جاري التنفيذ!", { quoted: m });
  await new Promise((r) => setTimeout(r, 2500));

  const outcomes = [
    { success: true, type: "big", money: 20000, exp: 500, msg: "رائع! وجدت محفظة بها *بطاقة سوداء* ونقود كثيفة! 🤑" },
    { success: true, type: "medium", money: 8000, exp: 200, msg: "محفظة جلدية بها بعض النقود. 😏" },
    { success: true, type: "small", money: 2000, exp: 50, msg: "محفظة بها بطاقة هوية وإيصال فقط! 😑 لكن وجدت بعض النقود." },
    { success: false, type: "caught", fine: 15000, health: 30, msg: "لص!! 😱 صرخت إحدى النساء وضربك الحشد حتى كسرت أسنانك!" },
    { success: false, type: "police", fine: 25000, health: 10, msg: "بينما كنت تهم بسرقة المحفظة، أمسك بك *ضابط شرطة* متنكر! 👮‍♂️ تم القبض عليك!" },
    { success: false, type: "fail", fine: 0, health: 0, msg: "شعرت الضحية بيدك على حقيبتها، هربت وسط الحشد! 😤 فشلت." },
  ];

  const weights = [5, 20, 30, 15, 10, 20];
  const rand = Math.random() * 100;
  let cumulative = 0;
  let outcome = outcomes[5];

  for (let i = 0; i < outcomes.length; i++) {
    cumulative += weights[i];
    if (rand <= cumulative) {
      outcome = outcomes[i];
      break;
    }
  }

  let txt = "";

  if (outcome.success) {
    user.koin = (user.koin || 0) + outcome.money;
    await addExpWithLevelCheck(sock, m, db, user, outcome.exp);

    txt = `عملية ناجحة! 🦹‍♂️✨\n\n`;
    txt += `${outcome.msg}\n\n`;
    txt += `💰 الأموال المسروقة: *+${outcome.money.toLocaleString("ar-EG")}* عملة\n`;
    txt += `📈 خبرة السرقة: *+${outcome.exp}*`;
  } else {
    const actualFine = Math.min(outcome.fine, user.koin || 0);
    user.koin = Math.max(0, (user.koin || 0) - actualFine);
    user.rpg.health = Math.max(0, user.rpg.health - outcome.health);

    txt = `فشل ذريع!! 🚨🤬\n\n`;
    txt += `${outcome.msg}\n\n`;
    if (outcome.fine > 0) txt += `💸 الغرامة/المصادرة: *-${actualFine.toLocaleString("ar-EG")}* عملة\n`;
    if (outcome.health > 0) txt += `🤕 نقص الصحة: *-${outcome.health} نقطة*`;

    if (user.rpg.health <= 0) {
      user.rpg.health = 0;
      user.exp = Math.floor((user.exp || 0) / 2);
      txt += `\n\n💀 *لقد مت نتيجة الضرب!*\nخسرت 50% من خبرتك! 😭`;
    }
  }

  db.save();
  await sendRpgPreview(sock, m.chat, txt, "🦹 نتيجة السرقة", "النتيجة!", { quoted: m });
}

export { pluginConfig as config, handler };