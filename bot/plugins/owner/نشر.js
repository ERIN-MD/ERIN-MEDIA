import { getDatabase } from "../../src/lib/maro-database.js";
import { fetchGroupsSafe } from "../../src/lib/maro-jpm-helper.js";
import {
  getAutoJpmConfig,
  setAutoJpmConfig,
  startAutoJpmScheduler,
  stopAutoJpmScheduler,
  getAutoJpmStorageDir,
} from "../../src/lib/maro-auto-jpm.js";
import { getMimeType, getExtension } from "../../src/lib/maro-utils.js";
import * as timeHelper from "../../src/lib/maro-time.js";
import {
  getBinaryNodeChild,
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  proto,
} from "maro";
import config from "../../config.js";
import te from "../../src/lib/maro-error.js";
import { saluranCtx } from "../../src/lib/maro-context.js";
import util from "util";
import axios from "axios";
import path from "path";
import fs from "fs";
import { getAssetBuffer } from "../../src/lib/maro-asset-manager.js";

const pluginConfig = {
  name: "نشر",
  alias: ["jpm"],
  category: "owner",
  description: "نظام النشر الشامل: broadcast, hidetag, channel, auto, blacklist, delay",
  usage: ".نشر",
  example: ".نشر",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

const jpmSessions = {};

let cachedThumb = null;
try {
  cachedThumb = getAssetBuffer("maro2");
} catch {}

function getVerifiedQuoted() {
  const botName = config.bot?.name || "Maro-AI";
  const botNumber = config.owner?.number?.[0] || "0";
  return {
    key: {
      participant: `0@s.whatsapp.net`,
      remoteJid: `status@broadcast`,
    },
    message: {
      contactMessage: {
        displayName: `📢 ${botName}`,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:XL;${botName};;;\nFN:${botName}\nitem1.TEL;waid=${botNumber}:${botNumber}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
        sendEphemeral: true,
      },
    },
  };
}

function parseInterval(raw) {
  if (!raw) return 0;
  const cleaned = raw.toLowerCase().replace(/\s+/g, "");
  const matches = [...cleaned.matchAll(/(\d+)([smhdw])/g)];
  if (!matches.length) return 0;
  const combined = matches.map((m) => m[0]).join("");
  if (combined !== cleaned) return 0;
  let total = 0;
  for (const match of matches) {
    const value = parseInt(match[1]);
    const unit = match[2];
    if (unit === "s") total += value * 1000;
    if (unit === "m") total += value * 60 * 1000;
    if (unit === "h") total += value * 60 * 60 * 1000;
    if (unit === "d") total += value * 24 * 60 * 60 * 1000;
    if (unit === "w") total += value * 7 * 24 * 60 * 60 * 1000;
  }
  return total;
}

function formatInterval(ms) {
  if (!ms || ms <= 0) return "0 detik";
  const units = [
    { label: "hari", value: 86400000 },
    { label: "jam", value: 3600000 },
    { label: "menit", value: 60000 },
    { label: "detik", value: 1000 },
  ];
  let remaining = ms;
  const parts = [];
  for (const unit of units) {
    const amount = Math.floor(remaining / unit.value);
    if (amount > 0) {
      parts.push(`${amount} ${unit.label}`);
      remaining -= amount * unit.value;
    }
  }
  return parts.length ? parts.join(" ") : "0 detik";
}

function previewText(text) {
  if (!text) return "-";
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length <= 80 ? cleaned : `${cleaned.slice(0, 77)}...`;
}

async function fetchAllSubscribedChannels(sock) {
  const data = {};
  const encoder = new TextEncoder();
  const queryIds = ["6388546374527196"];
  for (const queryId of queryIds) {
    try {
      const result = await sock.query({
        tag: "iq",
        attrs: {
          id: sock.generateMessageTag(),
          type: "get",
          xmlns: "w:mex",
          to: "@s.whatsapp.net",
        },
        content: [
          {
            tag: "query",
            attrs: { query_id: queryId },
            content: encoder.encode(JSON.stringify({ variables: {} })),
          },
        ],
      });
      const child = getBinaryNodeChild(result, "result");
      if (!child?.content) continue;
      const parsed = JSON.parse(child.content.toString());
      const newsletters =
        parsed?.data?.["xwa2_newsletter_subscribed"] ||
        parsed?.data?.["newsletter_subscribed"] ||
        parsed?.data?.["subscribed"] ||
        [];
      if (newsletters.length > 0) {
        for (const ch of newsletters) {
          if (ch.id) {
            data[ch.id] = {
              id: ch.id,
              name: ch.thread_metadata?.name?.text || ch.name || "Unknown",
              subscribers: ch.thread_metadata?.subscribers_count || 0,
            };
          }
        }
        break;
      }
    } catch {
      continue;
    }
  }
  return data;
}

async function getTargetGroups(sock, db, blacklistKey = "jpmBlacklist") {
  const allGroups = await fetchGroupsSafe(sock);
  let groupIds = Object.keys(allGroups);
  const blacklist = db.setting("jpmBlacklist") || [];
  const autoBlacklist = db.setting(blacklistKey) || [];
  const fullBlacklist = [...new Set([...blacklist, ...autoBlacklist])];
  const blacklistedCount = groupIds.filter((id) =>
    fullBlacklist.includes(id),
  ).length;
  groupIds = groupIds.filter((id) => !fullBlacklist.includes(id));
  return { groupIds, allGroups, blacklistedCount };
}

async function sendInteractiveMessage(
  m,
  sock,
  { title, body, footer, buttons },
) {
  let headerMedia = null;
  if (cachedThumb) {
    try {
      headerMedia = await prepareWAMessageMedia(
        { image: cachedThumb },
        { upload: sock.waUploadToServer },
      );
    } catch {}
  }

  const botName = config.bot?.name || "Maro-AI";
  const saluranId = config.saluran?.id || "120363400911374213@newsletter";
  const saluranName = config.saluran?.name || botName;

  const msg = generateWAMessageFromContent(
    m.chat,
    {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2,
          },
          interactiveMessage: proto.Message.InteractiveMessage.fromObject({
            body: proto.Message.InteractiveMessage.Body.fromObject({
              text: body,
            }),
            footer: proto.Message.InteractiveMessage.Footer.fromObject({
              text: footer || `${botName} JPM System`,
            }),
            header: proto.Message.InteractiveMessage.Header.fromObject({
              hasMediaAttachment: !!headerMedia,
              ...(headerMedia || {}),
            }),
            nativeFlowMessage:
              proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                buttons,
              }),
            contextInfo: {
              mentionedJid: [m.sender],
              forwardingScore: 9,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: saluranId,
                newsletterName: saluranName,
                serverMessageId: 127,
              },
            },
          }),
        },
      },
    },
    { userJid: m.sender, quoted: getVerifiedQuoted() },
  );

  await sock.relayMessage(m.chat, msg.message, {
    messageId: msg.key.id,
  });
}

