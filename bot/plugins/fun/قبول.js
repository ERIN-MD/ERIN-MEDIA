import { getDatabase } from "../../src/lib/maro-database.js";
import * as timeHelper from "../../src/lib/maro-time.js";
import { saluranCtx } from "../../src/lib/maro-context.js";
const pluginConfig = {
  name: "قبول",
  alias: ["terima"],
  category: "fun",
  description: "قبول الاعتراف من شخص ما",
  usage: ".قبول @إشارة",
  example: ".قبول @628xxx",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

const celebrationQuotes = [
  "نتمنى أن تدوم حتى الزواج! 💍",
  "من أصدقاء إلى حب، ما أجمله! 💕",
  "الحب في الأجواء! 💖",
  "تم اكتشاف ثنائي مثالي! 💑",
  "لا تنسوا دعوتنا للزواج! 💒",
  "مبروك الحياة الزوجية! 🥰",
  "الكيمياء بينكما قوية جداً! 🔥",
  "تطابق صُنع في الجنة! ✨",
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
        `> رد على رسالة الاعتراف + \`${m.prefix}قبول\`\n` +
        `> أو \`${m.prefix}قبول @إشارة\``,
    );
  }

  if (shooterJid === m.sender) {
    return m.reply(`❌ *فشل*\n\n> لا يمكنك قبول نفسك!`);
  }

  if (shooterJid === m.botNumber) {
    return m.reply(`❌ *فشل*\n\n> البوت لا يمكنه المواعدة!`);
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

  shooterData.fun.pasangan = m.sender;
  shooterData.fun.jadiPacar = Date.now();
  delete shooterData.fun.tembakTarget;
  myData.fun.pasangan = shooterJid;
  myData.fun.jadiPacar = Date.now();

  if (!shooterData.fun.terimaCount) shooterData.fun.terimaCount = 0;
  shooterData.fun.terimaCount++;

  db.setUser(shooterJid, shooterData);
  db.setUser(m.sender, myData);

  const sessionKey = `${m.chat}_${m.sender}`;
  if (global.tembakSessions?.[sessionKey]) {
    delete global.tembakSessions[sessionKey];
  }

  const quote =
    celebrationQuotes[Math.floor(Math.random() * celebrationQuotes.length)];
  const dateStr = timeHelper.formatFull("dddd, DD MMMM YYYY");

  await m.react("💕");
  const ctx = saluranCtx();
  ctx.mentionedJid = [m.sender, shooterJid];

  await m.reply(
    `💕 *واااو، تم القبول!* @${shooterJid.split("@")[0]}\n\n` +
      `@${m.sender.split("@")[0]} و @${shooterJid.split("@")[0]} مرتبطان رسمياً\n\n` +
      `نتمنى لكم السعادة الدائمة 💍`,
    { contextInfo: ctx },
  );
}

export { pluginConfig as config, handler };