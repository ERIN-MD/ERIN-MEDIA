import fs from "fs";
import path from "path";
import { getDatabase } from "../../src/lib/maro-database.js";
import { getAssetBuffer } from "../../src/lib/maro-asset-manager.js";
import {
  getCachedJid,
  isLid,
  isLidConverted,
  lidToJid,
} from "../../src/lib/maro-lid.js";
import config from "../../config.js";

const pluginConfig = {
  name: "daftar",
  alias: ["register"],
  category: "user",
  description: "التسجيل كمستخدم للبوت عبر جلسة ردود تفاعلية",
  usage: ".daftar",
  example: ".daftar",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 0,
  isEnabled: true,
  skipRegistration: true,
};

if (!global.registrationSessions) global.registrationSessions = {};

const SESSION_TIMEOUT = 300000;
const DEFAULT_REWARDS = { koin: 30000, energi: 300, exp: 300000 };
const REGISTRATION_IMAGE_CANDIDATES = [
  "maro-daftar",
  "maro",
];

function getRegistrationContextInfo() {
  const saluranId = config.saluran?.id || "120363400911374213@newsletter";
  const saluranName = config.saluran?.name || config.bot?.name || "Maro-AI";

  return {
    forwardingScore: 9999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: saluranId,
      newsletterName: saluranName,
      serverMessageId: 127,
    },
  };
}

function getRegistrationRequired(db) {
  return (
    db.setting("registrationRequired") ?? config.registration?.enabled ?? false
  );
}

function getRegistrationRewards() {
  return config.registration?.rewards || DEFAULT_REWARDS;
}

async function getRegistrationImage() {
  const { getCachedThumb } = await import("../../src/lib/maro-serialize.js");
  for (const key of REGISTRATION_IMAGE_CANDIDATES) {
    const buf = getAssetBuffer(key);
    if (buf) return buf;
  }

  return null;
}

