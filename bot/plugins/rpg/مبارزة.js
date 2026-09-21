// مبارزة - أمر للمبارزة PvP مع لاعب آخر

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";
import { sendRpgPreview } from "../../src/lib/maro-context.js";

const pluginConfig = {
  name: "مبارزة",
  alias: ["duel"],
  category: "rpg",
  description: "مبارزة PvP مع لاعب آخر",
  usage: ".مبارزة @مستخدم <المبلغ>",
  example: ".مبارزة @مستخدم 5000",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 120,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const args = m.args || [];

  const target = m.mentionedJid?.[0] || m.quoted?.sender;
  const bet = parseInt(args[1]) || 1000;

  if (!target) {
    let txt = `⚔️ *مبارزة مراهنة* ⚔️\n\n`;
    txt += `تحدى صديقك في مبارزة مع رهان مالي!\n\n`;
    txt += `*طريقة التحدي:*\n`;
    txt += `👉 \`.مبارزة @مستخدم 5000\`\n`;
    txt += `_(يعني أنك تتحداه في مبارزة برهان 5000 عملة)_`;
    return m.reply(txt);
  }

  if (target === m.sender) {
    return m.reply(`هل تريد مبارزة نفسك؟ ابحث عن خصم آخر! 😂`);
  }

  if (bet < 1000) {
    return m.reply(`الرهان صغير جداً! الحد الأدنى للمبارزة هو *1000* عملة! 💸`);
  }

  const player1 = db.getUser(m.sender);
  const player2 = db.getUser(target) || db.setUser(target);

  if ((player1.koin || 0) < bet) {
    return m.reply(`رصيدك غير كافٍ لهذا الرهان!\nعملاتك الحالية: *${(player1.koin || 0).toLocaleString("ar-EG")}* عملة`);
  }

  if ((player2.koin || 0) < bet) {
    return m.reply(`رصيد خصمك غير كافٍ لهذا الرهان. ابحث عن خصم آخر أو قلل المبلغ!`);
  }

  if (!player1.rpg) player1.rpg = {};
  if (!player2.rpg) player2.rpg = {};

  player1.rpg.health = player1.rpg.health || 100;
  player2.rpg.health = player2.rpg.health || 100;

  if (player1.rpg.health < 30) {
    return m.reply(`صحتك منخفضة جداً (*${player1.rpg.health} نقطة*). تحتاج على الأقل *30 نقطة صحة* للمبارزة. استرح أولاً! 💉`);
  }

  await sendRpgPreview(sock, m.chat, `⚔️ *بدأت المبارزة!* ⚔️\n\n@${m.sender.split("@")[0]} يتحدى @${target.split("@")[0]} بجرأة!\n💰 الرهان في الوسط: *${(bet * 2).toLocaleString("ar-EG")}* عملة`, "⚔️ ساحة المبارزة", "معركة!", { quoted: m });

  await new Promise((r) => setTimeout(r, 2000));

  const p1Power = (player1.rpg.level || 1) * 10 + Math.random() * 50;
  const p2Power = (player2.rpg.level || 1) * 10 + Math.random() * 50;

  const winner = p1Power > p2Power ? m.sender : target;
  const loser = winner === m.sender ? target : m.sender;
  const winnerData = winner === m.sender ? player1 : player2;
  const loserData = winner === m.sender ? player2 : player1;

  winnerData.koin = (winnerData.koin || 0) + bet;
  loserData.koin = (loserData.koin || 0) - bet;
  loserData.rpg.health = Math.max(0, (loserData.rpg.health || 100) - 20);

  const expGain = 500;
  await addExpWithLevelCheck(sock, { ...m, sender: winner }, db, winnerData, expGain);

  db.save();

  let txt = `⚔️ *نتيجة المبارزة الدامية* ⚔️\n\n`;
  txt += `🏆 *الفائز:* @${winner.split("@")[0]}\n`;
  txt += `💀 *الخاسر:* @${loser.split("@")[0]} (انسحب مصاباً بجروح بالغة)\n\n`;
  txt += `🎁 *جائزة الفائز:*\n`;
  txt += `> 💰 رهان الخصم: *+${bet.toLocaleString("ar-EG")}* عملة\n`;
  txt += `> ✨ خبرة المبارزة الإضافية: *+${expGain} خبرة*`;

  await sendRpgPreview(sock, m.chat, txt, "⚔️ ساحة المبارزة", "نتيجة المبارزة!", { quoted: m });
}

export { pluginConfig as config, handler };