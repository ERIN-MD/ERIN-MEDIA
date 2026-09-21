import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import { saluranCtx } from "./maro-context.js";
import {
  delay,
  DisconnectReason,
  jidNormalizedUser,
  useMultiFileAuthState,
} from "maro";
import { logger } from "./maro-logger.js";
import { addJadibotOwner } from "./maro-jadibot-database.js";
import { extendSocket } from "./maro-socket.js";
import { getAssetBuffer } from "./maro-asset-manager.js";
const JADIBOT_AUTH_FOLDER = path.join(process.cwd(), "session", "jadibot");
const jadibotSessions = new Map();
const reconnectAttempts = new Map();
const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_INTERVAL = 10000;
const MAX_RETRY_DELAY = 60000;
const MAX_JADIBOT_COUNT = 5;

function toMathBold(text) {
  const map = {
    A: "𝐀", B: "𝐁", C: "𝐂", D: "𝐃", E: "𝐄", F: "𝐅", G: "𝐆", H: "𝐇",
    I: "𝐈", J: "𝐉", K: "𝐊", L: "𝐋", M: "𝐌", N: "𝐍", O: "𝐎", P: "𝐏",
    Q: "𝐐", R: "𝐑", S: "𝐒", T: "𝐓", U: "𝐔", V: "𝐕", W: "𝐖", X: "𝐗",
    Y: "𝐘", Z: "𝐙", 0: "𝟎", 1: "𝟏", 2: "𝟐", 3: "𝟑", 4: "𝟒",
    5: "𝟓", 6: "𝟔", 7: "𝟕", 8: "𝟖", 9: "𝟗",
  };
  return String(text).split("").map((char) => map[char] || char).join("");
}

function toSmallCaps(text) {
  const smallCaps = {
    a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ꜰ", g: "ɢ", h: "ʜ",
    i: "ɪ", j: "ᴊ", k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ",
    q: "ǫ", r: "ʀ", s: "s", t: "ᴛ", u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x",
    y: "ʏ", z: "ᴢ",
  };
  return String(text).toLowerCase().split("").map((char) => smallCaps[char] || char).join("");
}

if (!fs.existsSync(JADIBOT_AUTH_FOLDER)) {
  fs.mkdirSync(JADIBOT_AUTH_FOLDER, { recursive: true });
}

function getRetryDelay(attempt) {
  const delay = Math.min(INITIAL_RECONNECT_INTERVAL * Math.pow(2, attempt), MAX_RETRY_DELAY);
  return Math.floor(delay + delay * 0.25 * (Math.random() * 2 - 1));
}

setInterval(() => {
  for (const [id, session] of jadibotSessions) {
    if (!isSocketAlive(session.sock)) {
      logger.info("Jadibot", `🧹 تنظيف الجلسة غير النشطة: ${id}`);
      try {
        if (session.heartbeatInterval) clearInterval(session.heartbeatInterval);
        session.sock.ev?.removeAllListeners();
        session.sock.ws?.close();
      } catch {}
      jadibotSessions.delete(id);
      reconnectAttempts.delete(id);
    }
  }
}, 600000);

function getJadibotAuthPath(jid) {
  const id = jid.replace(/@.+/g, "");
  return path.join(JADIBOT_AUTH_FOLDER, id);
}

function isJadibotActive(jid) {
  const id = jid.replace(/@.+/g, "");
  return jadibotSessions.has(id);
}

function getActiveJadibots() {
  return Array.from(jadibotSessions.entries()).map(([id, data]) => ({
    id,
    jid: id + "@s.whatsapp.net",
    ...data,
  }));
}

function getAllJadibotSessions() {
  const sessions = [];
  if (!fs.existsSync(JADIBOT_AUTH_FOLDER)) return sessions;

  const dirs = fs.readdirSync(JADIBOT_AUTH_FOLDER);
  for (const dir of dirs) {
    const credsPath = path.join(JADIBOT_AUTH_FOLDER, dir, "creds.json");
    if (fs.existsSync(credsPath)) {
      sessions.push({
        id: dir,
        jid: dir + "@s.whatsapp.net",
        isActive: jadibotSessions.has(dir),
        credsPath,
      });
    }
  }
  return sessions;
}

