import { getDatabase } from "../../src/lib/maro-database.js";
import config from "../../config.js";
import fs from "fs";
import path from "path";
import te from "../../src/lib/maro-error.js";
const pluginConfig = {
  name: "مستذئب",
  alias: ["ww"],
  category: "game",
  description: "العب مستذئب مع لاعبين آخرين",
  usage: ".مستذئب <انشاء|انضمام|بدء|تصويت|لاعبين|خروج|حذف>",
  example: ".مستذئب انشاء",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

if (!global.werewolfGames) global.werewolfGames = {};

let thumbWW = null;
let thumbNight = null;
let thumbDay = null;
let thumbWin = null;

try {
  const assetsPath = path.join(process.cwd(), "assets", "images");
  if (fs.existsSync(path.join(assetsPath, "maro-games.jpg"))) { thumbWW = fs.readFileSync(path.join(assetsPath, "maro-games.jpg")); }
  if (fs.existsSync(path.join(assetsPath, "maro.jpg"))) { thumbNight = fs.readFileSync(path.join(assetsPath, "maro.jpg")); thumbDay = fs.readFileSync(path.join(assetsPath, "maro.jpg")); }
  if (fs.existsSync(path.join(assetsPath, "maro-winner.jpg"))) { thumbWin = fs.readFileSync(path.join(assetsPath, "maro-winner.jpg")); }
} catch (e) { console.log("[WW] فشل تحميل الصور:", e.message); }

const ROLES = {
  werewolf: { emoji: "🐺", name: "مستذئب", team: "wolf", desc: "يقتل قروياً كل ليلة" },
  seer: { emoji: "🔮", name: "عراف", team: "village", desc: "يكشف دور لاعب كل ليلة" },
  guardian: { emoji: "🛡️", name: "حارس", team: "village", desc: "يحمي لاعباً كل ليلة" },
  sorcerer: { emoji: "🧙", name: "ساحر", team: "wolf", desc: "يكتشف العراف" },
  villager: { emoji: "👨‍🌾", name: "قروي", team: "village", desc: "يناقش ويصوت ضد المستذئب" },
};

const WIN_REWARD = { koin: 5000, exp: 1000 };
const MIN_PLAYERS = 4;
const MAX_PLAYERS = 15;
const PHASE_DURATION = { night: 60000, day: 90000 };

function wwCtx(mentions) {
  const saluranId = config.saluran?.id || "120363400911374213@newsletter";
  const saluranName = config.saluran?.name || config.bot?.name || "Maro-AI";
  return { forwardingScore: 9999, isForwarded: true, mentionedJid: mentions, forwardedNewsletterMessageInfo: { newsletterJid: saluranId, newsletterName: saluranName, serverMessageId: 127 } };
}

async function sendWW(sock, jid, text, title, body, thumbBuffer, mentions) {
  const msgId = await sock.sendPreview(jid, { caption: `${config.info.website} ${text}`, url: `${config.info.website}`, title: title || "🐺 مستذئب", description: body || "لعبة اجتماعية!", jpegThumbnail: thumbBuffer || thumbWW, previewType: 0 }, { contextInfo: wwCtx(mentions) });
  return { key: { id: msgId, remoteJid: jid, fromMe: true } };
}

function generateRoles(playerCount) {
  const roles = [];
  if (playerCount === 4) { roles.push("werewolf", "seer", "guardian", "villager"); }
  else if (playerCount === 5) { roles.push("werewolf", "seer", "guardian", "villager", "villager"); }
  else if (playerCount === 6) { roles.push("werewolf", "werewolf", "seer", "guardian", "villager", "villager"); }
  else if (playerCount === 7) { roles.push("werewolf", "werewolf", "seer", "guardian", "villager", "villager", "villager"); }
  else if (playerCount === 8) { roles.push("werewolf", "werewolf", "seer", "guardian", "villager", "villager", "villager", "villager"); }
  else if (playerCount === 9) { roles.push("werewolf", "werewolf", "seer", "guardian", "sorcerer", "villager", "villager", "villager", "villager"); }
  else if (playerCount === 10) { roles.push("werewolf", "werewolf", "seer", "guardian", "sorcerer", "villager", "villager", "villager", "villager", "villager"); }
  else if (playerCount === 11) { roles.push("werewolf", "werewolf", "seer", "guardian", "guardian", "sorcerer", "villager", "villager", "villager", "villager", "villager"); }
  else if (playerCount >= 12) { roles.push("werewolf", "werewolf", "seer", "guardian", "guardian", "sorcerer"); while (roles.length < playerCount) roles.push("villager"); }
  for (let i = roles.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [roles[i], roles[j]] = [roles[j], roles[i]]; }
  return roles;
}

function getRoleDescription(role, prefix = ".") {
  const descriptions = {
    werewolf: `🐺 *مستذئب*\n\nأنت مفترس الليل!\n\n╭┈┈⬡「 📋 *معلومات* 」\n┃ 🎯 الهدف: اقتل كل القرويين\n┃ ⚔️ المهارة: اقتل لاعباً كل ليلة\n┃ 🕐 الوقت: الليل\n╰┈┈┈┈┈┈┈┈⬡\n\n> في الليل، اكتب:\n> \`${prefix}قتل <رقم>\` في خاص البوت`,
    seer: `🔮 *عراف*\n\nيمكنك رؤية هوية اللاعبين!\n\n╭┈┈⬡「 📋 *معلومات* 」\n┃ 🎯 الهدف: ساعد القرويين\n┃ 🔮 المهارة: اكتشف دور لاعب\n┃ 🕐 الوقت: الليل\n╰┈┈┈┈┈┈┈┈⬡\n\n> في الليل، اكتب:\n> \`${prefix}كشف <رقم>\` في خاص البوت`,
    guardian: `🛡️ *حارس*\n\nيمكنك حماية اللاعبين!\n\n╭┈┈⬡「 📋 *معلومات* 」\n┃ 🎯 الهدف: احمِ القرويين\n┃ 🛡️ المهارة: احمِ لاعباً\n┃ 🕐 الوقت: الليل\n╰┈┈┈┈┈┈┈┈⬡\n\n> في الليل، اكتب:\n> \`${prefix}حماية <رقم>\` في خاص البوت`,
    sorcerer: `🧙 *ساحر*\n\nأنت حليف المستذئب!\n\n╭┈┈⬡「 📋 *معلومات* 」\n┃ 🎯 الهدف: ساعد المستذئب\n┃ 🔍 المهارة: افحص إذا كان الهدف عرافاً\n┃ 🕐 الوقت: الليل\n╰┈┈┈┈┈┈┈┈⬡\n\n> في الليل، اكتب:\n> \`${prefix}فحص <رقم>\` في خاص البوت`,
    villager: `👨‍🌾 *قروي*\n\nأنت مواطن عادي!\n\n╭┈┈⬡「 📋 *معلومات* 」\n┃ 🎯 الهدف: اكتشف المستذئب\n┃ 🗳️ المهارة: صوت في النهار\n┃ 🕐 الوقت: النهار\n╰┈┈┈┈┈┈┈┈⬡\n\n> ناقش وصوت!\n> \`${prefix}مستذئب تصويت <رقم>\` في المجموعة`,
  };
  return descriptions[role] || "دور غير معروف";
}

async function handler(m, { sock }) {
  const db = getDatabase();
  const args = m.args || [];
  const action = args[0]?.toLowerCase();
  const target = args[1];
  const ww = global.werewolfGames;
  const prefix = m.prefix || config.command?.prefix || ".";

  const commands = {
    انشاء: async () => {
      if (ww[m.chat]) { const game = ww[m.chat]; if (game.status === "waiting") { return m.reply(`❌ *الغرفة موجودة*\n\nاكتب \`${prefix}مستذئب انضمام\` للانضمام\nالمضيف: @${game.owner.split("@")[0]}`, { mentions: [game.owner] }); } return m.reply(`❌ اللعبة جارية! انتظر حتى تنتهي.`); }
      const existingRoom = Object.entries(ww).find(([chatId, room]) => room.players.some((p) => p.id === m.sender));
      if (existingRoom) { return m.reply(`❌ أنت في لعبة بمجموعة أخرى!`); }
      ww[m.chat] = { room: m.chat, owner: m.sender, status: "waiting", day: 0, phase: "lobby", players: [{ id: m.sender, number: 1, role: null, alive: true, voted: false, skillUsed: false }], dead: [], votes: {}, nightActions: { kill: null, protect: null, see: null, sorcerer: null }, createdAt: Date.now(), timeout: null };
      await m.react("🐺");
      await m.reply(`🐺 *مستذئب*\n\nتم إنشاء الغرفة!\n\n╭┈┈⬡「 📋 *معلومات* 」\n┃ 👑 المضيف: @${m.sender.split("@")[0]}\n┃ 👥 اللاعبون: 1/${MAX_PLAYERS}\n┃ ⏱️ الحد الأدنى: ${MIN_PLAYERS} لاعبين\n╰┈┈┈┈┈┈┈┈⬡\n\n╭┈┈⬡「 🎮 *الأوامر* 」\n┃ ➕ \`${prefix}مستذئب انضمام\` - انضم\n┃ ▶️ \`${prefix}مستذئب بدء\` - ابدأ\n┃ 👥 \`${prefix}مستذئب لاعبين\` - القائمة\n┃ 🚪 \`${prefix}مستذئب خروج\` - اخرج\n╰┈┈┈┈┈┈┈┈⬡`, { mentions: [m.sender] });
    },

    انضمام: async () => {
      if (!ww[m.chat]) { return m.reply(`❌ لا توجد غرفة!\n> اكتب \`${prefix}مستذئب انشاء\``); }
      if (ww[m.chat].status !== "waiting") { return m.reply(`❌ اللعبة بدأت!`); }
      if (ww[m.chat].players.length >= MAX_PLAYERS) { return m.reply(`❌ الغرفة ممتلئة!`); }
      if (ww[m.chat].players.some((p) => p.id === m.sender)) { return m.reply(`❌ أنت منضم بالفعل!`); }
      ww[m.chat].players.push({ id: m.sender, number: ww[m.chat].players.length + 1, role: null, alive: true, voted: false, skillUsed: false });
      const playerList = ww[m.chat].players.map((p, i) => `${i + 1}. @${p.id.split("@")[0]}`).join("\n");
      const canStart = ww[m.chat].players.length >= MIN_PLAYERS;
      await m.react("✅");
      await m.reply(`✅ *انضم لاعب*\n\n@${m.sender.split("@")[0]} انضم!\n\n╭┈┈⬡「 👥 *اللاعبون* 」\n${playerList.split("\n").map((l) => `┃ ${l}`).join("\n")}\n╰┈┈┈┈┈┈┈┈⬡\n\nالمجموع: ${ww[m.chat].players.length}/${MIN_PLAYERS}\n${canStart ? `✅ يمكن البدء! \`${prefix}مستذئب بدء\`` : `🕕 يحتاج ${MIN_PLAYERS - ww[m.chat].players.length} لاعبين`}`, { mentions: ww[m.chat].players.map((p) => p.id) });
    },

    بدء: async () => {
      if (!ww[m.chat]) { return m.reply(`❌ لا توجد غرفة!`); }
      if (ww[m.chat].status !== "waiting") { return m.reply(`❌ اللعبة بدأت!`); }
      if (ww[m.chat].owner !== m.sender && !config.isOwner?.(m.sender)) { return m.reply(`❌ فقط المضيف يمكنه البدء!`); }
      if (ww[m.chat].players.length < MIN_PLAYERS) { return m.reply(`❌ ${MIN_PLAYERS} لاعبين على الأقل!`); }
      const roles = generateRoles(ww[m.chat].players.length);
      ww[m.chat].players.forEach((p, i) => { p.role = roles[i]; });
      ww[m.chat].status = "playing"; ww[m.chat].day = 1; ww[m.chat].phase = "night";
      for (const player of ww[m.chat].players) { try { await sendWW(sock, player.id, getRoleDescription(player.role, prefix), `${ROLES[player.role].emoji} ${ROLES[player.role].name}`, "دورك!"); } catch (e) { console.log(`[WW] فشل إرسال الدور إلى ${player.id}:`, e.message); } }
      const playerList = ww[m.chat].players.map((p, i) => `${i + 1}. @${p.id.split("@")[0]}`).join("\n");
      const roleCount = {}; ww[m.chat].players.forEach((p) => { roleCount[p.role] = (roleCount[p.role] || 0) + 1; });
      const roleInfo = Object.entries(roleCount).map(([role, count]) => `${ROLES[role].emoji} ${ROLES[role].name}: ${count}`).join("\n");
      await m.react("🌙");
      await m.reply(`🐺 *بدأت اللعبة!*\n\n🌙 *الليل الأول*\n\n╭┈┈⬡「 👥 *اللاعبون* 」\n${playerList.split("\n").map((l) => `┃ ${l}`).join("\n")}\n╰┈┈┈┈┈┈┈┈⬡\n\n╭┈┈⬡「 🎭 *الأدوار* 」\n${roleInfo.split("\n").map((l) => `┃ ${l}`).join("\n")}\n╰┈┈┈┈┈┈┈┈⬡\n\n📩 تفقد الخاص لدورك!\n🌙 المستذئب يصطاد...\n⏱️ وقت الليل: ${PHASE_DURATION.night / 1000} ثانية`, { mentions: ww[m.chat].players.map((p) => p.id) });
      await sendNightPrompts(m.chat, sock, prefix);
      ww[m.chat].timeout = setTimeout(() => { processNightActions(m.chat, sock, db, prefix); }, PHASE_DURATION.night);
    },

    تصويت: async () => {
      if (!ww[m.chat] || ww[m.chat].status !== "playing") { return m.reply(`❌ لا توجد لعبة!`); }
      if (ww[m.chat].phase !== "day") { return m.reply(`❌ ليس وقت التصويت!\n> المرحلة: ${ww[m.chat].phase === "night" ? "🌙 ليل" : ww[m.chat].phase}`); }
      const player = ww[m.chat].players.find((p) => p.id === m.sender);
      if (!player) { return m.reply(`❌ لست لاعباً!`); }
      if (!player.alive) { return m.reply(`❌ أنت ميت!`); }
      if (player.voted) { return m.reply(`❌ صوتت بالفعل!`); }
      if (!target) { const alivePlayers = ww[m.chat].players.filter((p) => p.alive); const list = alivePlayers.map((p) => `${p.number}. @${p.id.split("@")[0]}`).join("\n"); return m.reply(`🗳️ *تصويت*\n\nاختر من تريد إقصاءه:\n\n${list}\n\nاكتب: \`${prefix}مستذئب تصويت <رقم>\``, { mentions: alivePlayers.map((p) => p.id) }); }
      const targetNum = parseInt(target); if (isNaN(targetNum)) { return m.reply(`❌ أدخل رقماً!`); }
      const targetPlayer = ww[m.chat].players.find((p) => p.number === targetNum); if (!targetPlayer) { return m.reply(`❌ غير موجود!`); }
      if (!targetPlayer.alive) { return m.reply(`❌ ميت بالفعل!`); }
      player.voted = true; ww[m.chat].votes[targetPlayer.id] = (ww[m.chat].votes[targetPlayer.id] || 0) + 1;
      const alivePlayers = ww[m.chat].players.filter((p) => p.alive); const votedCount = alivePlayers.filter((p) => p.voted).length;
      await m.react("🗳️");
      await m.reply(`🗳️ *تم التصويت*\n\n@${m.sender.split("@")[0]} ➜ @${targetPlayer.id.split("@")[0]}\n\nالتقدم: ${votedCount}/${alivePlayers.length}`, { mentions: [m.sender, targetPlayer.id] });
      if (votedCount >= alivePlayers.length) { if (ww[m.chat].timeout) clearTimeout(ww[m.chat].timeout); await executeVote(m.chat, sock, db, prefix); }
    },

    لاعبين: async () => {
      if (!ww[m.chat]) { return m.reply(`❌ لا توجد لعبة!`); }
      const playerList = ww[m.chat].players.map((p, i) => { const status = p.alive ? "✅" : `☠️ (${ROLES[p.role]?.name || "?"})`; return `${p.number}. @${p.id.split("@")[0]} ${status}`; }).join("\n");
      const phaseEmoji = ww[m.chat].phase === "night" ? "🌙" : ww[m.chat].phase === "day" ? "☀️" : "🕕";
      await m.reply(`🐺 *مستذئب - الحالة*\n\n╭┈┈⬡「 📊 *معلومات* 」\n┃ 📅 اليوم: ${ww[m.chat].day}\n┃ ${phaseEmoji} المرحلة: ${ww[m.chat].phase}\n┃ 👤 أحياء: ${ww[m.chat].players.filter((p) => p.alive).length}\n┃ ☠️ أموات: ${ww[m.chat].dead.length}\n╰┈┈┈┈┈┈┈┈⬡\n\n╭┈┈⬡「 👥 *اللاعبون* 」\n${playerList.split("\n").map((l) => `┃ ${l}`).join("\n")}\n╰┈┈┈┈┈┈┈┈⬡`, { mentions: ww[m.chat].players.map((p) => p.id) });
    },

    خروج: async () => {
      if (!ww[m.chat]) { return m.reply(`❌ لا توجد لعبة!`); }
      const playerIdx = ww[m.chat].players.findIndex((p) => p.id === m.sender); if (playerIdx === -1) { return m.reply(`❌ لست في اللعبة!`); }
      if (ww[m.chat].status === "playing") { return m.reply(`❌ لا يمكنك الخروج أثناء اللعب!`); }
      ww[m.chat].players.splice(playerIdx, 1); ww[m.chat].players.forEach((p, i) => (p.number = i + 1));
      if (ww[m.chat].players.length === 0) { if (ww[m.chat].timeout) clearTimeout(ww[m.chat].timeout); delete ww[m.chat]; return m.reply(`🗑️ حذفت الغرفة.`); }
      if (ww[m.chat].owner === m.sender && ww[m.chat].players.length > 0) { ww[m.chat].owner = ww[m.chat].players[0].id; await m.reply(`👋 @${m.sender.split("@")[0]} خرج.\n👑 المضيف الجديد: @${ww[m.chat].owner.split("@")[0]}`, { mentions: [m.sender, ww[m.chat].owner] }); }
      else { await m.reply(`👋 @${m.sender.split("@")[0]} خرج.`, { mentions: [m.sender] }); }
    },

    حذف: async () => {
      if (!ww[m.chat]) { return m.reply(`❌ لا توجد لعبة!`); }
      if (ww[m.chat].owner !== m.sender && !config.isOwner?.(m.sender)) { return m.reply(`❌ فقط المضيف!`); }
      if (ww[m.chat].timeout) clearTimeout(ww[m.chat].timeout); delete ww[m.chat];
      await m.react("🗑️"); await m.reply(`🗑️ حذفت اللعبة!`);
    },
  };

  if (!action || !commands[action]) {
    return m.reply(`🐺 *مستذئب*\n\nلعبة اجتماعية للبحث عن المستذئب!\n\n╭┈┈⬡「 🎮 *الأوامر* 」\n┃ 🆕 \`${prefix}مستذئب انشاء\` - إنشاء\n┃ ➕ \`${prefix}مستذئب انضمام\` - انضم\n┃ ▶️ \`${prefix}مستذئب بدء\` - ابدأ\n┃ 🗳️ \`${prefix}مستذئب تصويت <رقم>\` - صوت\n┃ 👥 \`${prefix}مستذئب لاعبين\` - القائمة\n┃ 🚪 \`${prefix}مستذئب خروج\` - اخرج\n┃ 🗑️ \`${prefix}مستذئب حذف\` - حذف\n╰┈┈┈┈┈┈┈┈⬡\n\n╭┈┈⬡「 🎭 *الأدوار* 」\n┃ 🐺 مستذئب - يقتل\n┃ 🧙 ساحر - يبحث عن العراف\n┃ 🔮 عراف - يكشف\n┃ 🛡️ حارس - يحمي\n┃ 👨‍🌾 قروي - يصوت\n╰┈┈┈┈┈┈┈┈⬡\n\nالحد الأدنى: ${MIN_PLAYERS} لاعبين | الأقصى: ${MAX_PLAYERS}`);
  }

  try { await commands[action](); } catch (error) { console.error("[WEREWOLF ERROR]", error); m.reply(te(m.prefix, m.command, m.pushName)); }
}