async function sendInteractiveJpm(m, sock, db, contentInfo) {
  const prefix = m.prefix;
  const botName = config.bot?.name || "Maro-AI";
  const hasContent = contentInfo?.text || contentInfo?.mediaBuffer;

  const autoJpmCfg = getAutoJpmConfig();
  const autoJpmStatus = autoJpmCfg.enabled ? "✅ مفعل" : "❌ معطل";
  const currentDelay = db.setting("jedaJpm") || 5000;
  const blCount = (db.setting("jpmBlacklist") || []).length;
  const autoBlCount = (db.setting("autoJpmBlacklist") || []).length;

  let body =
    `📢 *نشر — نظام النشر الجماعي*\n\n` +
    `إرسال رسائل إلى جميع المجموعات، القنوات، أو أهداف محددة تلقائياً أو يدوياً.\n\n` +
    `*الحالة الحالية:*\n` +
    `> ⏱️ التأخير: *${(currentDelay / 1000).toFixed(1)} ثانية*\n` +
    `> 🔄 النشر التلقائي: *${autoJpmStatus}*\n` +
    `> 🚫 القائمة السوداء: *${blCount} مجموعة*\n` +
    `> 🚫 القائمة السوداء التلقائي: *${autoBlCount} مجموعة*\n` +
    `> 📢 النشر جاري: *${global.statusjpm ? "⚠️ نعم" : "لا"}*`;

  if (hasContent) {
    body +=
      `\n\n📝 *المحتوى الجاهز للإرسال:*\n` +
      `> النص: *${contentInfo?.text ? previewText(contentInfo.text) : "لا يوجد"}*\n` +
      `> الوسائط: *${contentInfo?.mediaBuffer ? contentInfo.mediaType : "لا يوجد"}*\n\n` +
      `_اختر وضع الإرسال أدناه لبدء النشر_`;
  } else {
    body +=
      `\n\n💡 *طريقة الاستخدام:*\n` +
      `1. أرسل نص، صورة، صوت، أو فيديو\n` +
      `2. ارد على الرسالة بـ *${prefix}نشر*\n` +
      `3. اختر وضع الإرسال من الأزرار أدناه\n\n` +
      `_أو اختر الوضع أولاً ثم أرسل المحتوى_`;
  }

  const buttons = [
    {
      name: "single_select",
      buttonParamsJson: JSON.stringify({
        title: "📢 اختر وضع النشر",
        sections: [
          {
            title: "📨 أوضاع النشر",
            rows: [
              {
                title: "📢 نشر أساسي",
                description: "إرسال إلى جميع المجموعات بدون منشن",
                id: `${prefix}jpm _mode_basic`,
              },
              {
                title: "👁️ نشر مخفي",
                description: "إرسال إلى جميع المجموعات مع منشن مخفي",
                id: `${prefix}jpm _mode_hidetag`,
              },
              {
                title: "📺 نشر القنوات",
                description: "إرسال إلى جميع القنوات المشترك فيها",
                id: `${prefix}jpm _mode_channel`,
              },
              {
                title: "🚀 نشر التحديثات",
                description: "نشر سجل التغييرات إلى جميع المجموعات",
                id: `${prefix}jpm _mode_update`,
              },
              {
                title: "🔄 نشر تلقائي",
                description: "جدولة النشر التلقائي حسب الفاصل الزمني",
                id: `${prefix}jpm _mode_autojpm`,
              },
            ],
          },
          {
            title: "⚙️ الإعدادات",
            rows: [
              {
                title: "⏱️ ضبط التأخير",
                description: `التأخير الحالي: ${(currentDelay / 1000).toFixed(1)}s`,
                id: `${prefix}jpm _set_delay`,
              },
              {
                title: "🚫 القائمة السوداء",
                description: `إدارة المجموعات المستثناة من النشر (${blCount})`,
                id: `${prefix}jpm _bl_jpm`,
              },
              {
                title: "🚫 القائمة السوداء التلقائي",
                description: `إدارة استثناءات النشر التلقائي (${autoBlCount})`,
                id: `${prefix}jpm _bl_autojpm`,
              },
              {
                title: "⏹️ إيقاف النشر",
                description: "إيقاف عملية النشر الجارية",
                id: `${prefix}jpm _stop`,
              },
              {
                title: "📊 حالة النشر التلقائي",
                description: "عرض جدول وتفاصيل النشر التلقائي",
                id: `${prefix}jpm _autojpm_status`,
              },
            ],
          },
        ],
      }),
    },
    {
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({
        display_text: "❓ مساعدة",
        id: `${prefix}jpm _help`,
      }),
    },
  ];

  return sendInteractiveMessage(m, sock, {
    title: `📢 ${botName} نشر`,
    body,
    footer: `${botName} نظام النشر`,
    buttons,
  });
}

