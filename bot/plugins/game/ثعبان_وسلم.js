import { getDatabase } from "../../src/lib/maro-database.js";
import {
  drawBoard,
  getRandomMap,
  DICE_STICKERS,
} from "../../src/lib/maro-game-ulartangga.js";
import config from "../../config.js";
import fs from "fs";
import path from "path";
import te from "../../src/lib/maro-error.js";
const pluginConfig = {
  name: "ثعبان_وسلم",
  alias: ["ut"],
  category: "game",
  description: "العب ثعبان وسلم مع لاعبين آخرين مع لوحة مرئية",
  usage: ".ثعبان_وسلم <انشاء|انضمام|بدء|معلومات|خروج|حذف>",
  example: ".ثعبان_وسلم انشاء",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

if (!global.ulartanggaGames) global.ulartanggaGames = {};

const PLAYER_COLORS = ["🔴", "🟡", "🟢", "🔵"];
const PLAYER_NAMES = ["أحمر", "أصفر", "أخضر", "أزرق"];

const WIN_REWARD = { koin: 2000, exp: 1000, energi: 5 };

function uniqueMentions(mentions = []) { return [...new Set((mentions || []).filter(Boolean))]; }

let thumbUT = null;
try { const thumbPath = path.join(process.cwd(), "assets", "image", "maro-games.jpg"); if (fs.existsSync(thumbPath)) { thumbUT = fs.readFileSync(thumbPath); } } catch (e) { }

function utCtx(mentions) {
  const saluranId = config.saluran?.id || "120363400911374213@newsletter";
  const saluranName = config.saluran?.name || config.bot?.name || "Maro-AI";
  const normalizedMentions = uniqueMentions(mentions);
  return { forwardingScore: 9999, isForwarded: true, mentionedJid: normalizedMentions.length ? normalizedMentions : undefined, forwardedNewsletterMessageInfo: { newsletterJid: saluranId, newsletterName: saluranName, serverMessageId: 127 } };
}

async function sendUT(sock, jid, text, title, body, mentions, options) {
  const msgId = await sock.sendPreview(jid, { caption: `${config.info.website} ${text}`, url: `${config.info.website}`, title: title || "🐍🎲 ثعبان وسلم", description: body || "اللعبة الكلاسيكية!", jpegThumbnail: thumbUT, previewType: 0 }, { contextInfo: utCtx(mentions), ...options });
  return { key: { id: msgId, remoteJid: jid, fromMe: true } };
}

async function handler(m, { sock }) {
  const db = getDatabase();
  const args = m.args || [];
  const action = args[0]?.toLowerCase();
  const ut = global.ulartanggaGames;
  const prefix = m.prefix || config.command?.prefix || ".";

  const commands = {
    انشاء: async () => {
      if (ut[m.chat]) { return sendUT(sock, m.chat, `❌ *الغرفة موجودة*\n\n> ما زالت هناك جلسة لعب!\n> المضيف: @${ut[m.chat].host.split("@")[0]}\n> الحالة: ${ut[m.chat].status}`, "🐍🎲 ثعبان وسلم", "اللعبة الكلاسيكية!", [ut[m.chat].host], { quoted: m }); }
      const mapConfig = getRandomMap();
      ut[m.chat] = { date: Date.now(), status: "WAITING", host: m.sender, players: {}, turn: 0, map: mapConfig.map, mapName: mapConfig.name, snakesLadders: mapConfig.snakesLadders, stabil_x: mapConfig.stabil_x, stabil_y: mapConfig.stabil_y };
      ut[m.chat].players[m.sender] = { rank: "HOST", position: 1 };
      await m.react("🎲");
      await sendUT(sock, m.chat, `🐍🎲 *ثعبان وسلم*\n\nتم إنشاء الغرفة!\n\n╭┈┈⬡「 📋 *معلومات* 」\n┃ 👑 المضيف: @${m.sender.split("@")[0]}\n┃ 👥 اللاعبون: 1/4\n┃ 🗺️ الخريطة: ${mapConfig.name}\n╰┈┈┈┈┈┈┈┈⬡\n\n╭┈┈⬡「 🎮 *الأوامر* 」\n┃ ➕ \`${prefix}ut انضمام\` - انضم\n┃ ▶️ \`${prefix}ut بدء\` - ابدأ\n┃ ℹ️ \`${prefix}ut معلومات\` - معلومات\n┃ 🚪 \`${prefix}ut خروج\` - اخرج\n╰┈┈┈┈┈┈┈┈⬡`, "🎲 تم إنشاء الغرفة", "انضموا!", [m.sender], { quoted: m });
    },

    انضمام: async () => {
      if (!ut[m.chat]) { return m.reply(`❌ لا توجد جلسة!\n> اكتب \`${prefix}ut انشاء\` لإنشاء غرفة.`); }
      if (ut[m.chat].players[m.sender]) { return m.reply(`❌ أنت منضم بالفعل!`); }
      const playerCount = Object.keys(ut[m.chat].players).length;
      if (playerCount >= 4) { return m.reply(`❌ الغرفة ممتلئة! (4 كحد أقصى)`); }
      if (ut[m.chat].status === "PLAYING") { return m.reply(`❌ اللعبة جارية، لا يمكن الانضمام!`); }
      ut[m.chat].players[m.sender] = { rank: "MEMBER", position: 1 };
      const players = Object.keys(ut[m.chat].players);
      const playerList = players.map((p, i) => `${PLAYER_COLORS[i]} ${PLAYER_NAMES[i]}: @${p.split("@")[0]}`).join("\n");
      await m.react("✅");
      await sendUT(sock, m.chat, `✅ *انضم لاعب*\n\n@${m.sender.split("@")[0]} انضم!\n\n╭┈┈⬡「 👥 *اللاعبون* 」\n${playerList.split("\n").map((l) => `┃ ${l}`).join("\n")}\n╰┈┈┈┈┈┈┈┈⬡\n\n> المجموع: ${players.length}/4\n> ${players.length >= 2 ? `✅ يمكن البدء! \`${prefix}ut بدء\`` : "🕕 يحتاج لاعب آخر"}`, "👥 انضم لاعب", `${players.length}/4 لاعبين`, players, { quoted: m });
    },

    بدء: async () => {
      if (!ut[m.chat]) { return m.reply(`❌ لا توجد جلسة!`); }
      if (ut[m.chat].status === "PLAYING") { return m.reply(`❌ اللعبة بدأت بالفعل!`); }
      if (ut[m.chat].host !== m.sender && !config.isOwner?.(m.sender)) { return m.reply(`❌ فقط المضيف يمكنه البدء!`); }
      const players = Object.keys(ut[m.chat].players);
      if (players.length < 2) { return m.reply(`❌ لاعبين على الأقل!`); }
      ut[m.chat].status = "PLAYING"; ut[m.chat].turn = 0;
      const playerList = players.map((p, i) => `${PLAYER_COLORS[i]} ${PLAYER_NAMES[i]}: @${p.split("@")[0]}`).join("\n");
      const positions = players.map((p) => ut[m.chat].players[p].position);
      const boardImage = await drawBoard(ut[m.chat].map, positions[0] || null, positions[1] || null, positions[2] || null, positions[3] || null, ut[m.chat].stabil_x, ut[m.chat].stabil_y);
      await m.react("🎮");
      if (boardImage) { await sock.sendMessage(m.chat, { image: boardImage, caption: `🐍🎲 *بدأت اللعبة!*\n\n╭┈┈⬡「 👥 *اللاعبون* 」\n${playerList.split("\n").map((l) => `┃ ${l}`).join("\n")}\n╰┈┈┈┈┈┈┈┈⬡\n\n> 🎯 الدور: @${players[0].split("@")[0]}\n> اكتب *ارمي* لرمي النرد!`, contextInfo: utCtx(players) }, { quoted: m }); }
      else { await sendUT(sock, m.chat, `🐍🎲 *بدأت اللعبة!*\n\n╭┈┈⬡「 👥 *اللاعبون* 」\n${playerList.split("\n").map((l) => `┃ ${l}`).join("\n")}\n╰┈┈┈┈┈┈┈┈⬡\n\n> 🎯 الدور: @${players[0].split("@")[0]}\n> اكتب *ارمي* لرمي النرد!`, "🎮 بدأت اللعبة", "ارمِ النرد!", players, { quoted: m }); }
    },

    معلومات: async () => {
      if (!ut[m.chat]) { return m.reply(`❌ لا توجد جلسة!`); }
      const players = Object.keys(ut[m.chat].players);
      const playerList = players.map((p, i) => { const pos = ut[m.chat].players[p].position; return `${PLAYER_COLORS[i]} ${PLAYER_NAMES[i]}: @${p.split("@")[0]} - م: ${pos}`; }).join("\n");
      const currentTurn = ut[m.chat].status === "PLAYING" ? players[ut[m.chat].turn % players.length] : null;
      await sock.sendMessage(m.chat, { text: `🐍🎲 *معلومات الغرفة*\n\n╭┈┈⬡「 📋 *الغرفة* 」\n┃ 👑 المضيف: @${ut[m.chat].host.split("@")[0]}\n┃ 📍 الحالة: ${ut[m.chat].status}\n┃ 🗺️ الخريطة: ${ut[m.chat].mapName}\n┃ 👥 اللاعبون: ${players.length}/4\n╰┈┈┈┈┈┈┈┈⬡\n\n╭┈┈⬡「 👥 *اللاعبون* 」\n${playerList.split("\n").map((l) => `┃ ${l}`).join("\n")}\n╰┈┈┈┈┈┈┈┈⬡` + (currentTurn ? `\n\n> 🎯 الدور: @${currentTurn.split("@")[0]}` : ""), contextInfo: utCtx(players) }, { quoted: m });
    },

    خروج: async () => {
      if (!ut[m.chat]) { return m.reply(`❌ لا توجد جلسة!`); }
      if (!ut[m.chat].players[m.sender]) { return m.reply(`❌ لست في اللعبة!`); }
      delete ut[m.chat].players[m.sender];
      await sendUT(sock, m.chat, `👋 @${m.sender.split("@")[0]} خرج من اللعبة.`, "🐍🎲 ثعبان وسلم", "اللعبة الكلاسيكية!", [m.sender], { quoted: m });
      if (Object.keys(ut[m.chat].players).length === 0) { delete ut[m.chat]; return m.reply(`🗑️ حُذفت الغرفة لعدم وجود لاعبين.`); }
      if (!ut[m.chat].players[ut[m.chat].host]) { const newHost = Object.keys(ut[m.chat].players)[0]; ut[m.chat].host = newHost; ut[m.chat].players[newHost].rank = "HOST"; await sendUT(sock, m.chat, `👑 انتقلت الاستضافة إلى @${newHost.split("@")[0]}`, "🐍🎲 ثعبان وسلم", "اللعبة الكلاسيكية!", [newHost], { quoted: m }); }
      if (ut[m.chat].status === "PLAYING") { const players = Object.keys(ut[m.chat].players); ut[m.chat].turn = ut[m.chat].turn % players.length; await sendUT(sock, m.chat, `> الدور: @${players[ut[m.chat].turn].split("@")[0]}\n> اكتب *ارمي*`, "🐍🎲 ثعبان وسلم", "اللعبة الكلاسيكية!", [players[ut[m.chat].turn]]); }
    },

    حذف: async () => {
      if (!ut[m.chat]) { return m.reply(`❌ لا توجد جلسة!`); }
      if (ut[m.chat].host !== m.sender && !config.isOwner?.(m.sender)) { return m.reply(`❌ فقط المضيف يمكنه الحذف!`); }
      delete ut[m.chat]; await m.react("🗑️"); await m.reply(`🗑️ تم حذف الغرفة!`);
    },
  };

  if (!action || !commands[action]) {
    return sendUT(sock, m.chat, `🐍🎲 *ثعبان وسلم*\n\nاللعبة الكلاسيكية المليئة بالمغامرات!\nاصعد السلالم، تجنب الثعابين، حتى 100!\n\n╭┈┈⬡「 🎮 *الأوامر* 」\n┃ 🎲 \`${prefix}ut انشاء\` - إنشاء غرفة\n┃ ➕ \`${prefix}ut انضمام\` - انضم\n┃ ▶️ \`${prefix}ut بدء\` - ابدأ\n┃ ℹ️ \`${prefix}ut معلومات\` - معلومات\n┃ 🚪 \`${prefix}ut خروج\` - اخرج\n┃ 🗑️ \`${prefix}ut حذف\` - حذف\n╰┈┈┈┈┈┈┈┈⬡\n\n╭┈┈⬡「 🏆 *الجوائز* 」\n┃ 💰 +${WIN_REWARD.koin.toLocaleString()} عملات\n┃ ⭐ +${WIN_REWARD.exp.toLocaleString()} خبرة\n┃ ⚡ +${WIN_REWARD.energi} طاقة\n╰┈┈┈┈┈┈┈┈⬡\n\n> لاعبين على الأقل، 4 كحد أقصى`, "🐍🎲 ثعبان وسلم", "هيا نلعب!", [], { quoted: m });
  }

  try { await commands[action](); } catch (error) { console.error("[ULARTANGGA ERROR]", error); m.reply(te(m.prefix, m.command, m.pushName)); }
}

async function answerHandler(m, sock) {
  if (!m.body) return false;
  const text = m.body.trim().toLowerCase();
  if (text !== "ارمي") return false;
  const ut = global.ulartanggaGames;
  if (!ut[m.chat]) return false;
  if (ut[m.chat].status !== "PLAYING") return false;
  const players = Object.keys(ut[m.chat].players);
  if (!players.includes(m.sender)) return false;
  const currentTurn = ut[m.chat].turn % players.length;
  if (players.indexOf(m.sender) !== currentTurn) { await m.reply(`❌ ليس دورك!\n> الدور: @${players[currentTurn].split("@")[0]}`, { mentions: [players[currentTurn]] }); return true; }
  const db = getDatabase();
  const dadu = Math.floor(Math.random() * 6) + 1;
  const DICE_EMOJI = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  try { const diceUrl = DICE_STICKERS[dadu - 1]; await sock.sendMessage(m.chat, { sticker: { url: diceUrl }, contextInfo: utCtx() }, { quoted: m }); } catch (e) { await m.react(DICE_EMOJI[dadu - 1]); }
  const oldPos = ut[m.chat].players[m.sender].position;
  let newPos = oldPos + dadu;
  if (newPos > 100) { newPos = 100 - (newPos - 100); }
  let event = "";
  const snakesLadders = ut[m.chat].snakesLadders;
  if (snakesLadders[newPos]) { const destination = snakesLadders[newPos]; event = destination > newPos ? `\n🪜 *صعد السلم!*` : `\n🐍 *وقع في الثعبان!*`; newPos = destination; }
  ut[m.chat].players[m.sender].position = newPos;
  const playerIdx = players.indexOf(m.sender);
  const color = PLAYER_COLORS[playerIdx];
  const name = PLAYER_NAMES[playerIdx];

  if (newPos === 100) {
    try { db.updateKoin(m.sender, WIN_REWARD.koin); db.updateEnergi(m.sender, WIN_REWARD.energi); const userData = db.getUser(m.sender) || {}; userData.exp = (userData.exp || 0) + WIN_REWARD.exp; db.setUser(m.sender, userData); } catch (e) { console.log("[UT] فشل إعطاء الجائزة:", e.message); }
    const positions = players.map((p) => ut[m.chat].players[p]?.position || null);
    const boardImage = await drawBoard(ut[m.chat].map, positions[0] || null, positions[1] || null, positions[2] || null, positions[3] || null, ut[m.chat].stabil_x, ut[m.chat].stabil_y);
    await m.react("🎉");
    if (boardImage) { await sock.sendMessage(m.chat, { image: boardImage, caption: `🎉 *الفائز!*\n\n${color} @${m.sender.split("@")[0]} وصل إلى 100!\n\n╭┈┈⬡「 🎁 *الجائزة* 」\n┃ 💰 +${WIN_REWARD.koin.toLocaleString()} عملات\n┃ ⭐ +${WIN_REWARD.exp.toLocaleString()} خبرة\n┃ ⚡ +${WIN_REWARD.energi} طاقة\n╰┈┈┈┈┈┈┈┈⬡\n\n> أحسنت! العب مجدداً؟ \`.ut انشاء\``, contextInfo: utCtx([m.sender]) }); }
    else { await sendUT(sock, m.chat, `🎉 *الفائز!*\n\n${color} @${m.sender.split("@")[0]} وصل إلى 100!\n\n╭┈┈⬡「 🎁 *الجائزة* 」\n┃ 💰 +${WIN_REWARD.koin.toLocaleString()} عملات\n┃ ⭐ +${WIN_REWARD.exp.toLocaleString()} خبرة\n┃ ⚡ +${WIN_REWARD.energi} طاقة\n╰┈┈┈┈┈┈┈┈⬡`, "🏆 فائز!", `${name} فاز!`, [m.sender]); }
    delete ut[m.chat]; return true;
  }

  ut[m.chat].turn++;
  const nextTurn = ut[m.chat].turn % players.length;
  const nextPlayer = players[nextTurn];
  const positions = players.map((p) => ut[m.chat].players[p]?.position || null);
  const boardImage = await drawBoard(ut[m.chat].map, positions[0] || null, positions[1] || null, positions[2] || null, positions[3] || null, ut[m.chat].stabil_x, ut[m.chat].stabil_y);
  if (boardImage) { await sock.sendMessage(m.chat, { image: boardImage, caption: `🎲 *النرد: ${dadu}* ${DICE_EMOJI[dadu - 1]}\n\n${color} ${name}: *${oldPos}* → *${newPos}*${event}\n\n> 🎯 الدور: @${nextPlayer.split("@")[0]}\n> اكتب *ارمي*`, contextInfo: utCtx([nextPlayer]) }); }
  else { await sendUT(sock, m.chat, `🎲 *النرد: ${dadu}* ${DICE_EMOJI[dadu - 1]}\n\n${color} ${name}: *${oldPos}* → *${newPos}*${event}\n\n> 🎯 الدور: @${nextPlayer.split("@")[0]}\n> اكتب *ارمي*`, "🎲 الدور", PLAYER_NAMES[nextTurn], [nextPlayer]); }
  return true;
}

export { pluginConfig as config, handler, answerHandler }