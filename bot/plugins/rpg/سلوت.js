// سلوت - أمر للعب آلة القمار

import { getDatabase } from "../../src/lib/maro-database.js";
import { sendRpgPreview } from "../../src/lib/maro-context.js";

const pluginConfig = {
  name: "سلوت",
  alias: ["slot"],
  category: "rpg",
  description: "العب آلة القمار",
  usage: ".سلوت <المبلغ>",
  example: ".سلوت 5000",
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
  let bet = parseInt(args[0]);

  if (!bet || bet < 1000) {
    return m.reply(`الحد الأدنى للرهان هو *1000* عملة! 🎰\nمثال: \`.سلوت 5000\``);
  }

  if ((user.koin || 0) < bet) {
    return m.reply(`رصيدك منخفض! 💸\nرصيدك: *${(user.koin || 0).toLocaleString("ar-EG")}* عملة\nالمطلوب: *${bet.toLocaleString("ar-EG")}* عملة`);
  }

  user.koin -= bet;

  const symbols = ["🍒", "🍋", "🍊", "🍇", "💎", "7️⃣"];
  const weights = [30, 25, 20, 15, 7, 3];

  function spin() {
    const rand = Math.random() * 100;
    let cumulative = 0;
    for (let i = 0; i < symbols.length; i++) {
      cumulative += weights[i];
      if (rand <= cumulative) return symbols[i];
    }
    return symbols[0];
  }

  const result = [spin(), spin(), spin()];

  await sendRpgPreview(sock, m.chat, `🎰 *طرق طرق طرق...* تم سحب الذراع! آلة القمار تدور بسرعة...`, "🎰 آلة القمار", "جاري الدوران!", {
    quoted: m,
  });
  await new Promise((r) => setTimeout(r, 2500));

  let multiplier = 0;
  let winText = "";

  if (result[0] === result[1] && result[1] === result[2]) {
    if (result[0] === "7️⃣") {
      multiplier = 10;
      winText = "رائع!! جاكبوت 777!! 🎉💸 (10 أضعاف)";
    } else if (result[0] === "💎") {
      multiplier = 5;
      winText = "ممتاز! ماس سوبر!! 💎✨ (5 أضعاف)";
    } else {
      multiplier = 3;
      winText = "رائع! ثلاثية متطابقة!! 🍒🎰 (3 أضعاف)";
    }
  } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
    multiplier = 1.5;
    winText = "جيد! زوج!! 👍 (1.5 ضعف)";
  }

  const winnings = Math.floor(bet * multiplier);
  user.koin = (user.koin || 0) + winnings;

  let txt = `🎰 *نتيجة آلة القمار* 🎰\n\n`;
  txt += `[ ${result[0]} | ${result[1]} | ${result[2]} ]\n\n`;

  if (multiplier > 0) {
    txt += `${winText}\n`;
    txt += `💰 الأرباح: *+${winnings.toLocaleString("ar-EG")}* عملة\n`;
  } else {
    txt += `خسارة!! ابتلعت الآلة أموالك! 😭💸\n`;
    txt += `💸 الخسارة: *-${bet.toLocaleString("ar-EG")}* عملة\n`;
  }

  db.save();
  await sendRpgPreview(sock, m.chat, txt, "🎰 النتيجة", "انتهى", { quoted: m });
}

export { pluginConfig as config, handler };