async function sendNightPrompts(chatId, sock, prefix) {
  const ww = global.werewolfGames; if (!ww[chatId]) return;
  const game = ww[chatId]; const alivePlayers = game.players.filter((p) => p.alive);
  let playerListNormal = ""; let playerListWolf = "";
  alivePlayers.forEach((p) => { playerListNormal += `(${p.number}) @${p.id.split("@")[0]}\n`; const roleTag = p.role === "werewolf" || p.role === "sorcerer" ? ` [${ROLES[p.role].name}]` : ""; playerListWolf += `(${p.number}) @${p.id.split("@")[0]}${roleTag}\n`; });
  for (const player of alivePlayers) {
    try {
      let text = "";
      switch (player.role) {
        case "werewolf": text = `🐺 *الليل*\n\nوقت الصيد! اختر هدفاً:\n\n${playerListWolf}\n> اكتب \`${prefix}قتل <رقم>\``; break;
        case "seer": text = `🔮 *الليل*\n\nمن تريد كشف دوره؟\n\n${playerListNormal}\n> اكتب \`${prefix}كشف <رقم>\``; break;
        case "guardian": text = `🛡️ *الليل*\n\nمن تريد حمايته؟\n\n${playerListNormal}\n> اكتب \`${prefix}حماية <رقم>\``; break;
        case "sorcerer": text = `🧙 *الليل*\n\nاكتشف العراف!\n\n${playerListWolf}\n> اكتب \`${prefix}فحص <رقم>\``; break;
        case "villager": text = `👨‍🌾 *الليل*\n\nكن حذراً.\n\n${playerListNormal}`; break;
      }
      if (text) { await sendWW(sock, player.id, text, "🌙 ليل", "استخدم مهارتك!", thumbNight, alivePlayers.map((p) => p.id)); }
    } catch (e) { console.log(`[WW] فشل إرسال للاعب ${player.id}:`, e.message); }
  }
}