async function runBroadcast(
  sock,
  m,
  db,
  { groupIds, allGroups, mode, text, mediaBuffer, mediaType },
) {
  const jedaJpm = db.setting("jedaJpm") || 5000;
  const ctx = saluranCtx();
  const isHidetag = mode === "hidetag";
  const modeLabel = isHidetag
    ? "مخفي"
    : mode === "channel"
      ? "القنوات"
      : mode === "update"
        ? "التحديثات"
        : "أساسي";

  await m.reply(
    `📢 *بدء النشر ${modeLabel}*\n\n` +
      `> 📝 الرسالة: *${text.substring(0, 50)}${text.length > 50 ? "..." : ""}*\n` +
      `> 📷 الوسائط: *${mediaBuffer ? mediaType : "لا يوجد"}*\n` +
      `> 👥 المستهدفين: *${groupIds.length}* ${mode === "channel" ? "قناة" : "مجموعة"}\n` +
      `> ⏱️ التأخير: *${(jedaJpm / 1000).toFixed(1)} ثانية*\n` +
      `> 📊 التقدير: *${Math.ceil((groupIds.length * jedaJpm) / 60000)} دقيقة*\n\n` +
      `_جاري الإرسال إلى جميع المستهدفين..._`,
  );

  global.statusjpm = true;
  let successCount = 0;
  let failedCount = 0;

  for (const targetId of groupIds) {
    if (global.stopjpm) {
      delete global.stopjpm;
      delete global.statusjpm;
      await m.reply(
        `⏹️ *تم إيقاف النشر*\n\n` +
          `> ✅ ناجح: *${successCount}*\n` +
          `> ❌ فاشل: *${failedCount}*\n` +
          `> ⏸️ متبقي: *${groupIds.length - successCount - failedCount}*`,
      );
      return;
    }

    try {
      if (isHidetag && allGroups[targetId]) {
        const mentions = allGroups[targetId].participants
          .map((p) => p.id || p.jid)
          .filter(Boolean);
        const hidetagCtx = { ...ctx, mentionedJid: mentions };
        if (mediaBuffer) {
          await sock.sendMessage(targetId, {
            [mediaType]: mediaBuffer,
            caption: text,
            mentions,
            contextInfo: hidetagCtx,
          });
        } else {
          await sock.sendMessage(targetId, {
            text,
            mentions,
            contextInfo: hidetagCtx,
          });
        }
      } else if (mediaBuffer) {
        await sock.sendMedia(targetId, mediaBuffer, text, null, {
          type: mediaType,
          contextInfo: { forwardingScore: 99, isForwarded: true },
        });
      } else {
        await sock.sendText(targetId, text, null, {
          contextInfo: { forwardingScore: 99, isForwarded: true },
        });
      }
      successCount++;
    } catch {
      failedCount++;
    }

    await new Promise((resolve) => setTimeout(resolve, jedaJpm));
  }

  delete global.statusjpm;
  m.react("✅");
  await m.reply(
    `✅ *اكتمل النشر ${modeLabel}!*\n\n` +
      `> ✅ ناجح: *${successCount}*\n` +
      `> ❌ فاشل: *${failedCount}*\n` +
      `> 📊 المجموع: *${groupIds.length}*`,
  );
}

function showHelp(m) {
  const p = m.prefix;
  return m.reply(
    `📢 *نشر — نظام النشر الجماعي*\n\n` +
      `نظام متكامل لإرسال الرسائل إلى جميع المجموعات، القنوات، أو أهداف محددة تلقائياً أو يدوياً.\n\n` +
      `*طريقة الاستخدام:*\n` +
      `> اكتب *${p}نشر* لفتح القائمة التفاعلية\n` +
      `> يمكنك الرد على رسالة/صورة/فيديو ثم كتابة *${p}نشر*\n` +
      `> اختر وضع الإرسال من الأزرار التي تظهر\n\n` +
      `*أوضاع النشر:*\n` +
      `> 📢 *نشر أساسي* — إرسال إلى جميع المجموعات بدون منشن\n` +
      `> 👁️ *نشر مخفي* — إرسال إلى جميع المجموعات مع منشن مخفي\n` +
      `> 📺 *نشر القنوات* — إرسال إلى جميع القنوات المشترك فيها\n` +
      `> 🚀 *نشر التحديثات* — نشر سجل التغييرات إلى جميع المجموعات\n` +
      `> 🔄 *نشر تلقائي* — جدولة النشر التلقائي حسب الفاصل الزمني\n\n` +
      `*الإعدادات:*\n` +
      `> ⏱️ *ضبط التأخير* — التأخير بين كل إرسال\n` +
      `> 🚫 *القائمة السوداء* — إدارة المجموعات المستثناة من النشر\n` +
      `> 🚫 *القائمة السوداء التلقائي* — إدارة استثناءات النشر التلقائي\n` +
      `> ⏹️ *إيقاف النشر* — إيقاف عملية النشر الجارية\n\n` +
      `*صيغ الفواصل الزمنية:*\n` +
      `> *10m* (10 دقائق) • *1h* (ساعة) • *2h30m* (ساعتين ونصف) • *1d* (يوم)`,
  );
}

async function handler(m, { sock }) {
  const db = getDatabase();
  const command = m.command?.toLowerCase() || "";
  const input = (m.text || "").trim();
  const fullInput = (m.fullArgs || m.text || "").trim();

  if (command === "stopjpm" || command === "stopjasher") {
    if (!global.statusjpm)
      return m.reply(`❌ لا يوجد نشر جاري حالياً.`);
    global.stopjpm = true;
    m.react("⏹️");
    return m.reply(`⏹️ *تم إيقاف النشر*\n\n> جاري إيقاف عملية النشر...`);
  }

  if (
    command === "setdelayjpm" ||
    command === "delayjpm" ||
    command === "jedajpm" ||
    command === "setjedajpm"
  ) {
    return handleSetDelay(m, sock, db, input);
  }

  if (
    command === "blacklistjpm" ||
    command === "bljpm" ||
    command === "jpmbl" ||
    command === "jpmblacklist" ||
    command === "listblacklistjpm"
  ) {
    return handleBlacklist(m, sock, db, "jpmBlacklist", "نشر");
  }

  if (
    command === "blautojpm" ||
    command === "blacklistautojpm" ||
    command === "autojpmbl" ||
    command === "listblautojpm"
  ) {
    return handleBlacklist(m, sock, db, "autoJpmBlacklist", "نشر تلقائي");
  }

  if (command === "autojpm" || command === "autojasher") {
    return handleAutoJpm(m, sock, db, input, fullInput);
  }

  if (
    command === "jpmupdate" ||
    command === "updatejpm" ||
    command === "broadcastupdate"
  ) {
    return handleJpmUpdate(m, sock, db, input);
  }

  if (command === "jpmch" || command === "jpmchannel") {
    return handleJpmChannel(m, sock, db, fullInput);
  }

  if (command === "jpmht" || command === "jpmhidetag") {
    return handleJpmDirect(m, sock, db, fullInput, "hidetag");
  }

  if (command === "jpm" || command === "jasher" || command === "jaser" || command === "نشر") {
    return handleJpmMain(m, sock, db, fullInput);
  }

  return showHelp(m);
}

