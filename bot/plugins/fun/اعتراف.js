import { getDatabase } from "../../src/lib/maro-database.js";
import { saluranCtx } from "../../src/lib/maro-context.js";
const pluginConfig = {
  name: "اعتراف",
  alias: ["tembak"],
  category: "fun",
  description: "اعترف بحبك لشخص ما لطلب العلاقة",
  usage: ".اعتراف @إشارة",
  example: ".اعتراف @628xxx",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 30,
  energi: 1,
  isEnabled: true,
};

if (!global.tembakSessions) global.tembakSessions = {};

const SESSION_TIMEOUT = 3600000;
const romanticQuotes = [
  "أنا لست طياراً، لكني أستطيع جعل قلبك يحلق معي 💕",
  "أتعلم لماذا أحب المطر؟ لأن المطر مثلك، بارد على القلب 🌧️",
  "أنت سبب ابتسامتي بدون سبب 😊",
  "لو كنت نجمة، لأردت أن أكون السماء التي ترافقك دائماً ✨",
  "لست بحاجة لـ GPS، لأن قلبي يشير إليك 💘",
  "أتعلم الفرق بينك وبين القهوة؟ القهوة تبقيني مستيقظاً، وأنت تجعلني لا أنام من التفكير فيك ☕",
  "هل يمكنني استعارة قلبك؟ أعدك بالحفاظ عليه للأبد 💖",
  "لو كان الحب أغنية، فأنت أجمل ألحانها 🎵",
  "أحتاج 3 أشياء: الشمس، القمر، وأنت. الشمس للنهار، القمر لليل، وأنت للأبد 🌙",
  "أنت آخر قطعة بازل أحتاجها لإكمال حياتي 🧩",
];

async function handler(m, { sock }) {
  const db = getDatabase();
  const args = m.args || [];

  let targetJid = null;

  if (m.quoted) {
    targetJid = m.quoted.sender;
  } else if (m.mentionedJid?.[0]) {
    targetJid = m.mentionedJid[0];
  } else if (args[0]) {
    let num = args[0].replace(/[^0-9]/g, "");
    if (num.length > 5 && num.length < 20) {
      targetJid = num + "@s.whatsapp.net";
    }
  }

  if (!targetJid) {
    return m.reply(
      `⚠️ *طريقة الاستخدام*\n\n` +
        `> \`${m.prefix}اعتراف @إشارة\`\n\n` +
        `> مثال:\n` +
        `> \`${m.prefix}اعتراف @628xxx\`\n` +
        `> رد على رسالة + \`${m.prefix}اعتراف\``,
    );
  }

  if (targetJid === m.sender) {
    return m.reply(`لا يمكنك الاعتراف لنفسك!`);
  }

  if (targetJid === m.botNumber) {
    return m.reply(`البوت لا يمكنه المواعدة!`);
  }

  let senderData = db.getUser(m.sender) || {};
  let targetData = db.getUser(targetJid) || {};

  if (!senderData.fun) senderData.fun = {};
  if (!targetData.fun) targetData.fun = {};

  if (senderData.fun.pasangan) {
    const partnerData = db.getUser(senderData.fun.pasangan);
    if (partnerData?.fun?.pasangan === m.sender) {
      return m.reply(
        `❌ *لديك حبيب بالفعل*\n\n` +
          `حبيبك: @${senderData.fun.pasangan.split("@")[0]}\n` +
          `انفصل أولاً عن ${partnerData.name} بـ: \`${m.prefix}طلاق\``,
        { mentions: [senderData.fun.pasangan] },
      );
    }
  }

  if (targetData.fun.pasangan && targetData.fun.pasangan !== m.sender) {
    const targetPartner = db.getUser(targetData.fun.pasangan);
    if (targetPartner?.fun?.pasangan === targetJid) {
      return m.reply(
        `💔 *هو/هي مرتبط/مرتبطة بالفعل*\n\n` +
          `حبيبه/حبيبته: @${targetData.fun.pasangan.split("@")[0]}`,
        { mentions: [targetData.fun.pasangan] },
      );
    }
  }

  if (
    targetData.fun.tembakTarget === m.sender ||
    targetData.fun.pasangan === m.sender
  ) {
    senderData.fun.pasangan = targetJid;
    targetData.fun.pasangan = m.sender;

    db.setUser(m.sender, senderData);
    db.setUser(targetJid, targetData);

    delete global.tembakSessions[`${m.chat}_${targetJid}`];

    await m.react("💕");
    return m.reply(
      `💕 *كيييييوت :3*\n\n` +
        `@${m.sender.split("@")[0]} و @${targetJid.split("@")[0]} مرتبطان رسمياً !\n\n` +
        `نتمنى أن تدوم العلاقة! 💍`,
      { mentions: [m.sender, targetJid] },
    );
  }

  senderData.fun.tembakTarget = targetJid;
  if (!senderData.fun.tembakCount) senderData.fun.tembakCount = 0;
  senderData.fun.tembakCount++;
  db.setUser(m.sender, senderData);

  global.tembakSessions[`${m.chat}_${targetJid}`] = {
    shooter: m.sender,
    target: targetJid,
    chat: m.chat,
    timestamp: Date.now(),
  };

  await m.react("💘");

  const ctx = saluranCtx();
  ctx.mentionedJid = [targetJid, m.sender];
  const sentMsg = await m.reply(
    `💘 *هناك من اعترف بحبه!*\n\n` +
      `مرحباً @${targetJid.split("@")[0]} ، @${m.sender.split("@")[0]} معجب بك!\n\n` +
      `⏱️ صالح لمدة *ساعة واحدة* من الآن\n` +
      `استخدم: \`${m.prefix}قبول\` / \`${m.prefix}رفض\``,
    { contextInfo: ctx },
  );

  if (sentMsg?.key?.id) {
    global.tembakSessions[`${m.chat}_${targetJid}`].messageId = sentMsg.key.id;
  }
}