function createJadibotStore() {
  return {
    messages: new Map(),
    chats: new Map(),
    contacts: {},
    bind(ev) {
      ev.on("messages.upsert", ({ messages }) => {
        for (const msg of messages || []) {
          const jid = msg.key?.remoteJid;
          if (!jid) continue;
          if (!this.messages.has(jid)) this.messages.set(jid, new Map());
          const chat = this.messages.get(jid);
          if (msg.key?.id) {
            chat.set(msg.key.id, msg);
            if (chat.size > 200) {
              const keys = [...chat.keys()];
              for (let i = 0; i < keys.length - 150; i++) chat.delete(keys[i]);
            }
          }
          if (!this.chats.has(jid)) {
            this.chats.set(jid, { id: jid });
          }
          if (msg.pushName && jid.endsWith("@s.whatsapp.net")) {
            this.contacts[jid] = {
              ...this.contacts[jid],
              notify: msg.pushName,
            };
          }
        }
      });
      ev.on("chats.upsert", (chats) => {
        for (const chat of chats || []) {
          if (chat.id) this.chats.set(chat.id, chat);
        }
      });
      ev.on("contacts.upsert", (contacts) => {
        for (const contact of contacts || []) {
          if (contact.id) {
            this.contacts[contact.id] = {
              ...this.contacts[contact.id],
              ...contact,
            };
          }
        }
      });
    },
    async loadMessage(jid, id) {
      return this.messages.get(jid)?.get(id) || undefined;
    },
  };
}

const rateLimit = new Map();

const ERROR_MESSAGES = {
  401: {
    reason: "الرقم غير مسجل في واتساب",
    action: "تأكد أن الرقم نشط في واتساب",
    fatal: true,
  },
  403: {
    reason: "تم رفض الوصول/حظر",
    action: "قد يكون الرقم محظور من واتساب",
    fatal: true,
  },
  405: {
    reason: "طريقة غير مسموحة",
    action: "حاول مرة أخرى لاحقاً",
    fatal: true,
  },
  406: {
    reason: "الرقم مقيد",
    action: "الرقم مقيد من واتساب، انتظر بضع ساعات",
    fatal: true,
  },
  408: {
    reason: "انتهاء مهلة الطلب",
    action: "الاتصال بطيء، ستتم إعادة المحاولة",
    fatal: false,
  },
  409: {
    reason: "تضارب الجلسة",
    action: "الجلسة مستخدمة في جهاز آخر",
    fatal: true,
  },
  411: {
    reason: "فشل المصادقة",
    action: "يحتاج إعادة مسح QR/اقتران",
    fatal: true,
  },
  428: {
    reason: "حد المعدل",
    action: "طلبات كثيرة جداً، انتظر بضع دقائق",
    fatal: true,
  },
  440: {
    reason: "يتطلب تسجيل الدخول",
    action: "انتهت الجلسة، يحتاج تسجيل دخول جديد",
    fatal: true,
  },
  500: {
    reason: "خطأ في سيرفر واتساب",
    action: "سيرفر واتساب يواجه مشاكل",
    fatal: false,
  },
  501: {
    reason: "غير مطبق",
    action: "الميزة غير مدعومة بعد",
    fatal: true,
  },
  503: {
    reason: "الخدمة غير متوفرة",
    action: "واتساب في الصيانة",
    fatal: false,
  },
  515: {
    reason: "خطأ في التدفق",
    action: "ستتم إعادة المحاولة",
    fatal: false,
  },
};

