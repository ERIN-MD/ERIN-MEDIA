// جريمة - أمر لارتكاب جريمة (سرقة ATM) بمخاطر عالية

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "جريمة",
  alias: ["crime"],
  category: "rpg",
  description: "ارتكاب جريمة (سرقة ATM) بمخاطر عالية",
  usage: ".جريمة",
  example: ".جريمة",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 300,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};

  await m.react("💣");
  await m.reply("تثبيت جهاز اختراق على جهاز الصراف الآلي... 💣💻");
  await new Promise((r) => setTimeout(r, 2500));

  const successRate = 0.5;
  const isSuccess = Math.random() < successRate;

  if (isSuccess) {
    const stolen = Math.floor(Math.random() * 15000) + 5000;
    const expGain = Math.floor(stolen / 20);

    user.koin = (user.koin || 0) + stolen;
    await addExpWithLevelCheck(sock, m, db, user, expGain);

    db.save();

    let txt = `نجح الاختراق!! 💻💵\n\n`;
    txt += `انهمرت الأموال من الصراف الآلي كالشلال! هربت بحقيبة مليئة بالمال.\n\n`;
    txt += `💰 المبلغ المسروق: *+${stolen.toLocaleString("ar-EG")}* عملة\n`;
    txt += `📈 خبرة الجريمة: *+${expGain}*`;

    await m.reply(txt);
  } else {
    const fine = Math.floor(Math.random() * 10000) + 5000;
    const actualFine = Math.min(fine, user.koin || 0);

    user.koin = Math.max(0, (user.koin || 0) - actualFine);
    user.rpg.health = Math.max(0, (user.rpg.health || 100) - 15);

    db.save();

    let txt = `صفارات الإنذار تدوي!! 🚨🚓\n\n`;
    txt += `فشل الاختراق! جهاز الصراف الآلي تعطل وهرعت الشرطة من كل مكان!\n`;
    txt += `تم ضربك بهراوة الشرطة وأجبرت على دفع غرامة.\n\n`;
    txt += `💸 الغرامة: *-${actualFine.toLocaleString("ar-EG")}* عملة\n`;
    txt += `🤕 كدمات من الضرب: *-15 نقطة صحة*`;

    await m.reply(txt);
  }
}

export { pluginConfig as config, handler };