async function answerHandler(m, sock) {
  if (!m.body) return false;

  const text = m.body.trim().toLowerCase();
  if (text !== "قبول" && text !== "رفض") return false;
  if (!m.quoted) return false;

  const db = getDatabase();

  const allSessions = Object.entries(global.tembakSessions || {}).filter(
    ([key, val]) => val.target === m.sender && val.chat === m.chat,
  );

  if (allSessions.length === 0) return false;

  const validSession = allSessions.find(([key, val]) => {
    return Date.now() - val.timestamp < 3600000;
  });

  if (!validSession) return false;

  const [sessKey, sessData] = validSession;

  if (text === "قبول") {
    let shooterData = db.getUser(sessData.shooter) || {};
    let targetData = db.getUser(m.sender) || {};

    if (!shooterData.fun) shooterData.fun = {};
    if (!targetData.fun) targetData.fun = {};

    shooterData.fun.pasangan = m.sender;
    targetData.fun.pasangan = sessData.shooter;

    db.setUser(sessData.shooter, shooterData);
    db.setUser(m.sender, targetData);

    delete global.tembakSessions[sessKey];

    await m.react("💕");
    await m.reply(
      `💕 *واااو، تم القبول!* @${sessData.shooter.split("@")[0]}\n\n` +
        `@${m.sender.split("@")[0]} و @${sessData.shooter.split("@")[0]} مرتبطان رسمياً\n\n` +
        `نتمنى لكم السعادة الدائمة 💍`,
      { mentions: [m.sender, sessData.shooter] },
    );

    return true;
  }

  if (text === "رفض") {
    let shooterData = db.getUser(sessData.shooter) || {};
    let targetData = db.getUser(m.sender) || {};

    if (!shooterData.fun) shooterData.fun = {};
    if (!targetData.fun) targetData.fun = {};

    delete shooterData.fun.pasangan;
    delete shooterData.fun.tembakTarget;
    delete targetData.fun.pasangan;

    db.setUser(sessData.shooter, shooterData);
    db.setUser(m.sender, targetData);

    delete global.tembakSessions[sessKey];

    await m.react("💔");
    await m.reply(
      `💔 *واااه، اصبر!* @${sessData.shooter.split("@")[0]}\n\n` +
        `@${m.sender.split("@")[0]} رفض @${sessData.shooter.split("@")[0]} كحبيب\n\n` +
        `اصبر، ما زال هناك الكثير! 😢`,
      { mentions: [m.sender, sessData.shooter] },
    );
    return true;
  }

  return false;
}

export { pluginConfig as config, handler, answerHandler };