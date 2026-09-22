// قلب_العملة - أمر للمراهنة على قلب العملة

import { getDatabase } from "../../src/lib/maro-database.js";
import { sendRpgPreview } from "../../src/lib/maro-context.js";

const pluginConfig = {
  name: "قلب_العملة",
  alias: ["coinflip"],
  category: "rpg",
  description: "المقامرة بقلب العملة",
  usage: ".قلب_العملة <رأس/ذيل> <المبلغ>",
  example: ".قلب_العملة رأس 5000",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  const args = m.args || [];
  const choice = args[0]?.toLowerCase();
  const bet = parseInt(args[1]);

  if (!choice || (choice !== "heads" && choice !== "tails" && choice !== "h" && choice !== "t" && choice !== "رأس" && choice !== "ذيل")) {
    return m.reply(
      `🪙 *خمن العملة* 🪙\n\n` +
        `اختر رأس (Head) أو ذيل (Tail)!\n\n` +
        `*طريقة اللعب:*\n` +
        `👉 \`.قلب_العملة رأس <المبلغ>\`\n` +
        `👉 \`.قلب_العملة ذيل <المبلغ>\``
    );
  }

  if (!bet || bet < 1000) {
    return m.reply(`المبلغ صغير جداً! الحد الأدنى *1000* عملة! 🪙`);
  }

  if ((user.koin || 0) < bet) {
    return m.reply(`ليس لديك ما يكفي من المال! لديك *${(user.koin || 0).toLocaleString("ar-EG")}* عملة فقط وتحاول المراهنة بـ *${bet.toLocaleString("ar-EG")}*! 😜`);
  }

  user.koin -= bet;

  // دعم الاختيار بالعربية
  let userChoice = "";
  if (choice === "heads" || choice === "h" || choice === "رأس") {
    userChoice = "heads";
  } else if (choice === "tails" || choice === "t" || choice === "ذيل") {
    userChoice = "tails";
  }

  const result = Math.random() < 0.5 ? "heads" : "tails";
  const emoji = result === "heads" ? "🦅" : "🪙";

  await sendRpgPreview(sock, m.chat, `*رن!* تم رمي العملة الذهبية عالياً... تدور في الهواء... 🪙✨`, "🪙 قلب العملة", "جاري الرمي!", { quoted: m });
  await new Promise((r) => setTimeout(r, 2500));

  const isWin = userChoice === result;

  // ترجمة النتائج للعرض
  const choiceDisplay = userChoice === "heads" ? "رأس" : "ذيل";
  const resultDisplay = result === "heads" ? "رأس" : "ذيل";

  let txt = `*بلاك!* أمسك القمار بالعملة في يده! 👋\n\n`;
  txt += `اختيارك: *${choiceDisplay}*\n`;
  txt += `نتيجة العملة: *${resultDisplay}* ${emoji}\n\n`;

  if (isWin) {
    const winnings = bet * 2;
    user.koin = (user.koin || 0) + winnings;
    txt += `🎉 *أحسنت! اختيارك صحيح!*\n`;
    txt += `💰 الأرباح: *+${winnings.toLocaleString("ar-EG")}* عملة`;
  } else {
    txt += `🤣 *هاها! خمنت خطأ!*\n`;
    txt += `💸 خسرت: *-${bet.toLocaleString("ar-EG")}* عملة`;
  }

  db.save();
  await sendRpgPreview(sock, m.chat, txt, "🪙 قلب العملة", "النتيجة!", {
    quoted: m,
  });
}

export { pluginConfig as config, handler };