import { getDatabase } from '../../src/lib/maro-database.js'
import { parseMention, delay } from '../../src/lib/maro-utils.js'
const pluginConfig = {
  name: "اكس_او",
  alias: ["ttt"],
  category: "game",
  description: "العب إكس أو مع لاعب آخر",
  usage: ".اكس_او [اسم الغرفة] أو .ttt",
  example: ".اكس_او",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

const boardSymbols = {
  X: "❌",
  O: "⭕",
  1: "1️⃣",
  2: "2️⃣",
  3: "3️⃣",
  4: "4️⃣",
  5: "5️⃣",
  6: "6️⃣",
  7: "7️⃣",
  8: "8️⃣",
  9: "9️⃣",
};

class TicTacToe {
  constructor(playerX = "x", playerO = "o") {
    this.playerX = playerX;
    this.playerO = playerO;
    this._currentTurn = false;
    this._x = 0;
    this._o = 0;
    this.turns = 0;
  }

  get board() { return this._x | this._o; }
  get currentTurn() { return this._currentTurn ? this.playerO : this.playerX; }
  get enemyTurn() { return this._currentTurn ? this.playerX : this.playerO; }

  static check(state) { for (let combo of [7, 56, 73, 84, 146, 273, 292, 448]) if ((state & combo) === combo) return true; return false; }
  static toBinary(x = 0, y = 0) { if (x < 0 || x > 2 || y < 0 || y > 2) throw new Error("invalid position"); return 1 << (x + 3 * y); }

  turn(player = 0, x = 0, y) {
    if (this.board === 511) return -3;
    let pos = 0;
    if (y == null) { if (x < 0 || x > 8) return -1; pos = 1 << x; }
    else { if (x < 0 || x > 2 || y < 0 || y > 2) return -1; pos = TicTacToe.toBinary(x, y); }
    if (this._currentTurn ^ player) return -2;
    if (this.board & pos) return 0;
    this[this._currentTurn ? "_o" : "_x"] |= pos;
    this._currentTurn = !this._currentTurn;
    this.turns++;
    return 1;
  }

  static render(boardX = 0, boardO = 0) {
    let x = parseInt(boardX.toString(2), 4);
    let y = parseInt(boardO.toString(2), 4) * 2;
    return [...(x + y).toString(4).padStart(9, "0")].reverse().map((value, index) => (value == 1 ? "X" : value == 2 ? "O" : ++index));
  }

  render() { return TicTacToe.render(this._x, this._o); }
  get winner() { let x = TicTacToe.check(this._x); let o = TicTacToe.check(this._o); return x ? this.playerX : o ? this.playerO : false; }
}

if (!global.tictactoeGames) global.tictactoeGames = {};

function isRateLimitError(error) { const message = String(error?.message || "").toLowerCase(); return message.includes("rate-overlimit") || message.includes("rate overlimit") || message.includes("ratelimit") || message.includes("rate limit"); }
function normalizeMentions(text, extraMentions = []) { const parsed = parseMention(text).map((number) => `${number}@s.whatsapp.net`); const all = [...parsed, ...(extraMentions || [])].filter(Boolean); return [...new Set(all)]; }

async function sendWithRetry(action) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try { return await action(); } catch (error) { lastError = error; if (!isRateLimitError(error) || attempt === 2) throw error; await delay(1200 * Math.pow(2, attempt)); }
  }
  throw lastError;
}

async function safeReply(m, text, options = {}) {
  const mentions = normalizeMentions(text, options.mentions || []);
  const replyOptions = { ...options, mentions };
  try { return await sendWithRetry(() => m.reply(text, replyOptions)); } catch (error) { if (isRateLimitError(error)) return null; throw error; }
}

async function safeReact(m, emoji) { try { await sendWithRetry(() => m.react(emoji)); } catch (error) {} }

