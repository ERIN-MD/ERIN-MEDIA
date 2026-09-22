import {
  getRandomItem,
  createSession,
  getSession,
  endSession,
  checkAnswerAdvanced,
  getHint,
  hasActiveSession,
  setSessionTimer,
  getRemainingTime,
  formatRemainingTime,
  isSurrender,
  isReplyToGame,
  getRandomReward,
  getProgressiveHint,
} from "./maro-game-data.js";
import { getDatabase } from "./maro-database.js";
import { addExpWithLevelCheck } from "./maro-level.js";
import {
  getGameContextInfo,
  sendGamePreview,
  checkFastAnswer,
} from "./maro-context.js";
import config from "../../config.js";
import fs from "fs";
import sharp from "sharp";
let fetchBuffer;
try {
  fetchBuffer = (await import("./maro-utils.js")).fetchBuffer;
} catch { }

const WIN_MESSAGES = [
  "🌟 *أحسنت! ذكاء خارق!*",
  "✨ *ممتاز! مفيش حد يغلبك!*",
  "🎉 *براڨو! إجابة مثالية!*",
  "💫 *رايق! بتجاوب وكأنك بتشرب مية!*",
  "🏆 *عاش يا بطل! إجابة صح!*",
  "🔥 *ملوكي! عقلك زي جوجل!*",
];

const TIMEOUT_MESSAGES = [
  "⏱️ *خلص الوقت! حاول تاني!*",
  "⏱️ *الوقت انتهى يا بطل!*",
  "⏱️ *متأخر شوية، الوقت خلص!*",
];

