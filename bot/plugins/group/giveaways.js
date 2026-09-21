import config from "../../config.js";
import * as timeHelper from "../../src/lib/maro-time.js";
import { CronJob } from "cron";
import { getDatabase } from "../../src/lib/maro-database.js";
import { fetchGroupsSafe } from "../../src/lib/maro-jpm-helper.js";

function generateGiveawayId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "GA-";
  for (let i = 0; i < 6; i++)
    id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function parseTime(str) {
  if (!str) return null;
  const match = str.match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return null;
  const num = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return num * (multipliers[unit] || 0);
}

function formatDuration(ms) {
  if (ms < 60000) return `${Math.floor(ms / 1000)} ثانية`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)} دقيقة`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)} ساعة`;
  return `${Math.floor(ms / 86400000)} يوم`;
}

function getCtx() {
  const saluranId = config.saluran?.id || "";
  const saluranName = config.saluran?.name || config.bot?.name || "";
  const ctx = { forwardingScore: 1, isForwarded: true };
  if (saluranId && saluranId !== "-@newsletter") {
    ctx.forwardedNewsletterMessageInfo = {
      newsletterJid: saluranId,
      newsletterName: saluranName,
      serverMessageId: Math.floor(Math.random() * 1000) + 1,
    };
  }
  return ctx;
}

if (!global.giveawaySessions) global.giveawaySessions = new Map();
const createSessions = global.giveawaySessions;

function hasActiveSession(senderJid) {
  return createSessions.has(senderJid);
}

async function handleSession(m, sock) {
  const session = createSessions.get(m.sender);
  if (!session) return false;

  const text = (m.body || m.text || "").trim();
  if (!text) return false;

  if (session.step === "q1") {
    const parts = text.split("|").map((s) => s.trim());
    if (parts.length < 3) return true;

    const [title, durationStr, winnersStr] = parts;
    const duration = parseTime(durationStr);
    if (!duration) return true;

    const winners = parseInt(winnersStr);
    if (isNaN(winners) || winners < 1) return true;

    session.title = title;
    session.duration = duration;
    session.winners = winners;
    session.step = "q2";

    await m.reply(
      `✅ تم حفظ التفاصيل!\n┃ 🎁 ${title}\n┃ ⏱️ ${formatDuration(duration)}\n┃ 👥 ${winners} فائز\n\n_جاري جلب قائمة المجموعات..._`,
    );

    try {
      const rawGroups = await fetchGroupsSafe(sock);
      const groups = Array.isArray(rawGroups)
        ? rawGroups
        : Object.values(rawGroups);
      const currentGroup = session.chatId;
      const otherGroups = groups.filter((g) => g.id !== currentGroup);

      const buttons = [
        {
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: "📍 في هذه المجموعة",
            id: `.هدية تحديد ${currentGroup}`,
          }),
        },
      ];

      if (otherGroups.length > 0) {
        const sections = [
          {
            title: "اختر المجموعة",
            rows: otherGroups.slice(0, 10).map((g) => ({
              title: g.subject || g.id,
              id: `.هدية تحديد ${g.id}`,
            })),
          },
        ];
        buttons.push({
          name: "single_select",
          buttonParamsJson: JSON.stringify({
            title: "اختر مجموعة أخرى",
            sections,
          }),
        });
      }

      await sock.sendButton(
        m.chat,
        null,
        "🎁 *منشئ الهدايا*\n\nالسؤال 2/3:\nهل تريد تشغيل الهدية في هذه المجموعة أم مجموعة أخرى؟",
        m,
        { buttons, footer: "اختر المجموعة للهدية" },
      );
    } catch (e) {
      // `currentGroup` is declared inside the try block, so it is out of
      // scope here; the fallback means "use this chat".
      session.groupId = session.chatId;
      session.step = "q3";
      await m.reply("⚠️ فشل جلب قائمة المجموعات. سيتم استخدام هذه المجموعة.");
      await askPrizeDetails(m, sock, session);
    }
    return true;
  }

  if (session.step === "q3") {
    const parts = text.split("|").map((s) => s.trim());
    if (parts.length < 2) return true;

    const [prizeName, ...detailParts] = parts;
    session.prizeName = prizeName;
    session.prizeDetails = detailParts.join(" | ");

    await m.reply("✅ تم حفظ تفاصيل الجائزة! جاري إنشاء الهدية...");

    await createGiveaway(session, sock, m);
    createSessions.delete(m.sender);
    return true;
  }

  return false;
}