const CONNECTION_CLOSED_REASONS = [
  {
    match: /Connection Closed/i,
    reason: "تم إغلاق الاتصال",
    action: "قد يكون الرقم محظور أو مشكلة في الشبكة",
    fatal: true,
  },
  {
    match: /write EOF/i,
    reason: "انقطع الاتصال",
    action: "مشكلة في الشبكة، ستتم إعادة المحاولة",
    fatal: false,
  },
  {
    match: /ECONNRESET/i,
    reason: "إعادة تعيين الاتصال",
    action: "الشبكة غير مستقرة",
    fatal: false,
  },
  {
    match: /ETIMEDOUT/i,
    reason: "انتهاء الوقت",
    action: "الاتصال بطيء",
    fatal: false,
  },
  {
    match: /logged out/i,
    reason: "تم تسجيل الخروج",
    action: "تم تسجيل خروج الحساب من الجهاز",
    fatal: true,
  },
  {
    match: /replaced/i,
    reason: "تم استبدال الجلسة",
    action: "تم تسجيل الدخول في جهاز آخر",
    fatal: true,
  },
  {
    match: /Multidevice mismatch/i,
    reason: "جلسة غير صالحة",
    action: "يحتاج إعادة مسح",
    fatal: true,
  },
  {
    match: /restart required/i,
    reason: "يتطلب إعادة تشغيل",
    action: "ستتم إعادة التشغيل تلقائياً",
    fatal: false,
  },
  {
    match: /bad session/i,
    reason: "جلسة تالفة",
    action: "يحتاج إعادة مسح",
    fatal: true,
  },
];

function parseDisconnectError(lastDisconnect) {
  const statusCode = lastDisconnect?.error?.output?.statusCode;
  const errorMessage = lastDisconnect?.error?.message || "خطأ غير معروف";

  if (statusCode && ERROR_MESSAGES[statusCode]) {
    return {
      ...ERROR_MESSAGES[statusCode],
      code: statusCode,
      message: errorMessage,
    };
  }

  for (const pattern of CONNECTION_CLOSED_REASONS) {
    if (pattern.match.test(errorMessage)) {
      return {
        code: statusCode || "N/A",
        reason: pattern.reason,
        action: pattern.action,
        fatal: pattern.fatal,
        message: errorMessage,
      };
    }
  }

  return {
    code: statusCode || "N/A",
    reason: "خطأ غير معروف",
    action: "تواصل مع المسؤول إذا تكرر",
    fatal: false,
    message: errorMessage,
  };
}

function isSocketAlive(sock) {
  try {
    if (!sock) return false;
    if (sock.ws && sock.ws.readyState === 1) return true;
    if (sock.user?.id) return true;
    return false;
  } catch {
    return false;
  }
}

async function safeSend(sock, jid, content, options = {}) {
  try {
    if (!jid) return null;
    if (!isSocketAlive(sock)) return null;
    return await sock.sendMessage(jid, content, options);
  } catch {
    return null;
  }
}