function normalizeRegistrationName(input) {
  return String(input || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSessionText(input) {
  return String(input || "")
    .trim()
    .toLowerCase();
}

function shouldBypassRegistrationAnswer(m) {
  if (!m?.isCommand) return false;
  const command = String(m.command || "").toLowerCase();
  return ["daftar", "register", "reg", "bataldaftar"].includes(command);
}

function getRegistrationSessionKey(jid) {
  let normalized = String(jid || "").trim();
  if (!normalized) return "";
  if (isLid(normalized) || isLidConverted(normalized)) {
    normalized = getCachedJid(normalized) || lidToJid(normalized) || normalized;
  }
  const digits = normalized.replace(/[^0-9]/g, "");
  return digits || normalized.toLowerCase();
}

function getRegistrationSessionEntry(jid) {
  const sessionKey = getRegistrationSessionKey(jid);
  if (sessionKey && global.registrationSessions?.[sessionKey]) {
    return {
      key: sessionKey,
      session: global.registrationSessions[sessionKey],
    };
  }
  const legacyKey = String(jid || "").trim();
  if (legacyKey && global.registrationSessions?.[legacyKey]) {
    return { key: legacyKey, session: global.registrationSessions[legacyKey] };
  }
  return { key: sessionKey, session: null };
}

function clearRegistrationSession(jid) {
  const { key, session } = getRegistrationSessionEntry(jid);
  if (!session) return false;
  if (session.timeout) clearTimeout(session.timeout);
  delete global.registrationSessions[key];
  return true;
}

function createRegistrationSession(jid, chatJid) {
  const sessionKey = getRegistrationSessionKey(jid);
  clearRegistrationSession(sessionKey);

  const session = {
    step: "name",
    name: null,
    age: null,
    gender: null,
    chatJid,
    promptId: null,
    startedAt: Date.now(),
    timeout: setTimeout(() => {
      if (global.registrationSessions[sessionKey]) {
        delete global.registrationSessions[sessionKey];
      }
    }, SESSION_TIMEOUT),
  };

  global.registrationSessions[sessionKey] = session;
  return session;
}

function getQuotedMessageId(m) {
  return m.quoted?.id || m.quoted?.stanzaId || m.quoted?.key?.id || null;
}

function isReplyToSessionPrompt(m, session) {
  const quotedId = getQuotedMessageId(m);
  if (!session || m.chat !== session.chatJid || !m.quoted) return false;
  if (quotedId && session.promptId && quotedId === session.promptId)
    return true;
  if (m.quoted?.key?.fromMe) return true;
  return false;
}

async function sendRegistrationPrompt(sock, m, text, options = {}) {
  const image = options.useImage ? await getRegistrationImage() : null;
  if (image) {
    return await sock.sendMessage(
      m.chat,
      {
        image,
        caption: text,
        contextInfo: getRegistrationContextInfo(),
      },
      { quoted: m },
    );
  } else {
    return await m.reply(text);
  }
}

function buildRewardPreview(user) {
  const rewards = getRegistrationRewards();

  if (user?.hasClaimedRegisterReward) {
    return `🎁 *حالة المكافأة*\n> سبق لك الحصول على مكافأة التسجيل الأولى\n> التسجيل مرة أخرى لا يعطي مكافأة`;
  }

  return `🎁 *مكافأة التسجيل الأولى*\n> 💰 +${rewards.koin.toLocaleString("id-ID")} عملة\n> ⚡ +${rewards.energi} طاقة\n> ⭐ +${rewards.exp.toLocaleString("id-ID")} خبرة`;
}

function buildConfirmationRewardBlock(user) {
  const rewards = getRegistrationRewards();

  if (user?.hasClaimedRegisterReward) {
    return `╭┈┈⬡「 🎁 *المكافأة* 」\n┃ سبق الحصول على مكافأة التسجيل الأولى\n┃ التسجيل مرة أخرى لا يعطي مكافأة\n╰┈┈┈┈┈┈┈┈⬡`;
  }

  return `╭┈┈⬡「 🎁 *المكافآت* 」\n┃ 💰 +${rewards.koin.toLocaleString("id-ID")} عملة\n┃ ⚡ +${rewards.energi} طاقة\n┃ ⭐ +${rewards.exp.toLocaleString("id-ID")} خبرة\n╰┈┈┈┈┈┈┈┈⬡`;
}

function buildSuccessRewardBlock(alreadyClaimedReward) {
  const rewards = getRegistrationRewards();

  if (alreadyClaimedReward) {
    return `╭┈┈⬡「 🎁 *المكافأة* 」\n┃ سبق الحصول على مكافأة التسجيل\n┃ لا توجد مكافأة إضافية هذه المرة\n╰┈┈┈┈┈┈┈┈⬡`;
  }

  return `╭┈┈⬡「 🎁 *المكافآت* 」\n┃ 💰 +${rewards.koin.toLocaleString("id-ID")} عملة\n┃ ⚡ +${rewards.energi} طاقة\n┃ ⭐ +${rewards.exp.toLocaleString("id-ID")} خبرة\n╰┈┈┈┈┈┈┈┈⬡`;
}

function buildUserDataBlock(name, age, gender) {
  return (
    `╭┈┈⬡「 📋 *البيانات* 」\n` +
    `┃ 📛 الاسم: *${name || "-"}*\n` +
    `┃ 🎂 العمر: *${age ? `${age} سنة` : "-"}*\n` +
    `┃ 👤 الجنس: *${gender || "-"}*\n` +
    `╰┈┈┈┈┈┈┈┈⬡`
  );
}

function buildWelcomeMessage(user, registrationRequired, prefix) {
  const benefits = [
    `🗂️ بيانات حسابك محفوظة بشكل أفضل`,
    `${buildRewardPreview(user)}`,
  ];

  if (registrationRequired) {
    benefits.splice(
      1,
      0,
      `🔓 بعد التسجيل يمكنك الوصول إلى جميع الأوامر`,
    );
  }

  return (
    `👋 *مرحباً بك في قائمة التسجيل*\n\n` +
    `✨ بالتسجيل، تصبح بيانات حسابك أكثر أماناً وتجربة استخدام البوت أكثر اكتمالاً.\n\n` +
    `🌟 *فوائد التسجيل*\n` +
    `${benefits.map((item) => `> ${item}`).join("\n")}\n\n` +
    `📝 *السؤال 1/4*\n` +
    `> ما هو اسمك؟\n\n` +
    `📌 *يجب الرد على هذه الرسالة*\n` +
    `> للإلغاء: رد \`batal\` أو اكتب \`${prefix}bataldaftar\``
  );
}

function buildConfirmationPrompt(session, user) {
  return (
    `✅ *السؤال 4/4*\n\n` +
    `هل البيانات التالية صحيحة؟\n\n` +
    `${buildUserDataBlock(session.name, session.age, session.gender)}\n\n` +
    `${buildConfirmationRewardBlock(user)}\n\n` +
    `🛠️ إذا كان هناك خطأ، يمكنك تعديل كل جزء.\n\n` +
    `*رد على هذه الرسالة بـ:*\n` +
    `> \`ya\` للحفظ\n` +
    `> \`revisi nama\` لتغيير الاسم\n` +
    `> \`revisi umur\` لتغيير العمر\n` +
    `> \`revisi gender\` لتغيير الجنس\n` +
    `> \`batal\` للإلغاء`
  );
}

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (user?.isRegistered) {
    return m.reply(
      `✅ أنت مسجل بالفعل!\n\n` +
      `${buildUserDataBlock(user.regName, user.regAge, user.regGender)}\n\n` +
      `> لإلغاء التسجيل: \`${m.prefix}unreg\``,
    );
  }

  if (getRegistrationSessionEntry(m.sender).session) {
    return m.reply(
      `📝 لا تزال هناك جلسة تسجيل نشطة!\n\n` +
      `> رد على آخر رسالة من البوت للمتابعة\n` +
      `> أو اكتب: \`${m.prefix}bataldaftar\``,
    );
  }

  const session = createRegistrationSession(m.sender, m.chat);
  const sent = await sendRegistrationPrompt(
    sock,
    m,
    buildWelcomeMessage(user, getRegistrationRequired(db), m.prefix),
    { useImage: true },
  );

  session.promptId = sent?.key?.id || null;

  await m.react("📝");
}

async function registrationAnswerHandler(m, sock) {
  if (!m.body) return false;
  if (shouldBypassRegistrationAnswer(m)) return false;

  const { session } = getRegistrationSessionEntry(m.sender);
  if (!session) return false;
  if (m.chat !== session.chatJid) return false;

  const text = m.body.trim();
  const lowText = normalizeSessionText(text);
  const db = getDatabase();

  if (["batal", "cancel", "batalkan"].includes(lowText)) {
    clearRegistrationSession(m.sender);
    await m.reply(
      `❌ تم إلغاء التسجيل.\n\n> ابدأ مرة أخرى بـ: \`${m.prefix}daftar\``,
    );
    return true;
  }

  if (session.step === "name") {
    const name = normalizeRegistrationName(text);

    if (name.length < 2 || name.length > 30) {
      await m.reply(`❌ الاسم يجب أن يكون 2-30 حرفاً!`);
      return true;
    }

    session.name = name;
    session.step = "age";

    const sent = await sendRegistrationPrompt(
      sock,
      m,
      `🎂 *السؤال 2/4*\n\n` +
      `مرحباً *${name}* 👋\n\n` +
      `> كم عمرك؟\n\n` +
      `📌 العمر فقط *1 - 100* سنة\n` +
      `📩 رد على هذه الرسالة برقم عمرك\n\n` +
      `> مثال: \`17\``,
    );

    session.promptId = sent?.key?.id || session.promptId;
    return true;
  }

  if (session.step === "age") {
    const age = Number(text);

    if (!/^\d+$/.test(text) || Number.isNaN(age) || age < 1 || age > 100) {
      await m.reply(
        `❌ العمر غير صالح!\n\n> أدخل رقم العمر من *1 - 100* سنة`,
      );
      return true;
    }

    session.age = age;
    session.step = "gender";

    const sent = await sendRegistrationPrompt(
      sock,
      m,
      `👤 *السؤال 3/4*\n\n` +
      `> هل أنت ذكر أم أنثى؟\n\n` +
      `┃ 👨 *ذكر* / *رجل*\n` +
      `┃ 👩 *أنثى* / *امرأة*\n\n` +
      `📩 رد على هذه الرسالة بإجابتك`,
    );

    session.promptId = sent?.key?.id || session.promptId;
    return true;
  }

  if (session.step === "gender") {
    let gender = null;

    if (/^(laki[-\s]?laki|cowok?|cowo|l|male|pria|ذكر|رجل)$/i.test(lowText)) {
      gender = "ذكر";
    } else if (/^(perempuan|cewek?|cewe|p|female|wanita|أنثى|امرأة)$/i.test(lowText)) {
      gender = "أنثى";
    }

    if (!gender) {
      await m.reply(
        `❌ الجنس غير صالح!\n\n` +
        `> رد بـ: *ذكر* أو *رجل*\n` +
        `> أو: *أنثى* أو *امرأة*`,
      );
      return true;
    }

    session.gender = gender;
    session.step = "confirm";

    const user = db.getUser(m.sender) || {};
    const sent = await sendRegistrationPrompt(
      sock,
      m,
      buildConfirmationPrompt(session, user),
    );

    session.promptId = sent?.key?.id || session.promptId;
    return true;
  }

  if (session.step === "revise_name") {
    const name = normalizeRegistrationName(text);

    if (name.length < 2 || name.length > 30) {
      await m.reply(`❌ الاسم يجب أن يكون 2-30 حرفاً!`);
      return true;
    }

    session.name = name;
    session.step = "confirm";

    const user = db.getUser(m.sender) || {};
    const sent = await sendRegistrationPrompt(
      sock,
      m,
      buildConfirmationPrompt(session, user),
    );

    session.promptId = sent?.key?.id || session.promptId;
    return true;
  }

  if (session.step === "revise_age") {
    const age = Number(text);

    if (!/^\d+$/.test(text) || Number.isNaN(age) || age < 1 || age > 100) {
      await m.reply(
        `❌ العمر غير صالح!\n\n> أدخل رقم العمر من *1 - 100* سنة`,
      );
      return true;
    }

    session.age = age;
    session.step = "confirm";

    const user = db.getUser(m.sender) || {};
    const sent = await sendRegistrationPrompt(
      sock,
      m,
      buildConfirmationPrompt(session, user),
    );

    session.promptId = sent?.key?.id || session.promptId;
    return true;
  }

  if (session.step === "revise_gender") {
    let gender = null;

    if (/^(laki[-\s]?laki|cowok?|cowo|l|male|pria|ذكر|رجل)$/i.test(lowText)) {
      gender = "ذكر";
    } else if (/^(perempuan|cewek?|cewe|p|female|wanita|أنثى|امرأة)$/i.test(lowText)) {
      gender = "أنثى";
    }

    if (!gender) {
      await m.reply(
        `❌ الجنس غير صالح!\n\n` +
        `> رد بـ: *ذكر* أو *رجل*\n` +
        `> أو: *أنثى* أو *امرأة*`,
      );
      return true;
    }

    session.gender = gender;
    session.step = "confirm";

    const user = db.getUser(m.sender) || {};
    const sent = await sendRegistrationPrompt(
      sock,
      m,
      buildConfirmationPrompt(session, user),
    );

    session.promptId = sent?.key?.id || session.promptId;
    return true;
  }

  if (session.step === "confirm") {
    if (["revisi nama", "ubah nama", "edit nama"].includes(lowText)) {
      session.step = "revise_name";

      const sent = await sendRegistrationPrompt(
        sock,
        m,
        `📛 *تعديل الاسم*\n\n` +
        `> أرسل الاسم الصحيح.\n\n` +
        `📩 رد على هذه الرسالة بالاسم الجديد`,
      );

      session.promptId = sent?.key?.id || session.promptId;
      return true;
    }

    if (
      ["revisi umur", "ubah umur", "edit umur", "revisi usia"].includes(lowText)
    ) {
      session.step = "revise_age";

      const sent = await sendRegistrationPrompt(
        sock,
        m,
        `🎂 *تعديل العمر*\n\n` +
        `> أرسل العمر الصحيح.\n\n` +
        `📌 العمر فقط *1 - 100* سنة\n` +
        `📩 رد على هذه الرسالة بالعمر الجديد`,
      );

      session.promptId = sent?.key?.id || session.promptId;
      return true;
    }

    if (
      ["revisi gender", "ubah gender", "edit gender", "revisi jk"].includes(lowText)
    ) {
      session.step = "revise_gender";

      const sent = await sendRegistrationPrompt(
        sock,
        m,
        `👤 *تعديل الجنس*\n\n` +
        `> اختر الجنس الصحيح.\n\n` +
        `┃ 👨 *ذكر* / *رجل*\n` +
        `┃ 👩 *أنثى* / *امرأة*\n\n` +
        `📩 رد على هذه الرسالة بإجابتك`,
      );

      session.promptId = sent?.key?.id || session.promptId;
      return true;
    }

    if (
      ["revisi", "ulang", "reset", "ulangi", "edit", "ubah"].includes(lowText)
    ) {
      await m.reply(
        `❌ التعديل غير محدد!\n\n` +
        `> رد: \`revisi nama\`، \`revisi umur\`، أو \`revisi gender\``,
      );
      return true;
    }

    if (!["ya", "y", "iya", "yes", "lanjut", "confirm"].includes(lowText)) {
      await m.reply(
        `❌ رد غير صالح!\n\n> رد: \`ya\`، \`revisi nama\`، \`revisi umur\`، \`revisi gender\`، أو \`batal\``,
      );
      return true;
    }

    const currentUser = db.getUser(m.sender) || {};
    const rewards = getRegistrationRewards();
    const alreadyClaimedReward = Boolean(currentUser.hasClaimedRegisterReward);
    const now = new Date().toISOString();
    const registrationCount = Number(currentUser.registrationCount || 0) + 1;
    const finalName = session.name;
    const finalAge = session.age;
    const finalGender = session.gender;

    db.setUser(m.sender, {
      isRegistered: true,
      regName: finalName,
      regAge: finalAge,
      regGender: finalGender,
      registeredAt: currentUser.registeredAt || now,
      lastRegisteredAt: now,
      registrationCount,
      hasClaimedRegisterReward: true,
      unregisteredAt: null,
    });

    if (!alreadyClaimedReward) {
      db.updateKoin(m.sender, rewards.koin);
      db.updateEnergi(m.sender, rewards.energi);
      db.updateExp(m.sender, rewards.exp);
    }

    await db.save();
    clearRegistrationSession(m.sender);

    await sock.sendMessage(
      m.chat,
      {
        text:
          `🎉 *تم التسجيل بنجاح!*\n\n` +
          `مرحباً بك، *${finalName}*!\n\n` +
          `${buildUserDataBlock(finalName, finalAge, finalGender)}\n\n` +
          `${buildSuccessRewardBlock(alreadyClaimedReward)}\n\n` +
          `🚀 الآن أنت جاهز لاستخدام البوت!`,
        contextInfo: getRegistrationContextInfo(),
      },
      { quoted: m },
    );

    await m.react("🎉");
    return true;
  }

  return false;
}

export {
  pluginConfig as config,
  handler,
  registrationAnswerHandler,
  clearRegistrationSession,
};