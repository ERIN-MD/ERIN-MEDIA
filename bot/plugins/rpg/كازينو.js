// كازينو - أمر للعب القمار

import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "كازينو",
  alias: ["casino"],
  category: "rpg",
  description: "العب في الكازينو للمراهنة",
  usage: ".كازينو <المبلغ>",
  example: ".كازينو 10000",
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

  let bet = args[0];

  if (!bet) {
    let txt = `🎰 *كازينو لاس فيغاس* 🎰\n\n`;
    txt += `مرحباً في الكازينو! هل تريد اختبار حظك مع القمار؟\n\n`;
    txt += `*طريقة المراهنة:*\n`;
    txt += `👉 \`${m.prefix}كازينو <المبلغ>\`\n\n`;
    txt += `مثال:\n`;
    txt += `👉 \`${m.prefix}كازينو 10000\`\n`;
    txt += `👉 \`${m.prefix}كازينو الكل\` (مخاطرة كبيرة!)`;
    return m.reply(txt);
  }

  if (/^all$/i.test(bet) || bet === "الكل") {
    bet = user.koin || 0;
  } else {
    bet = parseInt(bet);
  }

  if (isNaN(bet) || bet < 1000) {
    return m.reply(`المبلغ صغير جداً! 💸\nالحد الأدنى للمراهنة هنا *1000* عملة!`);
  }

  if (bet > (user.koin || 0)) {
    return m.reply(`ليس لديك ما يكفي من المال! 😂\nلديك فقط *${(user.koin || 0).toLocaleString("ar-EG")}* عملة وتحاول المراهنة بـ *${bet.toLocaleString("ar-EG")}*.\nاذهب للعمل أولاً!`);
  }

  await m.react("🎰");
  await m.reply(`🎲 القمار يخلط الأوراق ويدير عجلة الروليت... احبس أنفاسك!`);
  await new Promise((r) => setTimeout(r, 2500));

  const playerScore = Math.floor(Math.random() * 100);
  const botScore = Math.floor(Math.random() * 100);

  let result, emoji, moneyChange, bandarTaunt;

  if (playerScore > botScore) {
    result = "فوز!";
    emoji = "🎉";
    moneyChange = bet;
    user.koin = (user.koin || 0) + bet;
    bandarTaunt = `"محظوظ هذه المرة!" - *القمار* 😒`;
  } else if (playerScore < botScore) {
    result = "خسارة!";
    emoji = "💸";
    moneyChange = -bet;
    user.koin = (user.koin || 0) - bet;
    bandarTaunt = `"هاها! ازددت فقراً!" - *القمار* 😈`;
  } else {
    result = "تعادل!";
    emoji = "🤝";
    moneyChange = 0;
    bandarTaunt = `"هوو... تعادل؟ جرأة عالية." - *القمار* 👀`;
  }

  db.save();

  await m.react(emoji);

  let txt = `🎰 *انتهت جولة الكازينو!* 🎰\n\n`;
  txt += `*النتيجة:*\n`;
  txt += `👤 نقاطك: *${playerScore}*\n`;
  txt += `🤖 نقاط القمار: *${botScore}*\n\n`;
  txt += `*النتيجة: ${emoji} ${result}*\n`;
  if (moneyChange !== 0) {
    txt += `تغير الرصيد: *${moneyChange > 0 ? "+" : ""}${moneyChange.toLocaleString("ar-EG")}* عملة\n\n`;
  } else {
    txt += `رصيدك كما هو (عاد المبلغ)\n\n`;
  }
  txt += `${bandarTaunt}\n\n`;
  txt += `*رصيدك المتبقي:* ${(user.koin || 0).toLocaleString("ar-EG")} عملة`;

  m.reply(txt);
}

export { pluginConfig as config, handler };