async function handler(m, { sock }) {
  const db = getDatabase();
  const args = m.args || [];
  const roomName = args.join(" ").trim();

  const existingRoom = Object.values(global.tictactoeGames).find(
    (room) => room.id.startsWith("ttt_") && [room.game.playerX, room.game.playerO].filter(Boolean).includes(m.sender),
  );

  if (existingRoom) {
    return safeReply(m, `❌ أنت ما زلت في لعبة!\n\n> أنهِ لعبتك أو اكتب *استسلام* للاستسلام.`);
  }

  let room = Object.values(global.tictactoeGames).find(
    (r) => r.state === "WAITING" && r.chat === m.chat && (roomName ? r.name === roomName : true),
  );

  if (room) {
    room.game.playerO = m.sender;
    room.state = "PLAYING";
    const board = renderBoard(room.game.render());

    const txt = `🎮 *إكس أو*\n\n` +
      `تم العثور على شريك!\n\n` +
      `❌ @${room.game.playerX.split("@")[0]}\n` +
      `⭕ @${room.game.playerO.split("@")[0]}\n\n` +
      `${board}\n\n` +
      `> الدور: @${room.game.currentTurn.split("@")[0]}\n` +
      `> رد على هذه الرسالة برقم 1-9\n` +
      `> اكتب *استسلام* للاستسلام`;

    await safeReact(m, "🎮");
    await safeReply(m, txt, { mentions: [room.game.playerX, room.game.playerO] });
  } else {
    const roomId = "ttt_" + Date.now();
    global.tictactoeGames[roomId] = {
      id: roomId,
      chat: m.chat,
      name: roomName || null,
      game: new TicTacToe(m.sender, null),
      state: "WAITING",
      createdAt: Date.now(),
    };

    await safeReact(m, "🕕");
    await safeReply(m, `🎮 *إكس أو*\n\n` +
      `تم إنشاء الغرفة! في انتظار شريك...\n\n` +
      `> اكتب \`.اكس_او${roomName ? " " + roomName : ""}\` للانضمام\n` +
      `> ستنتهي الغرفة بعد 5 دقائق`);

    setTimeout(() => { if (global.tictactoeGames[roomId]?.state === "WAITING") { delete global.tictactoeGames[roomId]; } }, 300000);
  }
}

async function answerHandler(m, sock) {
  if (!m.body) return false;
  const text = m.body.trim().toLowerCase();

  const room = Object.values(global.tictactoeGames).find(
    (r) => r.state === "PLAYING" && r.chat === m.chat && [r.game.playerX, r.game.playerO].filter(Boolean).includes(m.sender),
  );

  if (!room) return false;
  const db = getDatabase();

  if (text === "استسلام" || text === "surrender" || text === "give up") {
    const winner = m.sender === room.game.playerX ? room.game.playerO : room.game.playerX;
    const loser = m.sender;
    const winnerData = db.getUser(winner) || {};
    winnerData.koin = (winnerData.koin || 0) + 500;
    db.setUser(winner, winnerData);

    await safeReact(m, "🏳️");
    await safeReply(m, `🏳️ *استسلام!*\n\n@${loser.split("@")[0]} استسلم!\n@${winner.split("@")[0]} فاز! +Rp 500`, { mentions: [winner, loser] });
    delete global.tictactoeGames[room.id];
    return true;
  }

  const move = parseInt(text);
  if (isNaN(move) || move < 1 || move > 9) return false;

  if (room.game.currentTurn !== m.sender) {
    await safeReply(m, "❌ ليس دورك!");
    return true;
  }

  const player = room.game.playerX === m.sender ? 0 : 1;
  const result = room.game.turn(player, move - 1);

  if (result === 0) { await safeReply(m, "❌ المكان محجوز!"); return true; }
  if (result === -1) { await safeReply(m, "❌ مكان غير صالح!"); return true; }

  const board = renderBoard(room.game.render());
  const winner = room.game.winner;
  const isTie = room.game.board === 511 && !winner;

  if (winner) {
    const loser = winner === room.game.playerX ? room.game.playerO : room.game.playerX;
    const winnerData = db.getUser(winner) || {};
    winnerData.koin = (winnerData.koin || 0) + 1000;
    db.setUser(winner, winnerData);

    await safeReact(m, "🎉");
    await safeReply(m, `🎉 *انتهت اللعبة!*\n\n${board}\n\n🏆 @${winner.split("@")[0]} فاز! +Rp 1.000`, { mentions: [winner, loser] });
    delete global.tictactoeGames[room.id];
    return true;
  }

  if (isTie) {
    await safeReact(m, "🤝");
    await safeReply(m, `🤝 *تعادل!*\n\n${board}\n\n> لا يوجد فائز!`, { mentions: [room.game.playerX, room.game.playerO] });
    delete global.tictactoeGames[room.id];
    return true;
  }

  await safeReply(m, `🎮 *إكس أو*\n\n${board}\n\n> الدور: @${room.game.currentTurn.split("@")[0]}`, { mentions: [room.game.currentTurn] });
  return true;
}

function renderBoard(arr) {
  const cells = arr.map((cell) => boardSymbols[String(cell)] || cell);
  return `┌───┬───┬───┐\n│ ${cells[0]} │ ${cells[1]} │ ${cells[2]} │\n├───┼───┼───┤\n│ ${cells[3]} │ ${cells[4]} │ ${cells[5]} │\n├───┼───┼───┤\n│ ${cells[6]} │ ${cells[7]} │ ${cells[8]} │\n└───┴───┴───┘`;
}

export { pluginConfig as config, handler, answerHandler }