async function askPrizeDetails(m, sock, session) {
  try {
    const adminJid = session.adminJid;
    await sock.sendMessage(
      adminJid,
      {
        text:
          "🎁 *منشئ الهدايا*\n\n" +
          "السؤال 3/3:\nأدخل تفاصيل الجائزة بالصيغة:\n" +
          "اسم الجائزة | تفاصيل الجائزة\n\n" +
          "مثال: حساب بريميوم | البريد: xxx@gmail.com | كلمة المرور: xxx",
        contextInfo: getCtx(),
      },
      { quoted: m },
    );
  } catch (e) {
    await m.reply("⚠️ فشل إرسال الرسالة الخاصة. يرجى مراسلة البوت أولاً ثم المحاولة مرة أخرى.");
    createSessions.delete(session.adminJid);
  }
}

async function createGiveaway(session, sock, m) {
  const db = getDatabase();
  const giveaways = db.setting("giveaways") || {};
  const giveawayId = generateGiveawayId();

  const giveaway = {
    giveawayId,
    chatId: session.groupId,
    title: session.title,
    duration: session.duration,
    endTime: Date.now() + session.duration,
    winners: session.winners,
    prizeName: session.prizeName,
    prizeDetails: session.prizeDetails,
    participants: [],
    winnerList: [],
    ended: false,
    giveawayMsgId: null,
    createdBy: session.adminJid,
    createdAt: Date.now(),
  };

  giveaways[giveawayId] = giveaway;
  db.setting("giveaways", giveaways);

  const endTimeFormatted = timeHelper.fromTimestamp(
    giveaway.endTime,
    "DD/MM/YYYY HH:mm",
  );
  const remaining = formatDuration(giveaway.duration);

  const giveawayText =
    "🎉 *ﻫـﺪﻳـﺔ*\n\n" +
    `╭┈┈⬡「 📋 *معلومات* 」\n` +
    `┃ 🎁 العنوان: *${giveaway.title}*\n` +
    `┃ 🏆 الجائزة: *${giveaway.prizeName}*\n` +
    `┃ 👥 الفائزين: ${giveaway.winners}\n` +
    `┃ ⏰ ينتهي: ${endTimeFormatted}\n` +
    `┃ ⏱️ المدة: ${remaining}\n` +
    `┃ 🆔 المعرف: \`${giveawayId}\`\n` +
    `╰┈┈⬡\n\n` +
    `> اضغط زر *انضمام* للمشاركة في الهدية!`;

  const joinButton = [
    {
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({
        display_text: "🎉 انضمام",
        id: `.هدية انضمام ${giveawayId}`,
      }),
    },
  ];

  try {
    const sentMsg = await sock.sendButton(
      giveaway.chatId,
      null,
      giveawayText,
      null,
      {
        buttons: joinButton,
        footer: "اضغط انضمام للمشاركة",
        contextInfo: getCtx(),
      },
    );

    giveaway.giveawayMsgId = sentMsg?.key?.id || null;
    giveaways[giveawayId] = giveaway;
    db.setting("giveaways", giveaways);
  } catch (e) {
    giveaway.giveawayMsgId = null;
    giveaways[giveawayId] = giveaway;
    db.setting("giveaways", giveaways);
  }

  await sock.sendMessage(
    session.adminJid,
    {
      text: "✅ تم إنشاء الهدية بنجاح! تحقق من رسالة الهدية في المجموعة المختارة.",
      contextInfo: getCtx(),
    },
    { quoted: m },
  );
}