async function startJadibot(sock, m, userJid, usePairing = true, isRetry = false) {
  if (
    !userJid ||
    typeof userJid !== "string" ||
    !userJid.includes("@s.whatsapp.net")
  ) {
    throw new Error("معرف مستخدم غير صالح");
  }

  const id = userJid.replace(/@.+/g, "");
  const mainBotNumber = (sock.user?.id || "").replace(/[^0-9]/g, "");

  if (mainBotNumber && id.replace(/[^0-9]/g, "") === mainBotNumber) {
    throw new Error("❌ لا يمكن استخدام نفس رقم البوت الأساسي كبوت فرعي!");
  }

  if (jadibotSessions.size >= MAX_JADIBOT_COUNT && !isRetry) {
    throw new Error(`❌ تم الوصول إلى الحد الأقصى: ${MAX_JADIBOT_COUNT} بوتات فرعية`);
  }

  if (usePairing && !isRetry) {
    const lastAttempt = rateLimit.get(id) || 0;
    if (Date.now() - lastAttempt < 60000) {
      throw new Error("انتظر دقيقة قبل المحاولة مرة أخرى.");
    }
    rateLimit.set(id, Date.now());
  }

  const authPath = getJadibotAuthPath(userJid);

  if (jadibotSessions.has(id) && !isRetry) {
    throw new Error("البوت الفرعي نشط بالفعل لهذا الرقم!");
  }

  if (isRetry) {
    const staleSession = jadibotSessions.get(id);
    try {
      if (staleSession?.heartbeatInterval) clearInterval(staleSession.heartbeatInterval);
      staleSession?.sock?.ev?.removeAllListeners();
      staleSession?.sock?.ws?.close();
    } catch {}
    jadibotSessions.delete(id);
  }

  if (!fs.existsSync(authPath)) {
    fs.mkdirSync(authPath, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(authPath);

  const {
    default: makeWASocket,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
  } = await import("maro");
  const { version } = await fetchLatestBaileysVersion();
  const pinoModule = await import("pino");
  const pinoLogger = pinoModule.default({ level: "silent" });
  const childStore = createJadibotStore();
  const groupMetadataCache = new Map();

  const childSock = makeWASocket({
    version,
    logger: pinoLogger,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pinoLogger),
    },
    browser: ["Mac OS", "safari", "140.4.1"],
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
    markOnlineOnConnect: true,
    defaultQueryTimeoutMs: 20000,
    connectTimeoutMs: 20000,
    keepAliveIntervalMs: 10000,
    retryRequestDelayMs: 150,
    getMessage: async (key) => {
      return (await childStore.loadMessage(key.remoteJid, key.id))?.message;
    },
    cachedGroupMetadata: async (jid) => {
      const cached = groupMetadataCache.get(jid);
      if (cached) return cached;
      try {
        const fresh = await childSock.groupMetadata(jid);
        groupMetadataCache.set(jid, fresh);
        return fresh;
      } catch {
        return undefined;
      }
    },
    fireInitQueries: true,
    emitOwnEvents: true,
    shouldSyncHistoryMessage: () => false,
    transactionOpts: { maxCommitRetries: 5, delayBetweenTriesMs: 500 },
  });

  childStore.bind(childSock.ev);
  childSock.store = childStore;
  await extendSocket(childSock);

  let qrCount = 0;
  let lastQRMsg = null;
  let pairingCode = null;
  let heartbeatInterval = null;

  childSock.ev.on("creds.update", saveCreds);

  childSock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr && !usePairing) {
      qrCount++;
      if (qrCount > 3) {
        await safeSend(sock, m?.chat, {
          text: "❌ انتهت صلاحية رمز QR! حاول مرة أخرى.",
        });
        if (lastQRMsg?.key) {
          await safeSend(sock, m?.chat, { delete: lastQRMsg.key });
        }
        jadibotSessions.delete(id);
        reconnectAttempts.delete(id);
        try {
          childSock.ws.close();
        } catch { }
        return;
      }

      try {
        const qrBuffer = await QRCode.toBuffer(qr, {
          scale: 8,
          margin: 4,
          width: 256,
          color: { dark: "#000000ff", light: "#ffffffff" },
        });

        if (lastQRMsg?.key) {
          await safeSend(sock, m?.chat, { delete: lastQRMsg.key });
        }

        if (!m?.chat) return;
        lastQRMsg = await sock.sendMessage(
          m.chat,
          {
            image: qrBuffer,
            caption:
              `🤖 *تنصيب — رمز QR*\n\n` +
              `امسح رمز QR هذا لتصبح بوت.\n\n` +
              `> ⏱️ ينتهي خلال 20 ثانية\n` +
              `> 📊 المحاولة: ${qrCount}/3`,
          },
          { quoted: m },
        );
      } catch (e) {
        logger.error("Jadibot", "فشل إرسال QR: " + e.message);
      }
    }

    if (connection === "open") {
      logger.info("Jadibot", `متصل: ${id}`);

      reconnectAttempts.delete(id);

      jadibotSessions.set(id, {
        sock: childSock,
        jid: childSock.user?.jid || userJid,
        startedAt: Date.now(),
        ownerJid: m?.sender || userJid,
        status: "متصل",
        connectionReady: true,
        pendingMessages: [],
      });

      heartbeatInterval = setInterval(() => {
        try {
          if (!isSocketAlive(childSock)) {
            clearInterval(heartbeatInterval);
          }
        } catch { }
      }, 30000);

      const session = jadibotSessions.get(id);
      if (session) {
        session.heartbeatInterval = heartbeatInterval;
      }

      childSock.sendPresenceUpdate("available").catch(() => { });

      addJadibotOwner(id, m?.sender || userJid);

      if (m?.chat) {
        sock
          .sendMessage(m.chat, {
            text:
              `✅ *تم اتصال البوت الفرعي*\n\n` +
              `> 📱 الرقم: *@${id}*\n` +
              `> 🟢 الحالة: *متصل*\n` +
              `> ⏱️ البداية: *${new Date().toLocaleTimeString("ar-EG")}*\n\n` +
              `البوت الخاص بك نشط وجاهز لاستقبال الأوامر!\n\n` +
              `> ℹ️ اكتب \`${m.prefix || "."}ايقاف-بوت-فرعي\` للإيقاف`,
            mentions: [userJid],
          })
          .catch((e) => {
            logger.error("Jadibot", `فشل إرسال إشعار الاتصال: ${e.message}`);
          });
      }

      if (lastQRMsg?.key && m?.chat) {
        safeSend(sock, m.chat, { delete: lastQRMsg.key }).catch(() => { });
      }
    }

    if (connection === "close") {
      const errorInfo = parseDisconnectError(lastDisconnect);

      logger.info("Jadibot", `انقطع الاتصال: ${id}, كود: ${errorInfo.code}, سبب: ${errorInfo.reason}`);

      const session = jadibotSessions.get(id);
      if (session?.heartbeatInterval) {
        clearInterval(session.heartbeatInterval);
      }

      const attempts = reconnectAttempts.get(id) || 0;

      if (errorInfo.fatal || attempts >= MAX_RECONNECT_ATTEMPTS) {
        jadibotSessions.delete(id);
        reconnectAttempts.delete(id);

        if (errorInfo.fatal) {
          try {
            if (fs.existsSync(authPath)) {
              fs.rmSync(authPath, { recursive: true, force: true });
            }
          } catch { }
        }

        let statusEmoji = "❌";
        if (errorInfo.code === 403 || errorInfo.reason?.includes("حظر")) {
          statusEmoji = "🚫";
        } else if (errorInfo.code === 406 || errorInfo.reason?.includes("مقيد")) {
          statusEmoji = "⚠️";
        }

        await safeSend(sock, m?.chat, {
          text:
            `${statusEmoji} *انقطع اتصال البوت الفرعي*\n\n` +
            `> 📱 الرقم: *@${id}*\n` +
            `> 🔢 الكود: \`${errorInfo.code}\`\n` +
            `> 📋 السبب: *${errorInfo.reason}*\n` +
            `> ℹ️ ${errorInfo.action}\n\n` +
            (errorInfo.fatal
              ? `> ⚠️ تم حذف الجلسة. استخدم \`.تنصيب\` للبدء من جديد.`
              : ""),
          mentions: [userJid],
        });
      } else {
        const nextAttempt = attempts + 1;
        const retryDelay = getRetryDelay(attempts);
        reconnectAttempts.set(id, nextAttempt);
        jadibotSessions.delete(id);

        await safeSend(sock, m?.chat, {
          text:
            `🔄 *جاري إعادة اتصال البوت الفرعي...*\n\n` +
            `> 📱 الرقم: *@${id}*\n` +
            `> 📋 السبب: *${errorInfo.reason}*\n` +
            `> 🔁 المحاولة: *${nextAttempt}/${MAX_RECONNECT_ATTEMPTS}*\n\n` +
            `> إعادة الاتصال خلال ${Math.ceil(retryDelay / 1000)} ثانية...`,
          mentions: [userJid],
        });

        setTimeout(() => {
          startJadibot(sock, m, userJid, false, true).catch((e) => {
            logger.error("Jadibot", `فشلت إعادة الاتصال لـ ${id}: ${e.message}`);
            jadibotSessions.delete(id);
            reconnectAttempts.delete(id);
          });
        }, retryDelay);
      }
    }
  });

  const processedMessages = new Map();

  childSock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (!childSock.user || !childSock.user.id) {
      childSock.user = {
        id: jidNormalizedUser(id),
        name: "بوت فرعي",
      };
    }

    if (type !== "notify" && type !== "append") return;

    for (const msg of messages) {
      if (!msg.message) continue;

      const msgId = msg.key?.id;
      if (msgId && processedMessages.has(msgId)) continue;
      if (msgId) processedMessages.set(msgId, Date.now());

      if (msg.key && msg.key.remoteJid === "status@broadcast") continue;

      const msgTimestamp = msg.messageTimestamp
        ? Number(msg.messageTimestamp) * 1000
        : Date.now();
      const msgAge = Date.now() - msgTimestamp;
      if (msgAge > 60 * 60 * 1000) continue;

      const metadataKeys = [
        "senderKeyDistributionMessage",
        "messageContextInfo",
      ];
      const msgType =
        Object.keys(msg.message).find((k) => !metadataKeys.includes(k)) ||
        Object.keys(msg.message)[0];
      const ignoredTypes = [
        "protocolMessage",
        "senderKeyDistributionMessage",
        "reactionMessage",
        "stickerSyncRmrMessage",
        "encReactionMessage",
        "pollUpdateMessage",
        "pollCreationMessage",
        "pollCreationMessageV2",
        "pollCreationMessageV3",
        "keepInChatMessage",
        "deviceSentMessage",
        "call",
        "peerDataOperationRequestMessage",
      ];
      if (ignoredTypes.includes(msgType)) continue;

      if (!isSocketAlive(childSock)) continue;

      const session = jadibotSessions.get(id);
      if (session && !session.connectionReady) {
        session.pendingMessages = session.pendingMessages || [];
        session.pendingMessages.push(msg);
        continue;
      }

      try {
        const { messageHandler } = await import("../handler.js");
        await messageHandler(msg, childSock, {
          isJadibot: true,
          jadibotId: id,
        });
      } catch (e) {
        if (
          e.message?.includes("Connection Closed") ||
          e.message?.includes("428")
        ) {
          logger.info("Jadibot", `${id} انقطع الاتصال أثناء المعالجة`);
          break;
        }
        logger.error("Jadibot", `خطأ معالج لـ ${id}: ${e.message}`);
      }
    }

    const fiveMinAgo = Date.now() - 300000;
    for (const [key, time] of processedMessages) {
      if (time < fiveMinAgo) processedMessages.delete(key);
    }
  });

  // ✨ رسالة كود الاقتران الجديدة - صورة + زر نسخ
  if (usePairing && !state.creds?.registered) {
    try {
      await delay(3000);
      pairingCode = await childSock.requestPairingCode(id);
      pairingCode = pairingCode.match(/.{1,4}/g)?.join("-") || pairingCode;

      if (m && m.chat) {
        let thumb = null;
        try {
          thumb = getAssetBuffer("maro") || getAssetBuffer("maro2");
        } catch {}

        await sock.sendMessage(
          m.chat,
          {
            image: thumb || { url: "https://iili.io/BPBdFuj.md.jpg" },
            caption: [
              `*╭━━${toMathBold("M A R O   B O T")}━━━°⃟𑁁⚡*`,
              toSmallCaps("> °⃟𑁁⚡ تنصيب بوت فرعي"),
              toSmallCaps("> °⃟𑁁⚡ تم تجهيز رمز الاقتران"),
              `*╰━━${toMathBold("P A I R I N G")}━━°⃟𑁁⚡*`,
              "",
              toSmallCaps("_1. افتح واتساب_"),
              toSmallCaps("_2. الإعدادات > الأجهزة المرتبطة_"),
              toSmallCaps("_3. اختر ربط جهاز_"),
              toSmallCaps("_4. أدخل الرمز أدناه_"),
              "",
              "```" + pairingCode + "```",
              "",
              toSmallCaps("_⏱️ الرمز صالح لعدة دقائق_"),
              toSmallCaps("_⚠️ لا تشارك هذا الرمز مع أحد_"),
            ].join("\\n"),
            mimetype: 'image/png',
            contextInfo: saluranCtx(),
            interactiveButtons: [
              {
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                  display_text: "📋 نسخ كود الربط",
                  copy_code: pairingCode.replace(/-/g, "")
                })
              }
            ]
          },
          { quoted: m }
        );
      } else {
        logger.info("Jadibot", `رمز الاقتران لـ ${id}: ${pairingCode}`);
      }
    } catch (e) {
      logger.error("Jadibot", "فشل الحصول على رمز الاقتران: " + e.message);

      let errorMsg = "فشل الحصول على رمز الاقتران";
      if (e.message?.includes("rate") || e.message?.includes("limit") || e.message?.includes("428")) {
        errorMsg = "حد المعدل! انتظر 5-10 دقائق.";
      } else if (e.message?.includes("banned") || e.message?.includes("blocked")) {
        errorMsg = "الرقم قد يكون محظور من واتساب.";
      } else if (e.message?.includes("Connection Closed") || e.message?.includes("closed")) {
        errorMsg = "انقطع الاتصال. حاول مرة أخرى.";
      }

      await safeSend(sock, m?.chat, {
        text: `❌ *فشل التنصيب*\n\n> ${errorMsg}`,
      });

      try {
        childSock.end?.();
      } catch { }
      jadibotSessions.delete(id);
      reconnectAttempts.delete(id);
      throw new Error(errorMsg);
    }
  }

  return { sock: childSock, pairingCode };
}

