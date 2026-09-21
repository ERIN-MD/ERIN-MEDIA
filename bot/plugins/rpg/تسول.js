// التسول - أمر للتسول للحصول على بعض المال

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "تسول",
  alias: ["beg"],
  category: "rpg",
  description: "التسول للحصول على بعض المال",
  usage: ".تسول",
  example: ".تسول",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 60,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};

  await m.reply("🙏 *جاري التسول...*");
  await new Promise((r) => setTimeout(r, 2000));

  const responses = [
    { success: true, money: 500, exp: 10, msg: "شخص كريم أعطاك بعض المال!" },
    { success: true, money: 1000, exp: 20, msg: "حصلت على إكرامية من شخص طيب!" },
    { success: true, money: 2000, exp: 50, msg: "واو! وجدت شخصاً غنياً!" },
    { success: false, money: 0, exp: 0, msg: "لا أحد يهتم..." },
    { success: false, money: 0, exp: 0, msg: "الناس يتجاهلونك..." },
    { success: true, money: 100, exp: 5, msg: "حصلت على بعض العملات من جيب شخص!" },
    { success: false, money: -500, exp: 0, msg: "سارق سرق منك!" },
  ];

  const result = responses[Math.floor(Math.random() * responses.length)];

  if (result.money > 0) {
    user.koin = (user.koin || 0) + result.money;
    if (result.exp > 0) {
      await addExpWithLevelCheck(sock, m, db, user, result.exp);
    }
  } else if (result.money < 0) {
    user.koin = Math.max(0, (user.koin || 0) + result.money);
  }

  db.save();

  let txt = "";
  if (result.success && result.money > 0) {
    txt = `🙏 *نجح التسول*\n\n> ${result.msg}\n> 💰 حصلت على: *+${result.money.toLocaleString("ar-EG")}* عملة`;
    if (result.exp > 0) txt += `\n> 🚄 خبرة: *+${result.exp}*`;
  } else if (result.money < 0) {
    txt = `😭 *فشل التسول*\n\n> ${result.msg}\n> 💸 خسرت: *${Math.abs(result.money).toLocaleString("ar-EG")}* عملة`;
  } else {
    txt = `😢 *فشل التسول*\n\n> ${result.msg}`;
  }

  await m.reply(txt);
}

export { pluginConfig as config, handler };