async function processNightActions(chatId, sock, db, prefix) {
  const ww = global.werewolfGames; if (!ww[chatId] || ww[chatId].phase !== "night") return;
  let killTarget = ww[chatId].nightActions.kill; const protectTarget = ww[chatId].nightActions.protect;
  let nightReport = `☀️ *صباح اليوم ${ww[chatId].day}*\n\n`;
  if (killTarget && killTarget !== protectTarget) { const victim = ww[chatId].players.find((p) => p.id === killTarget); if (victim && victim.alive) { victim.alive = false; ww[chatId].dead.push(victim); nightReport += `☠️ @${victim.id.split("@")[0]} وجد ميتاً!\n> الدور: ${ROLES[victim.role].emoji} ${ROLES[victim.role].name}\n\n`; } }
  else if (killTarget && killTarget === protectTarget) { nightReport += `🛡️ الحارس حمى الهدف!\n> لا ضحايا الليلة.\n\n`; }
  else { nightReport += `🌅 ليلة هادئة...\n> لا ضحايا.\n\n`; }
  const winner = checkWinner(chatId);
  if (winner) { await sendWW(sock, chatId, nightReport, "☀️ نهار", "طلع الصباح...", thumbDay, ww[chatId].players.map((p) => p.id)); await endGame(chatId, sock, db, winner); return; }
  ww[chatId].phase = "day"; ww[chatId].votes = {}; ww[chatId].nightActions = { kill: null, protect: null, see: null, sorcerer: null }; ww[chatId].players.forEach((p) => { p.voted = false; p.skillUsed = false; });
  const alivePlayers = ww[chatId].players.filter((p) => p.alive); const playerList = alivePlayers.map((p) => `${p.number}. @${p.id.split("@")[0]}`).join("\n");
  nightReport += `╭┈┈⬡「 👥 *أحياء* 」\n${playerList.split("\n").map((l) => `┃ ${l}`).join("\n")}\n╰┈┈┈┈┈┈┈┈⬡\n\n> 🗳️ وقت التصويت!\n> اكتب \`${prefix}مستذئب تصويت <رقم>\`\n> ⏱️ الوقت: ${PHASE_DURATION.day / 1000} ثانية`;
  await sendWW(sock, chatId, nightReport, "☀️ نهار", "وقت التصويت!", thumbDay, ww[chatId].players.map((p) => p.id));
  ww[chatId].timeout = setTimeout(() => { executeVote(chatId, sock, db, prefix); }, PHASE_DURATION.day);
}