async function endGiveaway(giveawayId, sock, db) {
  const giveaways = db.setting("giveaways") || {};
  const giveaway = giveaways[giveawayId];
  if (!giveaway || giveaway.ended) return;

  giveaway.ended = true;

  if (giveaway.participants.length === 0) {
    giveaway.winnerList = [];
    db.setting("giveaways", giveaways);

    await sock.sendMessage(giveaway.chatId, {
      text:
        `😔 *انتهت الهدية*\n\n` +
        `هدية *${giveaway.title}* انتهت بدون مشاركين.\n\n` +
        `╭┈┈⬡「 📋 *معلومات* 」\n` +
        `┃ 🆔 المعرف: \`${giveawayId}\`\n` +
        `┃ 👥 المشاركين: 0\n` +
        `╰┈┈⬡`,
      contextInfo: getCtx(),
    });
    return;
  }

  const winnerCount = Math.min(giveaway.winners, giveaway.participants.length);
  const shuffled = [...giveaway.participants].sort(() => Math.random() - 0.5);
  giveaway.winnerList = shuffled.slice(0, winnerCount);
  db.setting("giveaways", giveaways);

  const winnerText = giveaway.winnerList
    .map((w, i) => `${i + 1}. @${w.split("@")[0]}`)
    .join("\n");

  const firstWinner = giveaway.winnerList[0];
  const fakeQuoted = {
    key: {
      id: `${Date.now()}@bot`,
      remoteJid: giveaway.chatId,
      participant: firstWinner,
      fromMe: false,
    },
    message: {
      conversation: "ياي لقد فزت",
    },
  };

  await sock.sendMessage(
    giveaway.chatId,
    {
      text:
        `🎊 *انتهت الهدية!*\n\n` +
        `╭┈┈⬡「 🏆 *الفائزين* 」\n` +
        `${winnerText}\n` +
        `╰┈┈⬡\n\n` +
        `╭┈┈⬡「 📋 *معلومات* 」\n` +
        `┃ 🎁 العنوان: *${giveaway.title}*\n` +
        `┃ 🏆 الجائزة: *${giveaway.prizeName}*\n` +
        `┃ 🆔 المعرف: \`${giveawayId}\`\n` +
        `┃ 👥 المشاركين: ${giveaway.participants.length}\n` +
        `╰┈┈⬡\n\n` +
        `> سيتم إرسال الجائزة إلى الخاص!`,
      contextInfo: { ...getCtx(), mentionedJid: giveaway.winnerList },
    },
    { quoted: fakeQuoted },
  );

  for (const winnerJid of giveaway.winnerList) {
    try {
      const winnerFakeQuoted = {
        key: {
          id: `${Date.now()}@bot`,
          remoteJid: giveaway.chatId,
          participant: winnerJid,
          fromMe: false,
        },
        message: {
          conversation: "ياي لقد فزت",
        },
      };
      const ctx = getCtx();
      ctx.mentionedJid = [winnerJid];
      await sock.sendMessage(
        winnerJid,
        {
          text:
            `🎉 *مبروك!*\n\n` +
            `> لقد فزت في الهدية!\n\n` +
            `╭┈┈⬡「 📋 *التفاصيل* 」\n` +
            `┃ 🎁 العنوان: \`${giveaway.title}\`\n` +
            `┃ 🏆 الجائزة: *${giveaway.prizeName}*\n` +
            `┃ 🆔 المعرف: \`${giveawayId}\`\n` +
            `╰┈┈⬡\n\n` +
            `╭┈┈⬡「 🎁 *تفاصيل الجائزة* 」\n` +
            `${giveaway.prizeDetails || "تواصل مع المشرف للتفاصيل"}\n` +
            `╰┈┈⬡\n\n` +
            `> _هذه معلومات رسمية من البوت._`,
          contextInfo: ctx,
        },
        { quoted: winnerFakeQuoted },
      );
    } catch (e) {}
  }
}

function startGiveawayChecker(sock, db) {
  new CronJob(
    "* * * * *",
    async () => {
      try {
        const { getDatabase } = await import("../../src/lib/maro-database.js");
        const currentDb = getDatabase();
        const { getSocket } = await import("../../src/connection.js");
        const currentSock = getSocket();
        if (!currentSock) return;

        const giveaways = currentDb.setting("giveaways") || {};
        const now = Date.now();
        for (const [id, ga] of Object.entries(giveaways)) {
          if (!ga.ended && ga.endTime && now >= ga.endTime) {
            await endGiveaway(id, currentSock, currentDb);
          }
        }
      } catch (e) {}
    },
    null,
    true,
    "Asia/Jakarta",
  );
}

const createCmds = ["انشاء_هدية", "هدية_جديدة", "giveawaycreate"];
const listCmds = ["قائمة_الهدايا", "الهدايا", "giveawaylist"];
const deleteCmds = ["حذف_هدية", "مسح_هدية", "giveawaydelete"];
const rerollCmds = ["اعادة_سحب", "سحب_جديد", "giveawayreroll"];