const SURRENDER_MESSAGES = [
  "🏳️ *استسلمت؟ معلش المرة الجاية!*",
  "🏳️ *استسلام مقبول!*",
  "🏳️ *يا خسارة استسلمت...*",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

class MaroGames {
  constructor() {
    this.registry = new Map();
  }

  register(gameType, cfg) {
    const defaults = {
      dataFile: `${gameType}.json`,
      questionField: "soal",
      answerField: "jawaban",
      emoji: "🎮",
      title: gameType.toUpperCase(),
      description: `لعبة ${gameType}`,
      timeout: 60000,
      cooldown: 5,
      hasImage: false,
      imageField: "img",
      alias: [],
      hintCount: 2,
    };
    this.registry.set(gameType, { ...defaults, ...cfg, gameType });
  }

  get(gameType) {
    return this.registry.get(gameType);
  }

  createHandler(gameType) {
    const cfg = this.registry.get(gameType);
    if (!cfg) throw new Error(`اللعبة "${gameType}" غير مسجلة`);

    const handler = async (m, { sock }) => {
      const chatId = m.chat;

      if (hasActiveSession(chatId)) {
        const session = getSession(chatId);
        if (session && session.gameType === gameType) {
          const remaining = getRemainingTime(chatId);
          const answer = session.question[cfg.answerField];
          let text = `⚠️ *فيه لعبة شغالة حالياً، جاوب الأول!*\n\n`;
          if (cfg.questionField && session.question[cfg.questionField]) {
            text += `\`\`\`${session.question[cfg.questionField]}\`\`\`\n\n`;
          }
          text += `💡 تلميح: *${getHint(answer, cfg.hintCount)}*\n`;
          text += `⏱️ المتبقي: *${formatRemainingTime(remaining)}*\n\n`;
          text += `_جاوب مباشرة أو اكتب "استسلام"\nكل إجابة غلط بتزود التلميح_`;
          text += `\n⚠️ *رد على هذه الرسالة بالإجابة*`;
          await sock.sendPreview(
            m.chat,
            {
              caption: `${config.info.website}\n\n${text}`,
              url: `${config.info.website}`,
              title: cfg.title,
              description: cfg.description,
              jpegThumbnail: await sharp(fs.readFileSync(config.assets["maro2"])).resize(300, 300).toBuffer(),
              previewType: 0,
            },
          );
          return;
        }
      }

      const question = getRandomItem(cfg.dataFile);
      if (!question) {
        await m.reply(
          "❌ *البيانات غير متوفرة*\n\n> بيانات اللعبة مش موجودة!",
        );
        return;
      }

      const answer = question[cfg.answerField];
      let sentMsg;

      if (cfg.hasImage && fetchBuffer) {
        let imageBuffer;
        try {
          imageBuffer = await fetchBuffer(question[cfg.imageField]);
        } catch {
          await m.reply("❌ *فشل تحميل الصورة*\n\n> حاول مرة تانية!");
          return;
        }

        let caption = `${cfg.emoji} *${cfg.title}*\n\n`;
        if (cfg.questionField && question[cfg.questionField]) {
          caption += `> ${question[cfg.questionField]}\n`;
        }
        caption += `💡 تلميح: *${getHint(answer, cfg.hintCount)}*\n`;
        caption += `⏱️ الوقت: *${cfg.timeout / 1000} ثانية*\n`;
        caption += `🎁 الجائزة: *طاقة، عملات، خبرة*\n\n`;
        caption += `_جاوب مباشرة أو اكتب "استسلام"\nكل إجابة غلط بتزود التلميح_`;
        caption += `\n⚠️ *رد على هذه الرسالة بالإجابة*`;

        sentMsg = await sock.sendMessage(
          chatId,
          {
            image: imageBuffer,
            caption,
            contextInfo: getGameContextInfo(),
          },
          { quoted: m },
        );
      } else {
        let text = `${cfg.emoji} *${cfg.title}*\n\n`;
        if (cfg.questionField && question[cfg.questionField]) {
          text += `\`\`\`${question[cfg.questionField]}\`\`\`\n\n`;
        }
        text += `💡 تلميح: *${getHint(answer, cfg.hintCount)}*\n`;
        text += `⏱️ الوقت: *${cfg.timeout / 1000} ثانية*\n`;
        text += `🎁 الجائزة: *طاقة، عملات، خبرة*\n\n`;
        text += `_جاوب مباشرة أو اكتب "استسلام"\nكل إجابة غلط بتزود التلميح_`;
        text += `\n⚠️ *رد على هذه الرسالة بالإجابة*`;

        sentMsg = await sendGamePreview(
          sock,
          chatId,
          text,
          `${cfg.emoji} ${cfg.title}`,
          "جاوب على السؤال!",
          { quoted: m },
        );
      }

      createSession(chatId, gameType, question, sentMsg.key, cfg.timeout);

      setSessionTimer(chatId, async () => {
        let text = `${pick(TIMEOUT_MESSAGES)}\n\n`;
        text += `الإجابة: *${answer}*\n\n`;
        text += `_مفيش حد عرف يجاوب المرة دي~_`;
        await m.reply(text);
      });
    };

    const answerHandler = async (m, sock) => {
      const chatId = m.chat;
      const session = getSession(chatId);

      if (!session || session.gameType !== gameType) return false;

      const userAnswer = (m.body || "").trim();
      if (!userAnswer || userAnswer.startsWith(".")) return false;

      if (isSurrender(userAnswer)) {
        endSession(chatId);
        const answer = session.question[cfg.answerField];
        let text = `${pick(SURRENDER_MESSAGES)}\n\n`;
        text += `الإجابة: *${answer}*\n\n`;
        text += `_@${m.sender.split("@")[0]} استسلم_`;
        await m.reply(text, { mentions: [m.sender] });
        return true;
      }

      if (!isReplyToGame(m, session)) return false;

      session.attempts++;

      const answer = session.question[cfg.answerField];
      const result = checkAnswerAdvanced(answer, userAnswer);

      if (result.status === "correct") {
        endSession(chatId);

        const db = getDatabase();
        const user = db.getUser(m.sender);

        let totalLimit = 0;
        let totalBalance = 0;
        let totalExp = 0;

        if (cfg.rewards === false || cfg.rewards === null) {
          // بدون مكافآت
        } else if (cfg.rewards) {
          totalLimit = cfg.rewards.limit || cfg.rewards.energi || 0;
          totalBalance = cfg.rewards.koin || cfg.rewards.balance || 0;
          totalExp = cfg.rewards.exp || 0;
        } else {
          const reward = getRandomReward();
          totalLimit = reward.limit;
          totalBalance = reward.koin;
          totalExp = reward.exp;
        }

        let bonusText = "";

        const fastResult = checkFastAnswer(session);
        if (
          fastResult.isFast &&
          cfg.rewards !== false &&
          cfg.rewards !== null
        ) {
          totalLimit += fastResult.bonus.limit;
          totalBalance += fastResult.bonus.koin;
          totalExp += fastResult.bonus.exp;
          bonusText = `\n\n${fastResult.praise}\n⚡ *مكافأة السرعة:* +${fastResult.bonus.limit} طاقة, +${fastResult.bonus.koin} عملة\n⏱️ الوقت: *${(fastResult.elapsed / 1000).toFixed(1)} ثانية*`;
        }

        if (totalLimit > 0) db.updateEnergi(m.sender, totalLimit);
        if (totalBalance > 0) db.updateKoin(m.sender, totalBalance);

        if (totalExp > 0) {
          if (!user.rpg) user.rpg = {};
          await addExpWithLevelCheck(sock, m, db, user, totalExp);
        }
        db.save();

        let text = `${pick(WIN_MESSAGES)}\n\n`;
        text += `الإجابة: *${answer}*\n`;
        text += `الفائز: *@${m.sender.split("@")[0]}*\n`;
        text += `المحاولات: *${session.attempts}*\n\n`;

        if (totalLimit > 0 || totalBalance > 0 || totalExp > 0) {
          let parts = [];
          if (totalLimit > 0) parts.push(`+${totalLimit} طاقة`);
          if (totalBalance > 0) parts.push(`+${totalBalance} عملة`);
          if (totalExp > 0) parts.push(`+${totalExp} خبرة`);
          text += `🎁 ${parts.join("، ")}`;
        }
        text += bonusText;

        await m.reply(text, { mentions: [m.sender] });
        return true;
      }

      if (result.status === "close") {
        const remaining = getRemainingTime(chatId);
        const percent = Math.round(result.similarity * 100);
        await m.react("🔥");
        await m.reply(
          `🔥 *قريب جداً!* إجابتك *${percent}%* شبه الصح!\n_المتبقي: *${formatRemainingTime(remaining)}*_`,
        );
        return false;
      }

      const remaining = getRemainingTime(chatId);
      if (remaining > 0 && session.attempts < 10) {
        await m.react("❌");
        const hint = getProgressiveHint(answer, session.attempts);
        await m.reply(
          `❌ لسه مش صح! تلميح: *${hint}*\n_المتبقي: *${formatRemainingTime(remaining)}*_`,
        );
      }

      return false;
    };

    return { handler, answerHandler };
  }

  createPlugin(gameType, overrides = {}) {
    const cfg = this.registry.get(gameType);
    if (!cfg) throw new Error(`اللعبة "${gameType}" غير مسجلة`);

    const { handler, answerHandler } = this.createHandler(gameType);

    return {
      config: {
        name: gameType,
        alias: cfg.alias,
        category: "game",
        description: cfg.description,
        usage: `.${gameType}`,
        example: `.${gameType}`,
        isOwner: false,
        isPremium: false,
        isGroup: false,
        isPrivate: false,
        cooldown: cfg.cooldown,
        energi: 0,
        isEnabled: true,
        ...overrides,
      },
      handler,
      answerHandler,
    };
  }
}

const games = new MaroGames();

export { MaroGames, games };