async function executeVote(chatId, sock, db, prefix) {
  const ww = global.werewolfGames; if (!ww[chatId] || ww[chatId].phase !== "day") return;
  let maxVotes = 0; let eliminated = null; let isTie = false;
  for (const [playerId, votes] of Object.entries(ww[chatId].votes)) { if (votes > maxVotes) { maxVotes = votes; eliminated = playerId; isTie = false; } else if (votes === maxVotes && maxVotes > 0) { isTie = true; } }
  let resultText = `⚖️ *نتيجة التصويت*\n\n`;
  if (isTie || maxVotes === 0) { resultText += `🤷 لا أحد أقصي!\n> ${isTie ? "تعادل!" : "لا أصوات."}\n\n`; }
  else if (eliminated) { const player = ww[chatId].players.find((p) => p.id === eliminated); if (player) { player.alive = false; ww[chatId].dead.push(player); resultText += `⚰️ @${eliminated.split("@")[0]} أقصي!\n> الدور: ${ROLES[player.role].emoji} ${ROLES[player.role].name}\n> الأصوات: ${maxVotes}\n\n`; } }
  const winner = checkWinner(chatId);
  if (winner) { await sendWW(sock, chatId, resultText, "⚖️ تصويت", "نتيجة", thumbDay, eliminated ? [eliminated] : []); await endGame(chatId, sock, db, winner); return; }
  ww[chatId].phase = "night"; ww[chatId].day++; ww[chatId].nightActions = { kill: null, protect: null, see: null, sorcerer: null }; ww[chatId].players.forEach((p) => { p.voted = false; p.skillUsed = false; });
  resultText += `🌙 *ليل اليوم ${ww[chatId].day}*\n\n> المستذئب يصطاد...\n> الأدوار الخاصة، استخدموا مهاراتكم!\n> ⏱️ الوقت: ${PHASE_DURATION.night / 1000} ثانية`;
  await sendWW(sock, chatId, resultText, "🌙 ليل", "المستذئب يصطاد...", thumbNight, eliminated ? [eliminated] : []);
  await sendNightPrompts(chatId, sock, prefix);
  ww[chatId].timeout = setTimeout(() => { processNightActions(chatId, sock, db, prefix); }, PHASE_DURATION.night);
}

