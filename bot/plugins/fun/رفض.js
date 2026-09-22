import { getDatabase } from "../../src/lib/maro-database.js";
import { saluranCtx } from "../../src/lib/maro-context.js";
const pluginConfig = {
  name: "رفض",
  alias: ["tolak"],
  category: "fun",
  description: "رفض الاعتراف من شخص ما",
  usage: ".رفض @إشارة",
  example: ".رفض @628xxx",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

const rejectionQuotes = [
  "اصبر، الأفضل قادم! 🌟",
  "لم يحن النصيب بعد، لا يعني عدم وجوده 💪",
  "تجاوز الأمر! هناك الكثير في البحر! 🐟",
  "اصبر، الحب الحقيقي سيأتي 💕",
  "لا تفقد حماسك، استمر! 🔥",
  "الرفض بداية النجاح 💪",
  "ما زالت هناك فرص كثيرة! ✨",
  "ثق أن هناك من هو أنسب لك! 🌈",
];

async function handler(m, { sock }) {
  const db = getDatabase();

  let shooterJid = null;

  if (m.quoted) {
    shooterJid = m.quoted.sender;
  } else if (m.mentionedJid?.[0]) {
    shooterJid = m.mentionedJid[0];
  }

  if (!shooterJid) {
    const sessions = global.tembakSessions || {};
    const mySession = Object.entries(sessions).find(
      ([key, val]) => val.target === m.sender && val.chat === m.chat,
    );

    if (mySession) {
      shooterJid = mySession[1].shooter;
    }
  }

  if (!shooterJid) {
    return m.reply(
      `⚠️ *طريقة الاستخدام*\n\n` +
        `> رد على رسالة الاعتراف + \`${m.prefix}رفض\`\n` +
        `> أو \`${m.prefix}رفض @إشارة\``,
    );
  }

  if (shooterJid === m.sender) {
    return m.reply(`❌ *فشل*\n\n> لا يمكنك رفض نفسك!`);
  }

  if (shooterJid === m.botNumber) {
    return m.reply(`❌ *فشل*\n\n> البوت ليس لديه قلب ليُرفض!`);
  }

  let shooterData = db.getUser(shooterJid) || {};
  let myData = db.getUser(m.sender) || {};

  if (!shooterData.fun) shooterData.fun = {};
  if (!myData.fun) myData.fun = {};

  if (
    shooterData.fun.pasangan !== m.sender &&
    shooterData.fun.tembakTarget !== m.sender
  ) {
    return m.reply(
      `❌ *لم يعترف بحبه*\n\n` +
        `> @${shooterJid.split("@")[0]} لم يعترف بحبه لك`,
      { mentions: [shooterJid] },
    );
  }

  delete shooterData.fun.pasangan;
  delete shooterData.fun.tembakTarget;
  delete myData.fun.pasangan;

  if (!shooterData.fun.ditolakCount) shooterData.fun.ditolakCount = 0;
  shooterData.fun.ditolakCount++;

  db.setUser(shooterJid, shooterData);
  db.setUser(m.sender, myData);

  const sessionKey = `${m.chat}_${m.sender}`;
  if (global.tembakSessions?.[sessionKey]) {
    delete global.tembakSessions[sessionKey];
  }

  const quote =
    rejectionQuotes[Math.floor(Math.random() * rejectionQuotes.length)];

  await m.react("💔");
  const ctx = saluranCtx();
  ctx.mentionedJid = [m.sender, shooterJid];

  await m.reply(
    `💔 *واااه، اصبر!* @${shooterJid.split("@")[0]}\n\n` +
      `@${m.sender.split("@")[0]} رفض @${shooterJid.split("@")[0]} كحبيب\n\n` +
      `اصبر، ما زال هناك الكثير! 😢`,
    { contextInfo: ctx },
  );
}

export { pluginConfig as config, handler };