async function stopJadibot(jid, deleteSession = false) {
  const id = jid.replace(/@.+/g, "");
  const session = jadibotSessions.get(id);

  if (session) {
    try {
      if (session.heartbeatInterval) {
        clearInterval(session.heartbeatInterval);
      }
      session.sock.ev.removeAllListeners();
      session.sock.ws.close();
    } catch { }
    jadibotSessions.delete(id);
  }

  reconnectAttempts.delete(id);

  if (deleteSession) {
    const authPath = getJadibotAuthPath(jid);
    if (fs.existsSync(authPath)) {
      fs.rmSync(authPath, { recursive: true, force: true });
    }
  }

  return true;
}

async function stopAllJadibots() {
  const stopped = [];
  for (const [id, session] of jadibotSessions) {
    try {
      if (session.heartbeatInterval) {
        clearInterval(session.heartbeatInterval);
      }
      session.sock.ev.removeAllListeners();
      session.sock.ws.close();
    } catch { }
    stopped.push(id);
  }
  jadibotSessions.clear();
  reconnectAttempts.clear();
  return stopped;
}

async function restartJadibotSession(sock, sessionId) {
  const userJid = sessionId + "@s.whatsapp.net";
  try {
    logger.info("Jadibot", `استعادة الجلسة: ${sessionId}`);

    const dbPath = path.join(JADIBOT_AUTH_FOLDER, sessionId, "data.json");
    let ownerJid = userJid;
    try {
      if (fs.existsSync(dbPath)) {
        const data = JSON.parse(fs.readFileSync(dbPath, "utf8"));
        if (data.owners?.[0]) ownerJid = data.owners[0] + "@s.whatsapp.net";
      }
    } catch { }

    const mockM = {
      chat: ownerJid,
      sender: ownerJid,
      prefix: ".",
      key: {
        remoteJid: ownerJid,
        fromMe: false,
        id: "restart-" + Date.now(),
      },
      reply: async (text) => {
        await safeSend(sock, ownerJid, { text });
      },
      react: async () => { },
    };
    await startJadibot(sock, mockM, userJid, false);
  } catch (e) {
    logger.error("Jadibot", `فشل استعادة ${sessionId}: ${e.message}`);
  }
}

function getJadibotStatus(jid) {
  const id = jid.replace(/@.+/g, "");
  const session = jadibotSessions.get(id);
  if (!session) return null;

  return {
    id,
    jid: session.jid,
    status: session.status || "غير معروف",
    startedAt: session.startedAt,
    ownerJid: session.ownerJid,
    uptime: Date.now() - session.startedAt,
  };
}

export {
  JADIBOT_AUTH_FOLDER,
  jadibotSessions,
  getJadibotAuthPath,
  isJadibotActive,
  getActiveJadibots,
  getAllJadibotSessions,
  startJadibot,
  stopJadibot,
  stopAllJadibots,
  restartJadibotSession,
  getJadibotStatus,
  isSocketAlive,
  safeSend,
};