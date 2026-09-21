// نرد - أمر للمراهنة على رمي النرد

import { getDatabase } from "../../src/lib/maro-database.js";
import { sendRpgPreview } from "../../src/lib/maro-context.js";

const pluginConfig = {
  name: "نرد",
  alias: ["dice"],
  category: "rpg",
  description: "رمي النرد للمراهنة",
  usage: ".نرد <1-6> <المبلغ>",
  example: ".نرد 6 5000",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 15,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  const args = m.args || [];
  const guess = parseInt(args[0]);
  const bet = parseInt(args[1]);

  if (!guess || guess < 1 || guess > 6) {
    return m.reply(
      `🎲 *نرد الشارع* 🎲\n\n` +
        `خمن الرقم الذي سيظهر! (1-6)\n\n` +
        `*طريقة اللعب:*\n` +
        `👉 \`.نرد <الرقم> <المبلغ>\`\n\n` +
        `*مثال:*\n` +
        `👉 \`.نرد 6 5000\``
    );
  }

  if (!bet || bet < 1000) {
    return m.reply(`المبلغ صغير جداً! الحد الأدنى *1000* عملة! 🎲`);
  }

  if ((user.koin || 0) < bet) {
    return m.reply(`ليس لديك ما يكفي من المال! لديك *${(user.koin || 0).toLocaleString("ar-EG")}* عملة فقط. لا تقترض هنا! 😤`);
  }

  user.koin -= bet;

  await sendRpgPreview(sock, m.chat, `🎲 يهز القمار النرد في وعاء خشبي... *طرق طرق طرق*...`, "🎲 نرد الشارع", "جاري الرمي!", { quoted: m });
  await new Promise((r) => setTimeout(r, 2500));

  const result = Math.floor(Math.random() * 6) + 1;
  const diceEmoji = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][result - 1];

  const isWin = guess === result;

  // ترجمة أسماء الأرقام
  const numberNames = {
    1: "واحد",
    2: "اثنان",
    3: "ثلاثة",
    4: "أربعة",
    5: "خمسة",
    6: "ستة"
  };

  let txt = `*تم فتح الوعاء!* 🎲💥\n\n`;
  txt += `تخمينك: *${guess} (${numberNames[guess]})*\n`;
  txt += `نتيجة النرد: *${result} (${numberNames[result]})* ${diceEmoji}\n\n`;

  if (isWin) {
    const winnings = bet * 5;
    user.koin = (user.koin || 0) + winnings;
    txt += `🎉 *محظوظ جداً!*\n`;
    txt += `💰 الأرباح ×5: *+${winnings.toLocaleString("ar-EG")}* عملة`;
  } else {
    txt += `🤣 *لقد خمنت خطأ!*\n`;
    txt += `💸 خسرت: *-${bet.toLocaleString("ar-EG")}* عملة`;
  }

  db.save();
  await sendRpgPreview(sock, m.chat, txt, "🎲 نتيجة النرد", "النتيجة!", { quoted: m });
}

export { pluginConfig as config, handler };