function checkWinner(chatId) {
  const ww = global.werewolfGames; if (!ww[chatId]) return null;
  const alivePlayers = ww[chatId].players.filter((p) => p.alive);
  const wolves = alivePlayers.filter((p) => ROLES[p.role]?.team === "wolf");
  const villagers = alivePlayers.filter((p) => ROLES[p.role]?.team === "village");
  if (wolves.length === 0) return "village";
  if (wolves.length >= villagers.length) return "wolf";
  return null;
}

async function endGame(chatId, sock, db, winner) {
  const ww = global.werewolfGames; if (!ww[chatId]) return;
  if (ww[chatId].timeout) clearTimeout(ww[chatId].timeout);
  const winningTeam = winner === "wolf" ? "wolf" : "village";
  const winningPlayers = ww[chatId].players.filter((p) => ROLES[p.role]?.team === winningTeam);
  for (const player of winningPlayers) { try { db.updateKoin(player.id, WIN_REWARD.koin); const user = db.getUser(player.id); if (user) { user.exp = (user.exp || 0) + WIN_REWARD.exp; db.setUser(player.id, user); } } catch (e) { console.log(`[WW] فشل إعطاء جائزة لـ ${player.id}:`, e.message); } }
  const allPlayers = ww[chatId].players.map((p) => { const status = p.alive ? "✅" : "☠️"; const isWinner = winningPlayers.some((w) => w.id === p.id) ? "🏆" : ""; return `${status} @${p.id.split("@")[0]} - ${ROLES[p.role].emoji} ${ROLES[p.role].name} ${isWinner}`; }).join("\n");
  const endText = `🎉 *انتهت اللعبة!*\n\n${winner === "wolf" ? "🐺 *المستذئب فاز!*" : "👨‍🌾 *القرويون فازوا!*"}\n\n╭┈┈⬡「 👥 *الكل* 」\n${allPlayers.split("\n").map((l) => `┃ ${l}`).join("\n")}\n╰┈┈┈┈┈┈┈┈⬡\n\n╭┈┈⬡「 🎁 *الجائزة* 」\n┃ 💰 +${WIN_REWARD.koin.toLocaleString()} عملات\n┃ ⭐ +${WIN_REWARD.exp.toLocaleString()} خبرة\n╰┈┈┈┈┈┈┈┈⬡\n\n> أحسنتم! العبوا مجدداً؟ \`${config.command?.prefix || "."}مستذئب انشاء\``;
  await sendWW(sock, chatId, endText, "🏆 النهاية", `${winner === "wolf" ? "المستذئب" : "القرويون"} فازوا!`, thumbWin, ww[chatId].players.map((p) => p.id));
  delete ww[chatId];
}