const plugin = {
  name: ["هدية", ...createCmds, ...listCmds, ...deleteCmds, ...rerollCmds],
  alias: "ga",
  category: "group",
  description: "نظام الهدايا مع أزرار تفاعلية",
  admin: false,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const cmd = m.command?.toLowerCase() || "";
  const prefix = m.prefix || ".";
  const args = m.args || [];

  if (createCmds.includes(cmd)) {
    if (!m.isAdmin && !m.isOwner)
      return m.reply("⚠️ فقط المشرفين يمكنهم إنشاء هدايا!");
    if (!m.isGroup) return m.reply("⚠️ استخدم هذا الأمر في المجموعة!");
    if (createSessions.has(m.sender))
      return m.reply("⚠️ لديك جلسة إنشاء نشطة بالفعل!");

    createSessions.set(m.sender, {
      step: "q1",
      chatId: m.chat,
      adminJid: m.sender,
      title: null,
      duration: null,
      winners: null,
      groupId: null,
      prizeName: null,
      prizeDetails: null,
    });

    await m.reply(
      "🎁 *منشئ الهدايا*\n\n" +
        "السؤال 1/3:\nأدخل تفاصيل الهدية بالصيغة:\n" +
        "العنوان | المدة | عدد الفائزين\n\n" +
        "مثال: حساب بريميوم | 5m | 1\n" +
        "المدة: 30s, 5m, 1h, 1d\n\n" +
        "> البوت سيتجاهل إذا كان التنسيق خاطئاً",
    );
    return;
  }

  if (cmd === "هدية" && args[0]?.toLowerCase() === "تحديد") {
    const session = createSessions.get(m.sender);
    if (!session || session.step !== "q2") return;

    const groupId = args[1];
    if (!groupId) return;

    session.groupId = groupId;
    session.step = "q3";

    await m.reply(
      "✅ تم اختيار المجموعة! تحقق من الرسائل الخاصة للسؤال التالي.",
    );
    await askPrizeDetails(m, sock, session);
    return;
  }

  if (cmd === "هدية" && args[0]?.toLowerCase() === "انضمام") {
    const giveawayId = args[1];
    if (!giveawayId) return;

    const giveaways = db.setting("giveaways") || {};
    const giveaway = giveaways[giveawayId];
    if (!giveaway) return m.reply("⚠️ الهدية غير موجودة!");
    if (giveaway.ended) return m.reply("⚠️ الهدية انتهت بالفعل!");
    if (giveaway.participants.includes(m.sender))
      return m.reply("⚠️ أنت مشارك بالفعل!");

    giveaway.participants.push(m.sender);
    db.setting("giveaways", giveaways);

    await m.react("✅");
    await m.reply(
      `✅ @${m.sender.split("@")[0]} تم انضمامك للهدية! (${giveaway.participants.length} مشارك)`,
    );
    return;
  }

  if (listCmds.includes(cmd)) {
    if (!m.isAdmin && !m.isOwner) return m.reply("⚠️ فقط المشرفين!");
    const giveaways = db.setting("giveaways") || {};
    const entries = Object.values(giveaways);
    if (entries.length === 0) return m.reply("📋 لا توجد هدايا.");

    const active = entries.filter((g) => !g.ended);
    const ended = entries.filter((g) => g.ended);

    let text = "📋 *قائمة الهدايا*\n\n";
    if (active.length > 0) {
      text += "🟢 *نشطة:*\n";
      for (const g of active) {
        const endFmt = timeHelper.fromTimestamp(g.endTime, "DD/MM/YYYY HH:mm");
        text += `┃ 🆔 \`${g.giveawayId}\` — ${g.title} (${g.participants.length} مشارك، ينتهي ${endFmt})\n`;
      }
      text += "\n";
    }
    if (ended.length > 0) {
      text += "🔴 *منتهية:*\n";
      for (const g of ended.slice(-5)) {
        text += `┃ 🆔 \`${g.giveawayId}\` — ${g.title} (${g.winnerList?.length || 0} فائز)\n`;
      }
    }

    await m.reply(text);
    return;
  }

  if (deleteCmds.includes(cmd)) {
    if (!m.isAdmin && !m.isOwner) return m.reply("⚠️ فقط المشرفين!");
    const giveawayId = args[0];
    if (!giveawayId) return m.reply(`⚠️ الصيغة: ${prefix}${cmd} GA-XXXXXX`);

    const giveaways = db.setting("giveaways") || {};
    if (!giveaways[giveawayId]) return m.reply("⚠️ الهدية غير موجودة!");

    delete giveaways[giveawayId];
    db.setting("giveaways", giveaways);
    await m.reply(`✅ تم حذف الهدية \`${giveawayId}\` بنجاح!`);
    return;
  }

  if (rerollCmds.includes(cmd)) {
    if (!m.isAdmin && !m.isOwner) return m.reply("⚠️ فقط المشرفين!");
    const giveawayId = args[0];
    if (!giveawayId) return m.reply(`⚠️ الصيغة: ${prefix}${cmd} GA-XXXXXX`);

    const giveaways = db.setting("giveaways") || {};
    const giveaway = giveaways[giveawayId];
    if (!giveaway) return m.reply("⚠️ الهدية غير موجودة!");
    if (!giveaway.ended) return m.reply("⚠️ الهدية لم تنته بعد!");
    if (giveaway.participants.length === 0)
      return m.reply("⚠️ لا يوجد مشاركين!");

    const winnerCount = Math.min(
      giveaway.winners,
      giveaway.participants.length,
    );
    const shuffled = [...giveaway.participants].sort(() => Math.random() - 0.5);
    giveaway.winnerList = shuffled.slice(0, winnerCount);
    db.setting("giveaways", giveaways);

    const winnerText = giveaway.winnerList
      .map((w, i) => `${i + 1}. @${w.split("@")[0]}`)
      .join("\n");

    await sock.sendMessage(giveaway.chatId, {
      text:
        `🔄 *إعادة سحب الهدية!*\n\n` +
        `╭┈┈⬡「 🏆 *الفائزين الجدد* 」\n` +
        `${winnerText}\n` +
        `╰┈┈⬡\n\n` +
        `╭┈┈⬡「 📋 *معلومات* 」\n` +
        `┃ 🎁 العنوان: *${giveaway.title}*\n` +
        `┃ 🏆 الجائزة: *${giveaway.prizeName}*\n` +
        `┃ 🆔 المعرف: \`${giveawayId}\`\n` +
        `╰┈┈⬡`,
      contextInfo: { ...getCtx(), mentionedJid: giveaway.winnerList },
    });

    for (const winnerJid of giveaway.winnerList) {
      try {
        const ctx = getCtx();
        ctx.mentionedJid = [winnerJid];
        await sock.sendMessage(winnerJid, {
          text:
            `🎉 *مبروك!*\n\n` +
            `> لقد فزت في الهدية (إعادة سحب)!\n\n` +
            `╭┈┈⬡「 📋 *التفاصيل* 」\n` +
            `┃ 🎁 العنوان: \`${giveaway.title}\`\n` +
            `┃ 🏆 الجائزة: *${giveaway.prizeName}*\n` +
            `┃ 🆔 المعرف: \`${giveawayId}\`\n` +
            `╰┈┈⬡\n\n` +
            `╭┈┈⬡「 🎁 *تفاصيل الجائزة* 」\n` +
            `${giveaway.prizeDetails || "تواصل مع المشرف للتفاصيل"}\n` +
            `╰┈┈⬡\n\n` +
            `> _هذه معلومات رسمية من البوت._`,
          contextInfo: ctx,
        });
      } catch (e) {}
    }
    return;
  }

  if (cmd === "هدية") {
    await m.reply(
      "🎁 *قائمة الهدايا*\n\n" +
        `┃ ${prefix}انشاء_هدية — إنشاء هدية\n` +
        `┃ ${prefix}قائمة_الهدايا — عرض القائمة\n` +
        `┃ ${prefix}حذف_هدية — حذف هدية\n` +
        `┃ ${prefix}اعادة_سحب — إعادة سحب الفائزين\n\n` +
        `> اختصارات: هدية, هدية_جديدة, الهدايا, مسح_هدية, سحب_جديد`,
    );
    return;
  }
}

export {
  plugin as config,
  handler,
  startGiveawayChecker,
  hasActiveSession,
  handleSession,
};