async function handleJpmMain(m, sock, db, fullInput) {
  if (fullInput.startsWith("_")) {
    return handleInternalCommand(m, sock, db, fullInput);
  }

  let mediaBuffer = null;
  let mediaType = null;
  let text = fullInput || "";
  const qmsg = m.quoted || m;

  if (!text && m.quoted) {
    text = m.quoted.body || m.quoted.text || m.quoted.contentText || "";
  }

  if (qmsg.isImage) {
    try {
      mediaBuffer = await qmsg.download();
      mediaType = "image";
    } catch {}
  } else if (qmsg.isVideo) {
    try {
      mediaBuffer = await qmsg.download();
      mediaType = "video";
    } catch {}
  } else if (qmsg.isAudio || qmsg.mimetype?.startsWith("audio")) {
    try {
      mediaBuffer = await qmsg.download();
      mediaType = "audio";
    } catch {}
  } else if (
    qmsg.isDocument ||
    (qmsg.mimetype && !qmsg.mimetype.startsWith("text/plain"))
  ) {
    try {
      mediaBuffer = await qmsg.download();
      mediaType = "document";
    } catch {}
  }

  const contentInfo =
    mediaBuffer || text ? { text, mediaBuffer, mediaType } : null;

  if (contentInfo) {
    jpmSessions[m.sender] = {
      text,
      mediaBuffer,
      mediaType,
      timestamp: Date.now(),
    };
  }

  return sendInteractiveJpm(m, sock, db, contentInfo);
}

async function handleInternalCommand(m, sock, db, fullInput) {
  const prefix = m.prefix;
  const cmd = fullInput.trim();

  if (cmd === "_mode_basic") return executeJpmWithSession(m, sock, db, "basic");
  if (cmd === "_mode_hidetag")
    return executeJpmWithSession(m, sock, db, "hidetag");
  if (cmd === "_mode_channel")
    return executeJpmWithSession(m, sock, db, "channel");
  if (cmd === "_mode_update")
    return executeJpmWithSession(m, sock, db, "update");
  if (cmd === "_mode_autojpm") return startAutoJpmSession(m, sock, db);
  if (cmd === "_set_delay") return handleSetDelay(m, sock, db, "");
  if (cmd === "_bl_jpm")
    return handleBlacklist(m, sock, db, "jpmBlacklist", "نشر");
  if (cmd === "_bl_autojpm")
    return handleBlacklist(m, sock, db, "autoJpmBlacklist", "نشر تلقائي");
  if (cmd === "_autojpm_status") return showAutoJpmStatus(m);

  if (cmd === "_stop") {
    if (!global.statusjpm)
      return m.reply(`❌ لا يوجد نشر جاري حالياً.`);
    global.stopjpm = true;
    m.react("⏹️");
    return m.reply(`⏹️ *تم إيقاف النشر*\n\n> جاري إيقاف عملية النشر...`);
  }

  if (cmd === "_help") return showHelp(m);

  if (cmd.startsWith("_autojpm_interval_")) {
    const intervalStr = cmd.replace("_autojpm_interval_", "");
    return completeAutoJpmSetup(m, sock, db, intervalStr);
  }

  if (cmd.startsWith("_delay_")) {
    const ms = parseInt(cmd.replace("_delay_", ""));
    if (!isNaN(ms) && ms >= 1000 && ms <= 30000) {
      return handleSetDelay(m, sock, db, String(ms));
    }
  }

  return m.reply(
    `❌ أمر غير معروف. اكتب *${prefix}نشر* لفتح القائمة.`,
  );
}

async function executeJpmWithSession(m, sock, db, mode) {
  const session = jpmSessions[m.sender];
  const text = session?.text || "";
  const mediaBuffer = session?.mediaBuffer || null;
  const mediaType = session?.mediaType || null;

  if (!text && !mediaBuffer) {
    return m.reply(
      `❌ *لا يوجد محتوى*\n\n` +
        `أرسل رسالة، صورة، صوت، أو فيديو أولاً، ثم ارد بـ *${m.prefix}نشر* واختر وضع الإرسال.\n\n` +
        `*الطريقة الصحيحة:*\n` +
        `1. أرسل نص/صورة/فيديو/صوت\n` +
        `2. ارد على الرسالة بـ *${m.prefix}نشر*\n` +
        `3. اختر الوضع من الأزرار التي تظهر`,
    );
  }

  if (mode === "update") return handleJpmUpdateWithContent(m, sock, db, text);
  if (mode === "channel")
    return handleJpmChannelWithContent(
      m,
      sock,
      db,
      text,
      mediaBuffer,
      mediaType,
    );

  if (global.statusjpm) {
    return m.reply(
      `❌ *النشر جاري*\n\n> اكتب *${m.prefix}stopjpm* للإيقاف أولاً.`,
    );
  }

  m.react("📢");

  try {
    const { groupIds, allGroups, blacklistedCount } = await getTargetGroups(
      sock,
      db,
    );
    if (groupIds.length === 0) {
      m.react("❌");
      return m.reply(
        `❌ *لا توجد مجموعات*\n\n` +
          `> لم يتم العثور على مجموعات متاحة${blacklistedCount > 0 ? ` (${blacklistedCount} مجموعة محظورة)` : ""}`,
      );
    }
    await runBroadcast(sock, m, db, {
      groupIds,
      allGroups,
      mode,
      text,
      mediaBuffer,
      mediaType,
    });
  } catch (error) {
    delete global.statusjpm;
    m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  } finally {
    delete jpmSessions[m.sender];
  }
}