async function nightActionHandler(m, { sock }) {
  const db = getDatabase(); const ww = global.werewolfGames; const prefix = m.prefix || config.command?.prefix || ".";
  const chatId = Object.keys(ww).find((id) => ww[id].players.some((p) => p.id === m.sender && p.alive) && ww[id].phase === "night");
  if (!chatId) { return m.reply(`❌ لست في لعبة أو ليس الوقت ليلاً!`); }
  const game = ww[chatId]; const player = game.players.find((p) => p.id === m.sender);
  if (!player || !player.alive) { return m.reply(`❌ أنت ميت!`); }
  if (player.skillUsed) { return m.reply(`❌ استخدمت مهارتك!`); }
  const cmd = m.command?.toLowerCase(); const targetNum = parseInt(m.args?.[0]);
  if (isNaN(targetNum)) { return m.reply(`❌ أدخل رقماً!`); }
  const targetPlayer = game.players.find((p) => p.number === targetNum && p.alive);
  if (!targetPlayer) { return m.reply(`❌ غير صالح!`); }
  if (cmd === "قتل" && player.role === "werewolf") { if (targetPlayer.role === "werewolf" || targetPlayer.role === "sorcerer") { return m.reply(`❌ لا تقتل حليفك!`); } game.nightActions.kill = targetPlayer.id; player.skillUsed = true; await m.reply(`🐺 *تم الاختيار*\n\nالهدف: @${targetPlayer.id.split("@")[0]}\n> انتظر انتهاء الليل...`, { mentions: [targetPlayer.id] }); return true; }
  if (cmd === "حماية" && player.role === "guardian") { game.nightActions.protect = targetPlayer.id; player.skillUsed = true; await m.reply(`🛡️ *تمت الحماية*\n\nحماية: @${targetPlayer.id.split("@")[0]}\n> انتظر انتهاء الليل...`, { mentions: [targetPlayer.id] }); return true; }
  if (cmd === "كشف" && player.role === "seer") { const roleInfo = ROLES[targetPlayer.role]; player.skillUsed = true; await m.reply(`🔮 *نتيجة الكشف*\n\n@${targetPlayer.id.split("@")[0]} هو:\n${roleInfo.emoji} *${roleInfo.name}*\n\n> الفريق: ${roleInfo.team === "wolf" ? "🐺 مستذئب" : "👨‍🌾 قرية"}`, { mentions: [targetPlayer.id] }); return true; }
  if (cmd === "فحص" && player.role === "sorcerer") { const isSeer = targetPlayer.role === "seer"; player.skillUsed = true; await m.reply(`🧙 *نتيجة الفحص*\n\n@${targetPlayer.id.split("@")[0]}\n${isSeer ? "✅ *عراف!*" : "❌ *ليس عرافاً*"}\n\n> ساعد المستذئب!`, { mentions: [targetPlayer.id] }); return true; }
  return m.reply(`❌ ليس لديك هذه المهارة!\n> دورك: ${ROLES[player.role]?.name || "?"}`);
}

export { pluginConfig as config, handler, nightActionHandler, ROLES, sendWW };