async function handleJpmDirect(m, sock, db, text, mode) {
  if (!text && m.quoted) {
    text = m.quoted.body || m.quoted.text || m.quoted.contentText || "";
  }

  if (!text) {
    const modeLabel = mode === "hidetag" ? "مخفي" : "أساسي";
    return m.reply(
      `📢 *نشر ${modeLabel}*\n\n` +
        `إرسال رسالة نشر إلى جميع المجموعات${mode === "hidetag" ? " مع منشن مخفي لجميع الأعضاء" : ""}.\n\n` +
        `*الاستخدام:*\n` +
        `> *${m.prefix}${mode === "hidetag" ? "jpmht" : "jpm"} <رسالة>*\n` +
        `> *${m.prefix}${mode === "hidetag" ? "jpmht" : "jpm"}* (رد على صورة/فيديو)\n\n` +
        `*مثال:*\n` +
        `> *${m.prefix}${mode === "hidetag" ? "jpmht" : "jpm"} مرحباً بالجميع! لا تنسوا الفعالية غداً.*`,
    );
  }

  if (global.statusjpm) {
    return m.reply(
      `❌ *النشر جاري*\n\n> اكتب *${m.prefix}stopjpm* للإيقاف.`,
    );
  }

  m.react("📢");

  try {
    let mediaBuffer = null;
    let mediaType = null;
    const qmsg = m.quoted || m;
    if (qmsg.isImage) {
      try {
        mediaBuffer = await qmsg.download();
        mediaType = "image";
      } catch {}
    } else if (qmsg.isVideo) {
      try {
        mediaBuffer = await qmsg.download();
        mediaType = "video";
      } catch {}
    }

    const { groupIds, allGroups, blacklistedCount } = await getTargetGroups(
      sock,
      db,
    );
    if (groupIds.length === 0) {
      m.react("❌");
      return m.reply(
        `❌ *لا توجد مجموعات*\n\n> لم يتم العثور على مجموعات متاحة${blacklistedCount > 0 ? ` (${blacklistedCount} مجموعة محظورة)` : ""}`,
      );
    }

    await runBroadcast(sock, m, db, {
      groupIds,
      allGroups,
      mode,
      text,
      mediaBuffer,
      mediaType,
    });
  } catch (error) {
    delete global.statusjpm;
    m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

async function handleJpmChannel(m, sock, db, text) {
  if (!text && m.quoted) {
    text = m.quoted.body || m.quoted.text || m.quoted.contentText || "";
  }

  if (!text) {
    return m.reply(
      `📢 *نشر القنوات*\n\n` +
        `إرسال رسالة إلى جميع قنوات واتساب المشترك فيها البوت.\n\n` +
        `*الاستخدام:*\n` +
        `> *${m.prefix}jpmch <رسالة>*\n` +
        `> *${m.prefix}jpmch* (رد على صورة/فيديو)\n\n` +
        `*مثال:*\n` +
        `> *${m.prefix}jpmch مرحباً بالجميع، تابعوا آخر تحديثاتنا!*`,
    );
  }
  return handleJpmChannelWithContent(m, sock, db, text, null, null);
}

async function handleJpmChannelWithContent(
  m,
  sock,
  db,
  text,
  mediaBuffer,
  mediaType,
) {
  if (global.statusjpm) {
    return m.reply(
      `❌ *النشر جاري*\n\n> اكتب *${m.prefix}stopjpm* للإيقاف.`,
    );
  }

  m.react("📢");

  try {
    if (!mediaBuffer) {
      const qmsg = m.quoted || m;
      if (qmsg.isImage) {
        try {
          mediaBuffer = await qmsg.download();
          mediaType = "image";
        } catch {}
      } else if (qmsg.isVideo) {
        try {
          mediaBuffer = await qmsg.download();
          mediaType = "video";
        } catch {}
      }
    }

    const channels = await fetchAllSubscribedChannels(sock);
    const channelIds = Object.keys(channels);
    if (channelIds.length === 0) {
      m.react("❌");
      return m.reply(
        `❌ *لا توجد قنوات*\n\n> البوت غير مشترك في أي قناة`,
      );
    }

    const jedaJpm = db.setting("jedaJpm") || 5000;
    const ctx = saluranCtx();

    await m.reply(
      `📢 *بدء نشر القنوات*\n\n` +
        `> 📝 الرسالة: *${text.substring(0, 50)}${text.length > 50 ? "..." : ""}*\n` +
        `> 📷 الوسائط: *${mediaBuffer ? mediaType : "لا يوجد"}*\n` +
        `> 📺 المستهدفين: *${channelIds.length}* قناة\n` +
        `> ⏱️ التأخير: *${(jedaJpm / 1000).toFixed(1)} ثانية*\n\n` +
        `_جاري الإرسال إلى جميع القنوات..._`,
    );

    global.statusjpm = true;
    let successCount = 0;
    let failedCount = 0;

    for (const chId of channelIds) {
      if (global.stopjpm) {
        delete global.stopjpm;
        delete global.statusjpm;
        await m.reply(
          `⏹️ *تم إيقاف نشر القنوات*\n\n` +
            `> ✅ ناجح: *${successCount}*\n` +
            `> ❌ فاشل: *${failedCount}*`,
        );
        return;
      }
      try {
        if (mediaBuffer) {
          await sock.sendMessage(chId, {
            [mediaType]: mediaBuffer,
            caption: text,
            contextInfo: ctx,
          });
        } else {
          await sock.sendMessage(chId, { text, contextInfo: ctx });
        }
        successCount++;
      } catch {
        failedCount++;
      }
      await new Promise((resolve) => setTimeout(resolve, jedaJpm));
    }

    delete global.statusjpm;
    m.react("✅");
    await m.reply(
      `✅ *اكتمل نشر القنوات!*\n\n` +
        `> ✅ ناجح: *${successCount}*\n` +
        `> ❌ فاشل: *${failedCount}*\n` +
        `> 📊 المجموع: *${channelIds.length}*`,
    );
  } catch (error) {
    delete global.statusjpm;
    m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

async function handleJpmUpdate(m, sock, db, input) {
  if (!input && m.quoted) {
    input = m.quoted.body || m.quoted.text || m.quoted.contentText || "";
  }

  if (!input) {
    return m.reply(
      `📢 *نشر التحديثات*\n\n` +
        `إرسال معلومات التحديث / سجل التغييرات إلى جميع المجموعات!\n\n` +
        `*الصيغة:*\n` +
        `> *${m.prefix}jpmupdate <الإصدار> | <محتوى التغييرات>*\n\n` +
        `*مثال:*\n` +
        `> *${m.prefix}jpmupdate v3.0 | ميزات جديدة: - نشر مخفي - نظام AFK*`,
    );
  }
  return handleJpmUpdateWithContent(m, sock, db, input);
}

async function handleJpmUpdateWithContent(m, sock, db, input) {
  if (global.statusjpm) {
    return m.reply(
      `❌ *النشر جاري*\n\n> اكتب *${m.prefix}stopjpm* للإيقاف.`,
    );
  }

  let version = config.bot?.version || "v1.0";
  let changelog = input;
  if (input.includes("|")) {
    const parts = input.split("|");
    version = parts[0].trim();
    changelog = parts.slice(1).join("|").trim();
  }
  if (!changelog) return m.reply(`❌ سجل التغييرات لا يمكن أن يكون فارغاً!`);

  m.react("🕕");

  try {
    const { groupIds, blacklistedCount } = await getTargetGroups(sock, db);
    if (groupIds.length === 0) {
      m.react("❌");
      return m.reply(
        `❌ *لا توجد مجموعات*\n\n> لم يتم العثور على مجموعات متاحة${blacklistedCount > 0 ? ` (${blacklistedCount} مجموعة محظورة)` : ""}`,
      );
    }

    const botName = config.bot?.name || "Maro-AI";
    const dateStr = timeHelper.formatDate("DD MMMM YYYY");
    const updateMessage =
      `🚀 *تحديث !! | ${version}*\n\n` +
      `📅 *التاريخ:* ${dateStr}\n\n` +
      `*سجل التغييرات:*\n${changelog}\n\n` +
      `*ملاحظات هامة:*\n` +
      `> 💡 اكتب *${m.prefix}menu* لاستكشاف هذه الميزات.\n` +
      `> 📢 _شكراً لاستخدامكم ${botName}_`;

    const jedaJpm = db.setting("jedaJpm") || 5000;

    await m.reply(
      `📢 *بدء نشر التحديثات*\n\n` +
        `> 🏷️ الإصدار: *${version}*\n` +
        `> 👥 المستهدفين: *${groupIds.length}* مجموعة\n` +
        `> ⏱️ التأخير: *${(jedaJpm / 1000).toFixed(1)} ثانية*\n\n` +
        `_جاري نشر التحديث إلى جميع المجموعات..._`,
    );

    global.statusjpm = true;
    let successCount = 0;
    let failedCount = 0;

    for (const groupId of groupIds) {
      if (global.stopjpm) {
        delete global.stopjpm;
        delete global.statusjpm;
        await m.reply(
          `⏹️ *تم إيقاف نشر التحديثات*\n\n` +
            `> ✅ ناجح: *${successCount}*\n` +
            `> ❌ فاشل: *${failedCount}*\n` +
            `> ⏸️ متبقي: *${groupIds.length - successCount - failedCount}*`,
        );
        return;
      }
      try {
        await sock.sendMessage(groupId, {
          text: updateMessage,
          contextInfo: saluranCtx(),
        });
        successCount++;
      } catch {
        failedCount++;
      }
      await new Promise((resolve) => setTimeout(resolve, jedaJpm));
    }

    delete global.statusjpm;
    m.react("✅");
    await m.reply(
      `✅ *اكتمل نشر التحديثات!*\n\n` +
        `> ✅ ناجح: *${successCount}*\n` +
        `> ❌ فاشل: *${failedCount}*\n` +
        `> 📊 المجموع: *${groupIds.length}*`,
    );
  } catch (error) {
    delete global.statusjpm;
    m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

async function startAutoJpmSession(m, sock, db) {
  const session = jpmSessions[m.sender];
  const prefix = m.prefix;
  const hasContent = session?.text || session?.mediaBuffer;

  let body =
    `🔄 *نشر تلقائي — جلسة الإعداد*\n\n` +
    `سيقوم البوت بإرسال الرسالة تلقائياً إلى جميع المجموعات حسب الفاصل الزمني الذي تحدده.\n\n`;

  if (hasContent) {
    body +=
      `📝 *المحتوى المراد إرساله:*\n` +
      `> النص: *${session.text ? previewText(session.text) : "لا يوجد"}*\n` +
      `> الوسائط: *${session.mediaBuffer ? session.mediaType : "لا يوجد"}*\n\n`;
  }

  body +=
    `*اختر الفاصل الزمني أدناه:*\n` +
    `> كلما زاد الفاصل، زاد الأمان من اكتشاف السبام.\n` +
    `> الحد الأدنى: *15 دقيقة*`;

  const buttons = [
    {
      name: "single_select",
      buttonParamsJson: JSON.stringify({
        title: "⏱️ اختر الفاصل",
        sections: [
          {
            title: "⏱️ الفواصل الشائعة",
            rows: [
              {
                title: "🕐 15 دقيقة",
                description: "مناسب للتذكيرات القصيرة",
                id: `${prefix}jpm _autojpm_interval_15m`,
              },
              {
                title: "🕐 30 دقيقة",
                description: "فاصل قياسي",
                id: `${prefix}jpm _autojpm_interval_30m`,
              },
              {
                title: "🕐 1 ساعة",
                description: "الأكثر استخداماً",
                id: `${prefix}jpm _autojpm_interval_1h`,
              },
              {
                title: "🕐 2 ساعة",
                description: "آمن وغير مزعج",
                id: `${prefix}jpm _autojpm_interval_2h`,
              },
              {
                title: "🕐 3 ساعات",
                description: "آمن جداً من السبام",
                id: `${prefix}jpm _autojpm_interval_3h`,
              },
              {
                title: "🕐 6 ساعات",
                description: "مرة كل نصف يوم",
                id: `${prefix}jpm _autojpm_interval_6h`,
              },
              {
                title: "🕐 12 ساعة",
                description: "مرتين في اليوم",
                id: `${prefix}jpm _autojpm_interval_12h`,
              },
              {
                title: "🕐 1 يوم",
                description: "مرة واحدة يومياً",
                id: `${prefix}jpm _autojpm_interval_1d`,
              },
            ],
          },
          {
            title: "⚙️ مخصص",
            rows: [
              {
                title: "✏️ إدخال يدوي",
                description:
                  "اكتب الفاصل بنفسك (مثال: .autojpm on 2h30m رسالة)",
                id: `${prefix}jpm _help`,
              },
            ],
          },
        ],
      }),
    },
    {
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({
        display_text: "❌ إلغاء",
        id: `${prefix}jpm`,
      }),
    },
  ];

  return sendInteractiveMessage(m, sock, {
    title: `🔄 ${config.bot?.name || "Maro-AI"} نشر تلقائي`,
    body,
    footer: `${config.bot?.name || "Maro-AI"} نشر تلقائي`,
    buttons,
  });
}

async function completeAutoJpmSetup(m, sock, db, intervalStr) {
  const intervalMs = parseInterval(intervalStr);
  if (!intervalMs)
    return m.reply(
      `❌ فاصل غير صالح. مثال: *15m*, *1h*, *2h30m*, *1d*`,
    );
  if (intervalMs < 15 * 60 * 1000)
    return m.reply(`❌ الحد الأدنى للفاصل *15 دقيقة* لمنع السبام.`);

  const session = jpmSessions[m.sender];
  const existing = getAutoJpmConfig();
  const quoted = m.quoted || m;
  let messageText = session?.text || "";
  if (!messageText && quoted.body)
    messageText = quoted.body.replace(/\\n/g, "\n").trim();

  let mediaData = existing?.message?.media || null;
  if (session?.mediaBuffer) {
    const buffer = session.mediaBuffer;
    const mType = session.mediaType || "image";
    const mimetype = quoted.mimetype || "image/jpeg";
    const extension = getExtension(mimetype) || "jpg";
    const fileName = `autojpm_${Date.now()}.${extension}`;
    const storageDir = getAutoJpmStorageDir();
    const filePath = path.join(storageDir, fileName);
    fs.writeFileSync(filePath, buffer);
    if (mediaData?.path && mediaData.path !== filePath) {
      try {
        const baseDir = getAutoJpmStorageDir();
        if (
          path.resolve(mediaData.path).startsWith(path.resolve(baseDir)) &&
          fs.existsSync(mediaData.path)
        ) {
          fs.unlinkSync(mediaData.path);
        }
      } catch {}
    }
    mediaData = { type: mType, path: filePath, mimetype, fileName };
  }

  if (
    !messageText &&
    !mediaData &&
    !existing?.message?.text &&
    !existing?.message?.media
  ) {
    return m.reply(
      `❌ *يجب ملء الرسالة أو الوسائط*\n\n> أرسل المحتوى أولاً، ثم اكتب *${m.prefix}نشر* واختر نشر تلقائي.`,
    );
  }

  const updatedConfig = {
    enabled: true,
    intervalMs,
    message: {
      text: messageText || existing?.message?.text || "",
      media: mediaData,
    },
    lastRun: 0,
    nextRun: Date.now() + intervalMs,
  };

  setAutoJpmConfig(updatedConfig);
  startAutoJpmScheduler(sock);
  delete jpmSessions[m.sender];

  return m.reply(
    `✅ *تم تفعيل النشر التلقائي!*\n\n` +
      `> ⏱️ الفاصل: *${formatInterval(intervalMs)}*\n` +
      `> 🕒 أول مرة: *${timeHelper.fromTimestamp(updatedConfig.nextRun)}*\n` +
      `> 📷 الوسائط: *${updatedConfig.message.media?.type || "لا يوجد"}*\n` +
      `> 📝 الرسالة: *${previewText(updatedConfig.message.text)}*\n\n` +
      `_النشر التلقائي سيعمل تلقائياً حسب الجدول._`,
  );
}

async function handleAutoJpm(m, sock, db, input, fullInput) {
  const prefix = m.prefix;
  if (!input) return startAutoJpmSession(m, sock, db);

  const match = input.match(/^(\S+)(?:\s+(\S+))?(?:\s+([\s\S]*))?$/);
  const action = match?.[1]?.toLowerCase() || "";
  const intervalRaw = match?.[2];
  const messageRaw = match?.[3];

  if (["off", "stop", "disable"].includes(action)) {
    const current = getAutoJpmConfig();
    if (!current.enabled) return m.reply(`ℹ️ النشر التلقائي معطل بالفعل.`);
    setAutoJpmConfig({ ...current, enabled: false });
    stopAutoJpmScheduler();
    return m.reply(
      `✅ *تم تعطيل النشر التلقائي*\n\n> تم إيقاف جدول النشر التلقائي.`,
    );
  }

  if (["status", "info"].includes(action)) return showAutoJpmStatus(m);

  if (!["on", "start", "enable"].includes(action)) {
    return m.reply(
      `❌ صيغة خاطئة. استخدم *${prefix}autojpm on/off/status*.`,
    );
  }

  if (!intervalRaw) return startAutoJpmSession(m, sock, db);

  const intervalMs = parseInterval(intervalRaw);
  if (!intervalMs)
    return m.reply(
      `❌ فاصل غير صالح. مثال: *10m*, *1h*, *2h30m*, *1d*.`,
    );
  if (intervalMs < 15 * 60 * 1000)
    return m.reply(`❌ الحد الأدنى للفاصل *15 دقيقة* لمنع السبام.`);

  const existing = getAutoJpmConfig();
  const quoted = m.quoted || m;
  let messageText = (messageRaw || "").replace(/\\n/g, "\n").trim();
  if (!messageText && quoted.body)
    messageText = quoted.body.replace(/\\n/g, "\n").trim();

  let mediaData = existing?.message?.media || null;
  if (quoted.isImage || quoted.isVideo || quoted.isAudio || quoted.isDocument) {
    const buffer = await quoted.download();
    if (buffer) {
      const mediaType = quoted.isImage
        ? "image"
        : quoted.isVideo
          ? "video"
          : quoted.isAudio
            ? "audio"
            : "document";
      const mimetype = quoted.mimetype || getMimeType(buffer);
      const extension = getExtension(mimetype);
      const fileName = quoted.fileName || `autojpm_${Date.now()}.${extension}`;
      const storageDir = getAutoJpmStorageDir();
      const filePath = path.join(storageDir, fileName);
      fs.writeFileSync(filePath, buffer);
      if (mediaData?.path && mediaData.path !== filePath) {
        try {
          const baseDir = getAutoJpmStorageDir();
          if (
            path.resolve(mediaData.path).startsWith(path.resolve(baseDir)) &&
            fs.existsSync(mediaData.path)
          ) {
            fs.unlinkSync(mediaData.path);
          }
        } catch {}
      }
      mediaData = { type: mediaType, path: filePath, mimetype, fileName };
    }
  }

  if (
    !messageText &&
    !mediaData &&
    !existing?.message?.text &&
    !existing?.message?.media
  ) {
    return m.reply(`❌ يجب ملء الرسالة أو الوسائط.`);
  }

  const updatedConfig = {
    enabled: true,
    intervalMs,
    message: {
      text: messageText || existing?.message?.text || "",
      media: mediaData,
    },
    lastRun: 0,
    nextRun: Date.now() + intervalMs,
  };

  setAutoJpmConfig(updatedConfig);
  startAutoJpmScheduler(sock);

  return m.reply(
    `✅ *تم تفعيل النشر التلقائي!*\n\n` +
      `> ⏱️ الفاصل: *${formatInterval(intervalMs)}*\n` +
      `> 🕒 أول مرة: *${timeHelper.fromTimestamp(updatedConfig.nextRun)}*\n` +
      `> 📷 الوسائط: *${updatedConfig.message.media?.type || "لا يوجد"}*\n` +
      `> 📝 الرسالة: *${previewText(updatedConfig.message.text)}*`,
  );
}

function showAutoJpmStatus(m) {
  const current = getAutoJpmConfig();
  if (!current?.message)
    return m.reply(
      `ℹ️ النشر التلقائي لم يتم إعداده بعد. اكتب *${m.prefix}نشر* للإعداد.`,
    );
  return m.reply(
    `📢 *حالة النشر التلقائي*\n\n` +
      `> الحالة: *${current.enabled ? "✅ مفعل" : "❌ معطل"}*\n` +
      `> الفاصل: *${formatInterval(current.intervalMs || 0)}*\n\n` +
      `*الجدول:*\n` +
      `> آخر مرة: *${current.lastRun ? timeHelper.fromTimestamp(current.lastRun) : "لم يتم بعد"}*\n` +
      `> المرة القادمة: *${current.nextRun ? timeHelper.fromTimestamp(current.nextRun) : "غير مجدول"}*\n\n` +
      `*الرسالة:*\n` +
      `> النص: *${previewText(current.message?.text)}*\n` +
      `> الوسائط: *${current.message?.media?.type ? current.message.media.type.toUpperCase() : "لا يوجد"}*`,
  );
}

async function handleSetDelay(m, sock, db, input) {
  const current = db.setting("jedaJpm") || 5000;
  const prefix = m.prefix;

  if (!input) {
    const body =
      `⏱️ *تأخير النشر*\n\n` +
      `ضبط فترة التأخير بين كل إرسال إلى المجموعات.\n` +
      `كلما زاد التأخير، زاد الأمان من اكتشاف السبام.\n\n` +
      `> التأخير الحالي: *${current}ms* (*${(current / 1000).toFixed(1)} ثانية*)\n\n` +
      `*اختر التأخير أدناه:*`;

    const buttons = [
      {
        name: "single_select",
        buttonParamsJson: JSON.stringify({
          title: "⏱️ اختر التأخير",
          sections: [
            {
              title: "⏱️ التأخيرات الشائعة",
              rows: [
                {
                  title: "⚡ 1 ثانية",
                  description: "سريع جداً، خطر سبام عالي",
                  id: `${prefix}jpm _delay_1000`,
                },
                {
                  title: "⚡ 2 ثانية",
                  description: "سريع، خطر سبام متوسط",
                  id: `${prefix}jpm _delay_2000`,
                },
                {
                  title: "⚡ 3 ثواني",
                  description: "قياسي، آمن نسبياً",
                  id: `${prefix}jpm _delay_3000`,
                },
                {
                  title: "🕐 5 ثواني",
                  description: "آمن، الأكثر استخداماً",
                  id: `${prefix}jpm _delay_5000`,
                },
                {
                  title: "🕐 7 ثواني",
                  description: "آمن جداً",
                  id: `${prefix}jpm _delay_7000`,
                },
                {
                  title: "🕐 10 ثواني",
                  description: "الأكثر أماناً من السبام",
                  id: `${prefix}jpm _delay_10000`,
                },
                {
                  title: "🕐 15 ثانية",
                  description: "للمجموعات الكثيرة جداً",
                  id: `${prefix}jpm _delay_15000`,
                },
              ],
            },
          ],
        }),
      },
      {
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: "↩️ رجوع",
          id: `${prefix}jpm`,
        }),
      },
    ];

    return sendInteractiveMessage(m, sock, {
      title: `⏱️ ${config.bot?.name || "Maro-AI"} تأخير`,
      body,
      footer: `${config.bot?.name || "Maro-AI"} نظام النشر`,
      buttons,
    });
  }

  const ms = parseInt(input);
  if (isNaN(ms) || ms < 1000 || ms > 30000) {
    return m.reply(
      `❌ التأخير يجب أن يكون بين *1000ms* (1 ثانية) و *30000ms* (30 ثانية)`,
    );
  }
  db.setting("jedaJpm", ms);
  return m.reply(
    `✅ *تم تغيير تأخير النشر*\n\n` +
      `> السابق: *${current}ms* (*${(current / 1000).toFixed(1)} ثانية*)\n` +
      `> الحالي: *${ms}ms* (*${(ms / 1000).toFixed(1)} ثانية*)\n\n` +
      `> تقدير 100 مجموعة: *${Math.ceil((100 * ms) / 60000)} دقيقة*`,
  );
}

async function handleBlacklist(m, sock, db, settingKey, label) {
  let blacklist = db.setting(settingKey) || [];
  const allGroups = await sock.groupFetchAllParticipating();
  const groups = Object.values(allGroups).sort((a, b) =>
    a.subject.localeCompare(b.subject),
  );

  if (!m.text || m.text.trim().startsWith("_")) {
    if (groups.length === 0)
      return m.reply(`❌ البوت لم ينضم إلى أي مجموعة بعد.`);
    let listText =
      `📋 *قائمة المجموعات والقائمة السوداء ${label}*\n\n` +
      `التالي *${groups.length} مجموعة* يتابعها البوت *${config.bot?.name}*\n` +
      `علامة *🚫* تعني أن المجموعة محظورة.\n\n`;
    for (let i = 0; i < groups.length; i++) {
      const isBlacklisted = blacklist.includes(groups[i].id);
      listText += `*${i + 1}.* ${groups[i].subject}${isBlacklisted ? " 🚫" : ""}\n`;
    }
    listText +=
      `\n*طريقة الحظر / إلغاء الحظر:*\n` +
      `اكتب الأمر متبوعاً بأرقام المجموعات (يمكن أكثر من واحد، افصل بينها بمسافة).\n\n` +
      `*مثال:*\n` +
      `> *${m.prefix}${settingKey === "autoJpmBlacklist" ? "blautojpm" : "bljpm"} 2 3 7*`;
    return m.reply(listText);
  }

  const args = m.text.trim().split(/\s+/);
  const toggled = [];
  for (const numStr of args) {
    const num = parseInt(numStr);
    if (!isNaN(num) && num > 0 && num <= groups.length) {
      const targetGroup = groups[num - 1];
      if (blacklist.includes(targetGroup.id)) {
        blacklist = blacklist.filter((jid) => jid !== targetGroup.id);
        toggled.push(`*${num}.* ${targetGroup.subject} ✅ *(تم إلغاء الحظر)*`);
      } else {
        blacklist.push(targetGroup.id);
        toggled.push(`*${num}.* ${targetGroup.subject} 🚫 ~(تم الحظر)~`);
      }
    }
  }

  if (toggled.length === 0) {
    return m.reply(
      `❌ لا توجد أرقام مجموعات صالحة.\n\nاكتب *${m.prefix}${settingKey === "autoJpmBlacklist" ? "blautojpm" : "bljpm"}* لعرض قائمة الأرقام.`,
    );
  }

  db.setting(settingKey, blacklist);
  m.react("✅");
  return m.reply(`📢 *تم تحديث القائمة السوداء ${label}*\n\n${toggled.join("\n")}`);
}

export { pluginConfig as config, handler };