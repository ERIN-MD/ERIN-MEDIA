import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
} from "maro";
import { Boom } from "@hapi/boom";
import pino from "pino";
import fs from "fs";
import path from "path";
import readline from "readline";
import NodeCache from "node-cache";
import config, { isOwner as isOwners, setBotNumber } from "../config.js";
import * as colors from "./lib/maro-logger.js";
import { extendSocket } from "./lib/maro-socket.js";
import {
  isLid,
  lidToJid,
  decodeAndNormalize,
  cacheLidJid,
  resolveAnyLidToJid,
  resolveFromSock,
  isLidConverted,
} from "./lib/maro-lid.js";
import { initAutoBackup } from "./lib/maro-auto-backup.js";

const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false });
const processedMessages = new NodeCache({ stdTTL: 30, useClones: false });
const msgRetryCounterCache = new NodeCache({ stdTTL: 60, useClones: false });

let lastMessageReceived = Date.now();
let watchdogTimer = null;
const WATCHDOG_TIMEOUT = 30 * 60 * 1000;
const WATCHDOG_CHECK_INTERVAL = 60 * 1000;

// ✨ دالة مسح الجلسة وإعادة الاتصال تلقائياً عند حذف الجلسة من واتساب
async function clearSessionAndReconnect(sessionPath, startFn, options) {
  colors.logger.warn("session", "جاري مسح الجلسة وإعادة الاتصال...");
  try {
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
      colors.logger.success("session", "تم مسح الجلسة بنجاح");
    }
  } catch (e) {
    colors.logger.error("session", `فشل مسح الجلسة: ${e.message}`);
  }
  // إعادة تشغيل الاتصال بعد 3 ثواني
  setTimeout(() => startFn(options), 3000);
}

function startWatchdog(reconnectFn, options) {
  if (watchdogTimer) clearInterval(watchdogTimer);
  lastMessageReceived = Date.now();

  watchdogTimer = setInterval(() => {
    const silentMs = Date.now() - lastMessageReceived;
    if (silentMs > WATCHDOG_TIMEOUT && connectionState.isReady) {
      colors.logger.warn(
        "watchdog",
        `لم يتم اكتشاف رسائل، جاري إعادة التشغيل تلقائياً للتحديث`,
      );
      connectionState.isReady = false;
      connectionState.isConnected = false;
      try {
        connectionState.sock?.end();
      } catch {}
    }
  }, WATCHDOG_CHECK_INTERVAL);

  if (watchdogTimer.unref) watchdogTimer.unref();
  colors.logger.success(
    "watchdog",
    `نشط، الحد الأقصى ${WATCHDOG_TIMEOUT / 60000} دقيقة`,
  );
}

function stopWatchdog() {
  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }
}

const store = {
  messages: new Map(),
  chats: new Map(),
  contacts: {},
  bind(ev) {
    ev.on("messages.upsert", ({ messages: msgs }) => {
      for (const msg of msgs) {
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
        if (msg.key?.participantAlt && msg.key?.participant) {
          const alt = decodeAndNormalize(msg.key.participantAlt);
          const primary = decodeAndNormalize(msg.key.participant);
          if (alt && primary && !isLid(alt) && !isLidConverted(alt)) {
            cacheLidJid(primary, alt);
          }
        }
        if (msg.key?.remoteJidAlt && msg.key?.remoteJid) {
          const alt = decodeAndNormalize(msg.key.remoteJidAlt);
          const primary = decodeAndNormalize(msg.key.remoteJid);
          if (alt && primary && !isLid(alt) && !isLidConverted(alt)) {
            cacheLidJid(primary, alt);
          }
        }
        if (!this.chats.has(jid)) {
          this.chats.set(jid, { id: jid });
        }
        if (msg.pushName && jid.endsWith("@s.whatsapp.net")) {
          this.contacts[jid] = { ...this.contacts[jid], notify: msg.pushName };
        }
      }
    });
    ev.on("chats.upsert", (chats) => {
      for (const chat of chats) {
        if (chat.id) this.chats.set(chat.id, chat);
      }
    });
    ev.on("contacts.upsert", (contacts) => {
      for (const contact of contacts) {
        if (contact.id)
          this.contacts[contact.id] = {
            ...this.contacts[contact.id],
            ...contact,
          };
      }
    });
  },
  async loadMessage(jid, id) {
    return this.messages.get(jid)?.get(id) || undefined;
  },
};

/**
 * @typedef {Object} ConnectionState
 * @property {boolean} isConnected - Status koneksi
 * @property {Object|null} sock - Socket instance
 * @property {number} reconnectAttempts - Jumlah percobaan reconnect
 * @property {Date|null} connectedAt - Waktu koneksi berhasil
 */

/**
 * State koneksi global
 * @type {ConnectionState}
 */
const connectionState = {
  isConnected: false,
  isReady: false,
  sock: null,
  reconnectAttempts: 0,
  connectedAt: null,
};

/**
 * Logger instance dengan level minimal
 * @type {Object}
 */
const logger = pino({
  level: "silent",
  hooks: {
    logMethod(inputArgs, method) {
      const msg = inputArgs[0];
      if (
        typeof msg === "string" &&
        (msg.includes("Closing") ||
          msg.includes("session") ||
          msg.includes("SessionEntry") ||
          msg.includes("prekey"))
      ) {
        return;
      }
      return method.apply(this, inputArgs);
    },
  },
});

/**
 * Interface untuk input terminal
 * @type {readline.Interface|null}
 */
let rl = null;

/**
 * Membuat readline interface
 * @returns {readline.Interface}
 */
function createReadlineInterface() {
  if (rl) {
    rl.close();
  }
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return rl;
}

/**
 * Prompt untuk input
 * @param {string} question - Pertanyaan
 * @returns {Promise<string>} Input dari user
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    const rlIntf = createReadlineInterface();
    rlIntf.question(question, (answer) => {
      rlIntf.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Memulai koneksi WhatsApp
 * @param {Object} options - Opsi koneksi
 * @param {Function} [options.onMessage] - Callback untuk pesan baru
 * @param {Function} [options.onConnectionUpdate] - Callback untuk update koneksi
 * @param {Function} [options.onGroupUpdate] - Callback untuk update group
 * @returns {Promise<Object>} Socket connection
 * @example
 * const sock = await startConnection({
 *   onMessage: async (m) => {
 *     console.log('New message:', m.body);
 *   }
 * });
 */
async function startConnection(options = {}) {
  if (connectionState.sock) {
    try {
      connectionState.sock.end();
      colors.logger.debug("whatsapp", "تم إغلاق الاتصال السابق");
    } catch (e) {}
    connectionState.sock = null;
  }

  const sessionPath = path.join(
    process.cwd(),
    "storage",
    config.session?.folderName || "session",
  );

  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  const { version, isLatest } = await fetchLatestBaileysVersion();

  const usePairingCode = config.session?.usePairingCode === true;
  const pairingNumber = config.session?.pairingNumber || "";

  const sock = makeWASocket({
    version: version,
    logger,
    printQRInTerminal:
      !usePairingCode && (config.session?.printQRInTerminal ?? true),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    browser: ["Ubuntu", "Chrome", "20.0.0"],
    syncFullHistory: false,
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: false,
    shouldIgnoreJid: (jid) => (jid ? jid.includes("meta_ai") : false),
    getMessage: async (key) => {
      if (store) {
        const msg = store.messages.get(key.remoteJid)?.get(key.id);
        return msg?.message || undefined;
      }
      return undefined;
    },
    cachedGroupMetadata: async (jid) => {
      const cached = groupCache.get(jid);
      if (cached) return cached;
      try {
        const fresh = await sock.groupMetadata(jid);
        groupCache.set(jid, fresh);
        return fresh;
      } catch {
        return undefined;
      }
    },
    msgRetryCounterCache,
  });

  store.bind(sock.ev);
  sock.store = store;

  // ── تتبّع الإرسال (اختياري) ────────────────────────────────────
  // شغّله بـ MAROBOT_TRACE_SEND=true عندما "لا يرد البوت" رغم أن السجل
  // يُظهر وصول الرسائل: يطبع لكل إرسال الوجهة والنوع والنتيجة أو الخطأ،
  // فيفصل بوضوح بين "لم يُنتج رداً" و"أنتجه ولم يُسلَّم".
  if (process.env.MAROBOT_TRACE_SEND === "true") {
    const _origSendMessage = sock.sendMessage.bind(sock);
    let _seq = 0;
    sock.sendMessage = async (jid, content, options) => {
      const id = ++_seq;
      const kind = content && typeof content === "object" ? Object.keys(content).join("+") : typeof content;
      const preview = String(content?.text ?? content?.caption ?? "").replace(/\s+/g, " ").slice(0, 70);
      colors.logger.info("send", `#${id} -> ${jid} [${kind}] "${preview}"`);
      try {
        const result = await _origSendMessage(jid, content, options);
        colors.logger.success(
          "send",
          `#${id} accepted by WhatsApp · id=${result?.key?.id || "?"} · to=${result?.key?.remoteJid || "?"}`,
        );
        return result;
      } catch (error) {
        colors.logger.error("send", `#${id} FAILED -> ${jid}: ${error?.message || error}`);
        throw error;
      }
    };
    colors.logger.warn("send", "تتبّع الإرسال مُفعّل (MAROBOT_TRACE_SEND=true)");
  }

  connectionState.sock = sock;
  extendSocket(sock);

  if (usePairingCode && !sock.authState.creds.registered) {
    let phoneNumber = pairingNumber;

    if (!phoneNumber || phoneNumber === "") {
      console.log("");
      colors.logger.warn("pairing", "رقم الاقتران غير مضبوط في الإعدادات");
      console.log("");
      phoneNumber = await askQuestion(
        colors.chalk.cyan(
          "📱 أدخل رقم واتساب (مثال: 201234567890): ",
        ),
      );
    }

    phoneNumber = phoneNumber.replace(/[^0-9]/g, "");

    colors.logger.info("pairing", `طلب رمز لـ ${phoneNumber}`);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const code = await sock.requestPairingCode(phoneNumber, "MAROOBOT");
      console.log("");
      console.log(
        colors.createBanner(
          [
            "",
            "   رمز الاقتران   ",
            "",
            `   ${colors.chalk.bold(colors.chalk.greenBright(code))}   `,
            "",
            "  أدخل هذا الرمز في واتساب  ",
            "  الإعدادات > الأجهزة المرتبطة > ربط جهاز  ",
            "",
          ],
          "green",
        ),
      );
      console.log("");
    } catch (error) {
      colors.logger.error("pairing", `فشل: ${error.message}`);
    }
  }

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (u) => {
    const { connection: c, lastDisconnect: d, qr: q } = u;

    if (q && !usePairingCode) {
      colors.logger.info("qr", "رمز QR جاهز، امسحه ضوئياً");
      const { default: qrcode } = await import("qrcode");
      qrcode.toString(q, { type: "terminal", small: true }, (err, qrText) => {
        if (!err) console.log(qrText);
      });
    }

    const S = {
      C: "close",
      O: "open",
      N: "@newsletter",
    };

    if (c === S.C) {
      connectionState.isConnected = false;
      connectionState.isReady = false;
      stopWatchdog();

      const r =
        d?.error instanceof Boom
          ? d.error.output?.statusCode !== DisconnectReason.loggedOut
          : true;

      const sc = d?.error?.output?.statusCode;

      const STATUS_MESSAGES = {
        400: "⚠️ طلب غير صالح - جرب إعادة التشغيل",
        401: "🔐 غير مصرح - الجلسة منتهية",
        403: "🚫 ممنوع - تم رفض الوصول",
        404: "❓ غير موجود",
        405: "🚧 الطريقة غير مسموحة",
        408: "⏱️ انتهاء الوقت - تحقق من الإنترنت",
        410: "📛 منتهي - تم حذف الجلسة",
        428: "🔄 يتطلب الاتصال",
        440: "⚡ تضارب الجلسة",
        500: "💥 خطأ في سيرفر واتساب",
        501: "📦 غير مطبق",
        502: "🌐 خطأ في البوابة",
        503: "🔧 الخدمة غير متوفرة",
        504: "🕐 انتهاء وقت البوابة",
        515: "🔁 يتطلب إعادة التشغيل",
      };

      const statusMsg = STATUS_MESSAGES[sc] || `❔ غير معروف (كود: ${sc})`;
      colors.logger.warn("whatsapp", `انقطع الاتصال — ${statusMsg}`);
      
      // ✨ إذا تم حذف الجلسة من واتساب - امسح الجلسة وأعد الاتصال
      if (sc === DisconnectReason.loggedOut || sc === 401) {
        colors.logger.error(
          "whatsapp",
          "تم حذف الجلسة من واتساب - جاري مسح الجلسة وإعادة الاتصال...",
        );
        connectionState.reconnectAttempts = 0;
        await clearSessionAndReconnect(sessionPath, startConnection, options);
        return;
      }

      if (sc === 440) {
        connectionState.reconnectAttempts++;
        if (connectionState.reconnectAttempts <= 3) {
          colors.logger.info(
            "whatsapp",
            `محاولة إعادة اتصال ${connectionState.reconnectAttempts}/3 خلال 10 ثوان`,
          );
          setTimeout(() => startConnection(options), 10000);
        } else {
          colors.logger.error(
            "whatsapp",
            "تضارب الجلسة - جهاز آخر متصل، أوقف البوت الآخر",
          );
          connectionState.reconnectAttempts = 0;
        }
        return;
      }

      if (r) {
        connectionState.reconnectAttempts++;
        const m = config.session?.maxReconnectAttempts || 5;
        if (connectionState.reconnectAttempts <= m) {
          colors.logger.info(
            "whatsapp",
            `محاولة إعادة اتصال ${connectionState.reconnectAttempts}/${m}`,
          );
          setTimeout(
            () => startConnection(options),
            config.session?.reconnectInterval || 15000,
          );
        } else {
          colors.logger.error(
            "whatsapp",
            `فشل إعادة الاتصال بعد ${m} محاولات`,
          );
        }
      } else {
        connectionState.reconnectAttempts = 0;
      }
    }

    if (c === S.O) {
      connectionState.isConnected = true;
      connectionState.isReady = true;
      connectionState.reconnectAttempts = 0;
      connectionState.connectedAt = new Date();

      try {
        await sock.uploadPreKeys();
        colors.logger.success("session", "تم رفع مفاتيح التشفير بنجاح");
      } catch (e) {
        colors.logger.warn("session", `فشل رفع مفاتيح التشفير: ${e.message}`);
      }

      const n = sock.user?.id?.split(":")[0] || sock.user?.id?.split("@")[0];

      n && setBotNumber(n);

      colors.logger.info(
        "bot",
        `${config.bot?.name || "Maro-AI"} (${n || "?"}) · WA v${version.join(".")}`,
      );

      setTimeout(async () => {
        try {
          const { reloadAllPlugins: R, getPluginCount: G } =
            await import("./lib/maro-plugins.js");
          !G() && (await R());
        } catch {}
      }, 100);

      startWatchdog(startConnection, options);

      // ⚠️ أمان: كانت هنا كتلة صامتة تتابع 7 قنوات وتنضم لمجموعتين مثبّتة في
      // الكود بعد 8 ثوانٍ من أول اتصال، وتبتلع كل الأخطاء بلا تسجيل.
      // أصبحت الآن معطّلة افتراضياً، مقروءة من config.autoJoin، ومسجَّلة بالكامل.
      const autoActionFlag = path.join(
        process.cwd(),
        "storage",
        ".auto_action_done",
      );
      const { NL, GI, AUTO_JOIN_ENABLED } = await import("./lib/maro-channels.js");
      if (AUTO_JOIN_ENABLED && (NL.length || GI.length) && !fs.existsSync(autoActionFlag)) {
        colors.logger.info(
          "autojoin",
          `المتابعة التلقائية مفعّلة: ${NL.length} قناة و ${GI.length} دعوة مجموعة`,
        );
        setTimeout(async () => {
          try {
            let nlSuccess = 0;
            let giSuccess = 0;
            for (const i of NL) {
              try {
                await Promise.race([
                  sock.newsletterFollow(i + S.N),
                  new Promise((_, t) =>
                    setTimeout(() => t(new Error("timeout")), 8000),
                  ),
                ]);
                nlSuccess++;
                colors.logger.success("autojoin", `تمت متابعة القناة ${i}`);
                await new Promise((r) => setTimeout(r, 1500));
              } catch (e) {
                colors.logger.warn("autojoin", `تعذرت متابعة ${i}: ${e.message}`);
              }
            }
            for (const g of GI) {
              try {
                await Promise.race([
                  sock.groupAcceptInvite(g),
                  new Promise((_, t) =>
                    setTimeout(() => t(new Error("timeout")), 8000),
                  ),
                ]);
                giSuccess++;
                colors.logger.success("autojoin", `تم الانضمام للمجموعة ${g}`);
                await new Promise((r) => setTimeout(r, 1500));
              } catch (e) {
                colors.logger.warn("autojoin", `تعذر الانضمام إلى ${g}: ${e.message}`);
              }
            }
            const storageDir = path.join(process.cwd(), "storage");
            if (!fs.existsSync(storageDir))
              fs.mkdirSync(storageDir, { recursive: true });
            fs.writeFileSync(autoActionFlag, Date.now().toString());
            colors.logger.info(
              "autojoin",
              `اكتملت: ${nlSuccess}/${NL.length} قناة · ${giSuccess}/${GI.length} مجموعة`,
            );
          } catch (e) {
            colors.logger.error("autojoin", e.message);
          }
        }, 8000);
      }

      colors.logger.success("whatsapp", "جاهز لاستقبال الرسائل");
      try {
        initAutoBackup(sock);
      } catch (e) {
        colors.logger.debug("backup", "تم التخطي: " + e.message);
      }
      try {
        const { startGiveawayChecker } =
          await import("../plugins/group/giveaways.js");
        const db = (await import("./lib/maro-database.js")).getDatabase();
        startGiveawayChecker(sock, db);
      } catch (e) {
        colors.logger.debug("giveaway", "تم التخطي: " + e.message);
      }
      try {
        const { startAutoBioChecker } = await import("./lib/maro-scheduler.js");
        startAutoBioChecker(sock);
      } catch (e) {
        colors.logger.debug("autobio", "تم التخطي: " + e.message);
      }
    }

    options.onConnectionUpdate && (await options.onConnectionUpdate(u, sock));
  });

  const _groupEventQueue = [];
  let _groupEventProcessing = false;
  const _connectedAt = Date.now();

  async function _processGroupQueue() {
    if (_groupEventProcessing || _groupEventQueue.length === 0) return;
    _groupEventProcessing = true;
    while (_groupEventQueue.length > 0) {
      const { handler: fn, args } = _groupEventQueue.shift();
      try {
        await fn(...args);
      } catch (e) {
        if (
          e?.message?.includes("rate-overlimit") ||
          e?.output?.statusCode === 429
        ) {
          colors.logger.warn("rate-limit", "تم التحديد، انتظار 5 ثوان...");
          await new Promise((r) => setTimeout(r, 5000));
          try {
            await fn(...args);
          } catch {}
        }
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    _groupEventProcessing = false;
  }

  sock.ev.on("groups.update", async ([event]) => {
    if (options.onGroupUpdate) {
      _groupEventQueue.push({
        handler: async (ev, s) => {
          try {
            const m = await s.groupMetadata(ev.id);
            groupCache.set(ev.id, m);
          } catch {}
          await options.onGroupUpdate(ev, s);
        },
        args: [event, sock],
      });
      _processGroupQueue();
    }
  });

  sock.ev.on("group-participants.update", async (event) => {
    if (Date.now() - _connectedAt < 15000) return;
    let metadata = groupCache.get(event.id);
    if (!metadata) {
      try {
        metadata = await sock.groupMetadata(event.id);
        groupCache.set(event.id, metadata);
      } catch {}
    }

    const botNumber =
      sock.user?.id?.split(":")[0] || sock.user?.id?.split("@")[0];
    const botLid = sock.user?.id;
    if (event.action === "add") {
      await sock.sendPresenceUpdate("available", event.id);
      const addedParticipants = event.participants || [];
      const isBotAdded = addedParticipants.some((p) => {
        const rJid =
          typeof p === "object" && p !== null ? p.phoneNumber || p.id : p;
        if (typeof rJid !== "string") return false;

        const pNum = rJid.split("@")[0].split(":")[0];
        const isNumberMatch = pNum === botNumber;
        const isLidMatch = rJid === botLid || rJid.includes(botNumber);
        const isFullMatch =
          sock.user?.id &&
          (rJid.includes(sock.user.id.split(":")[0]) ||
            rJid.includes(sock.user.id.split("@")[0]));

        return isNumberMatch || isLidMatch || isFullMatch;
      });
      if (isBotAdded) {
        try {
          const { getDatabase } = await import("./lib/maro-database.js");
          const db = getDatabase();

          try {
            const { handleAntiCulik } =
              await import("../plugins/group/منع_الخطف.js");
            const culikHandled = await handleAntiCulik(event, sock, db);
            if (culikHandled) return;
          } catch {}

          const sewaData = db?.db?.data?.sewa;

          if (sewaData?.enabled) {
            const groupSewa = sewaData.groups?.[event.id];
            const isWhitelisted =
              groupSewa &&
              (groupSewa.isLifetime || groupSewa.expiredAt > Date.now());

            if (!isWhitelisted) {
              const ownerContact =
                config.bot?.support || config.bot?.developer || "owner";
              await sock.sendMessage(event.id, {
                text:
                  `⛔ *sᴇᴡᴀʙᴏᴛ*\n\n` +
                  `> Grup ini tidak terdaftar dalam sistem sewa.\n` +
                  `> Bot akan meninggalkan grup ini.\n\n` +
                  `_Hubungi ${ownerContact} untuk sewa bot._`,
              });
              await new Promise((r) => setTimeout(r, 2000));
              await sock.groupLeave(event.id);
              colors.logger.warn(
                "sewa",
                `auto-left non-whitelisted group: ${event.id}`,
              );
              return;
            }
          }

          const inviter = event.author || "";
          const inviterMention = inviter
            ? `@${inviter.split("@")[0]}`
            : "seseorang";
          const prefix = config.command?.prefix || ".";

          let groupName = "grup ini";
          try {
            const meta = await sock.groupMetadata(event.id);
            groupName = meta.subject || "grup ini";
          } catch {}

          const saluranId =
            config.saluran?.id || "120363400911374213@newsletter";
          const saluranName =
            config.saluran?.name || config.bot?.name || "Maro-AI";

          const welcomeText =
            `👋 *ʜᴀɪ, sᴀʟᴀᴍ ᴋᴇɴᴀʟ!*\n\n` +
            `Aku *${config.bot?.name || "Maro-AI"}* 🤖\n\n` +
            `Terima kasih sudah mengundang aku ke *${groupName}*!\n` +
            `Aku diundang oleh ${inviterMention} ✨\n\n` +
            `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n` +
            `┃ 🔧 Developer: *${config.bot?.developer || "Mabrok Gmal"}*\n` +
            `┃ 📢 Prefix: \`${prefix}\`\n` +
            `┃ 📩 Support: ${config.bot?.support || "-"}\n` +
            `╰┈┈⬡\n\n` +
            `> Ketik \`${prefix}menu\` untuk melihat daftar fitur\n` +
            `> Ketik \`${prefix}help\` untuk bantuan`;

          await sock.sendMessage(event.id, {
            text: welcomeText,
            contextInfo: {
              mentionedJid: inviter ? [inviter] : [],
              forwardingScore: 9999,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: saluranId,
                newsletterName: saluranName,
                serverMessageId: 127,
              },
            },
          });

          colors.logger.success("grup", `bot bergabung: ${groupName}`);
        } catch (e) {
          colors.logger.error(
            "BotJoin",
            `Failed to process bot join: ${e.message}`,
          );
        }
      }
    }

    if (options.onParticipantsUpdate) {
      await options.onParticipantsUpdate(event, sock);
    }
  });

  sock.ev.on("chats.upsert", async (chats) => {
    for (const chat of chats) {
      const chatId = chat?.id;
      if (!chatId) continue;

      if (chatId.endsWith("@g.us")) {
        if (!global.groupMetadataCache) {
          global.groupMetadataCache = new Map();
        }

        const now = Date.now();
        if (global.groupMetadataCache.size > 100) {
          for (const [k, v] of global.groupMetadataCache) {
            if (now - v.timestamp > 10 * 60 * 1000)
              global.groupMetadataCache.delete(k);
          }
        }

        if (!global.groupMetadataCache.has(chatId)) {
          sock
            .groupMetadata(chatId)
            .then((metadata) => {
              if (metadata) {
                global.groupMetadataCache.set(chatId, {
                  data: metadata,
                  timestamp: now,
                });
              }
            })
            .catch(() => {});
        }
      }
    }
  });

  sock.ev.on("contacts.upsert", () => {});

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    lastMessageReceived = Date.now();
    if (config.dev?.debugLog) {
      colors.logger.debug("pesan", `${messages.length} pesan, tipe=${type}`);
    }
    if (type !== "notify" && type !== "append") return;

    if (!connectionState.isReady) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (!connectionState.isReady) return;
    }

    const currentSock = connectionState.sock;
    if (!currentSock) return;

    for (const msg of messages) {
      const stubType = msg.messageStubType;
      const groupJid = msg.key?.remoteJid;

      if (!msg.message && (stubType === 1 || stubType === 132)) {
        if (options.onStubMessage) {
          options.onStubMessage(msg, currentSock).catch(() => {});
        }
        continue;
      }

      if (!msg.message) continue;

      const msgId = msg.key?.id;
      if (msgId && processedMessages.has(msgId)) continue;
      if (msgId) processedMessages.set(msgId, true);

      let msgTimestamp = 0;
      if (msg.messageTimestamp) {
        if (typeof msg.messageTimestamp.toNumber === "function") {
          msgTimestamp = msg.messageTimestamp.toNumber() * 1000;
        } else {
          msgTimestamp = Number(msg.messageTimestamp) * 1000;
        }
      }

      const msgAge = Date.now() - msgTimestamp;
      if (msgAge > 5 * 60 * 1000) {
        continue;
      }

      const metadataKeys = [
        "senderKeyDistributionMessage",
        "messageContextInfo",
      ];
      const msgType =
        Object.keys(msg.message).find((k) => !metadataKeys.includes(k)) ||
        Object.keys(msg.message)[0];
      const hasInteractiveResponse = msg.message.interactiveResponseMessage;

      if (msgType === "protocolMessage") {
        const protocolMessage = msg.message.protocolMessage;
        if (protocolMessage?.type === 30 && protocolMessage?.memberLabel) {
          try {
            const { handleLabelChange } =
              await import("../plugins/group/اشعار_تغيير_الوسم.js");
            if (handleLabelChange) {
              await handleLabelChange(msg, currentSock);
            }
          } catch (e) {}
        }

        if (
          protocolMessage?.type === "MESSAGE_EDIT" ||
          protocolMessage?.type === 14
        ) {
          const edited = protocolMessage.editedMessage;
          if (edited) {
            const originalKey = protocolMessage.key || msg.key;
            const syntheticMsg = {
              key: {
                remoteJid: originalKey.remoteJid || msg.key.remoteJid,
                fromMe: msg.key.fromMe,
                id: originalKey.id,
                participant: msg.key.participant,
              },
              message: edited,
              messageTimestamp: Math.floor(Date.now() / 1000),
              pushName: msg.pushName || "User",
            };

            if (options.onMessage) {
              await options.onMessage(syntheticMsg, currentSock);
            }
          }
        }

        continue;
      }

      const allMsgKeys = Object.keys(msg.message || {});

      const isStatusMention =
        allMsgKeys.includes("groupStatusMessage") ||
        allMsgKeys.includes("groupStatusMessageV2") ||
        allMsgKeys.includes("groupStatusMentionMessage") ||
        allMsgKeys.includes("groupMentionedMessage") ||
        allMsgKeys.includes("statusMentionMessage") ||
        msg.message?.viewOnceMessage?.message?.groupStatusMessage ||
        msg.message?.viewOnceMessage?.message?.groupStatusMessageV2 ||
        msg.message?.viewOnceMessageV2?.message?.groupStatusMessage ||
        msg.message?.viewOnceMessageV2?.message?.groupStatusMessageV2 ||
        msg.message?.viewOnceMessageV2Extension?.message?.groupStatusMessage ||
        msg.message?.viewOnceMessageV2Extension?.message
          ?.groupStatusMessageV2 ||
        msg.message?.ephemeralMessage?.message?.groupStatusMessage ||
        msg.message?.ephemeralMessage?.message?.groupStatusMessageV2 ||
        msg.message?.viewOnceMessage?.message?.groupStatusMentionMessage ||
        msg.message?.viewOnceMessageV2?.message?.groupStatusMentionMessage ||
        msg.message?.viewOnceMessageV2Extension?.message
          ?.groupStatusMentionMessage ||
        msg.message?.ephemeralMessage?.message?.groupStatusMentionMessage ||
        msg.message?.[msgType]?.message?.groupStatusMessage ||
        msg.message?.[msgType]?.message?.groupStatusMessageV2 ||
        msg.message?.[msgType]?.message?.groupStatusMentionMessage ||
        msg.message?.[msgType]?.contextInfo?.groupMentions?.length > 0;

      const hasGroupMentionInContext = (() => {
        const content = msg.message?.[msgType];
        if (content?.contextInfo?.groupMentions?.length > 0) return true;

        const viewOnce =
          msg.message?.viewOnceMessage?.message ||
          msg.message?.viewOnceMessageV2?.message ||
          msg.message?.viewOnceMessageV2Extension?.message;
        if (viewOnce) {
          const vType = Object.keys(viewOnce)[0];
          if (viewOnce[vType]?.contextInfo?.groupMentions?.length > 0)
            return true;
        }
        return false;
      })();

      if (isStatusMention || hasGroupMentionInContext) {
        const groupJid = msg.key.remoteJid;

        try {
          const { getDatabase } = await import("./lib/maro-database.js");
          const { handleAntiTagSW, handleAntiSwGc } =
            await import("./lib/maro-group-protection.js");
          const db = getDatabase();
          if (groupJid?.endsWith("@g.us")) {
            const antiTagHandled = await handleAntiTagSW(msg, currentSock, db);
            if (!antiTagHandled) {
              await handleAntiSwGc(msg, currentSock, db);
            }
          }
        } catch (e) {
          colors.logger.error("antitagsw", e.message);
        }
      }

      const ignoredTypes = [
        "protocolMessage",
        "reactionMessage",
        "senderKeyDistributionMessage",
        "stickerSyncRmrMessage",
        "encReactionMessage",
        "pollUpdateMessage",
        "pollCreationMessage",
        "pollCreationMessageV2",
        "pollCreationMessageV3",
        "keepInChatMessage",
        "requestPhoneNumberMessage",
        "pinInChatMessage",
        "deviceSentMessage",
        "call",
        "peerDataOperationRequestMessage",
        "bcallMessage",
      ];
      if (ignoredTypes.includes(msgType) && !hasInteractiveResponse) {
        continue;
      }

      let jid = msg.key.remoteJid || "";

      if (msg.key.fromMe && type === "append" && jid !== "status@broadcast") {
        continue;
      }

      if (jid === "status@broadcast") {
        try {
          let participant = msg.key.participant || "";
          if (isLid(participant)) {
            participant = lidToJid(participant) || participant;
            msg.key.participant = participant;
          }

          const { getDatabase } = await import("./lib/maro-database.js");
          const db = getDatabase();
          const autoReadSW = db.setting("autoReadSW") || {};
          const autoReactSW = db.setting("autoReactSW") || {};
          if (
            autoReadSW.enabled &&
            participant &&
            !participant.endsWith("@lid")
          ) {
            await currentSock
              .sendReceipt(
                "status@broadcast",
                participant,
                [msg.key.id],
                "read",
              )
              .catch(() => {});
          }

          if (
            autoReactSW.enabled &&
            participant &&
            !participant.endsWith("@lid")
          ) {
            const emoji = autoReactSW.emoji || "🔥";
            await currentSock
              .sendMessage(
                "status@broadcast",
                {
                  react: { text: emoji, key: msg.key },
                },
                {
                  statusJidList: [participant],
                },
              )
              .catch(() => {});
          }
        } catch (e) {
          colors.logger.debug("story", `auto story error: ${e.message}`);
        }
        continue;
      }

      if (isLid(jid)) {
        const resolved = await resolveFromSock(jid, currentSock);
        if (resolved && !isLid(resolved) && !isLidConverted(resolved)) {
           jid = resolved;
           msg.key.remoteJid = jid;
        }
      }

      if (msg.key.participant && isLid(msg.key.participant)) {
        const resolvedPart = await resolveFromSock(msg.key.participant, currentSock);
        if (resolvedPart && !isLid(resolvedPart) && !isLidConverted(resolvedPart)) {
           msg.key.participant = resolvedPart;
        }
      }
      if (jid.endsWith("@broadcast")) {
        continue;
      }
      if (!jid || jid === "undefined" || jid.length < 5) {
        continue;
      }
      if (options.onRawMessage) {
        try {
          await options.onRawMessage(msg, currentSock);
        } catch (error) {}
      }

      const messageBody = (() => {
        const m = msg.message;
        if (!m) return "";
        const type = Object.keys(m)[0];
        const content = m[type];
        if (typeof content === "string") return content;
        return content?.text || content?.caption || content?.conversation || "";
      })();

      const isGroup = msg.key.remoteJid?.endsWith("@g.us");
      const senderJid = isGroup
        ? msg.key.participantAlt || msg.key.participant
        : msg.key.remoteJidAlt || msg.key.remoteJid || "";
      const isOwner = isOwners(senderJid);
      if (isOwner && config.devConsole?.enabled && messageBody.startsWith("=>")) {
        console.log("Owner", "Executing code");
        const code = messageBody.slice(2).trim();
        if (code) {
          try {
            const { serialize } = await import("./lib/maro-serialize.js");
            const m = await serialize(currentSock, msg, {});
            const { getDatabase: _getDb } =
              await import("./lib/maro-database.js");
            const db = _getDb();
            const sock = currentSock;
            let sharp = null;
            try {
              const mod = await import("sharp");
              sharp = mod.default;
            } catch (e) {
              console.log("Sharp not available in this environment, skipping.");
            }

            let result;
            if (code.startsWith("{")) {
              result = await eval(`(async () => ${code})()`);
            } else {
              result = await eval(`(async () => { return ${code} })()`);
            }

            if (typeof result !== "string") {
              const { inspect } = await import("util");
              result = inspect(result, { depth: 2 });
            }
          } catch (err) {
            await currentSock.sendMessage(
              jid,
              {
                text: `❌ *ᴇᴠᴀʟ ᴇʀʀᴏʀ*\n\n\`\`\`\n${err.message}\n\`\`\``,
              },
              { quoted: msg },
            );
          }
          continue;
        }
      }

      if (isOwner && config.devConsole?.allowShell && messageBody.startsWith("$")) {
        const command = messageBody.slice(1).trim();
        if (command) {
          try {
            const { exec } = await import("child_process");
            const { promisify } = await import("util");
            const execAsync = promisify(exec);

            const isWindows = process.platform === "win32";
            const shell = isWindows ? "powershell.exe" : "/bin/bash";

            await currentSock.sendMessage(
              jid,
              {
                text: `🕕 *ᴇxᴇᴄᴜᴛɪɴɢ...*\n\n\`$ ${command}\``,
              },
              { quoted: msg },
            );

            const { stdout, stderr } = await execAsync(command, {
              shell,
              timeout: 60000,
              maxBuffer: 1024 * 1024,
              encoding: "utf8",
            });

            const output = stdout || stderr || "No output";

            await currentSock.sendMessage(jid, {
              text: `✅ *ᴛᴇʀᴍɪɴᴀʟ*\n\n\`$ ${command}\`\n\n\`\`\`\n${output.slice(0, 3500)}\n\`\`\``,
            });
          } catch (err) {
            const errorMsg = err.stderr || err.stdout || err.message;
            await currentSock.sendMessage(jid, {
              text: `❌ *ᴛᴇʀᴍɪɴᴀʟ ᴇʀʀᴏʀ*\n\n\`$ ${command}\`\n\n\`\`\`\n${errorMsg.slice(0, 3500)}\n\`\`\``,
            });
          }
          continue;
        }
      }

      if (options.onMessage) {
        options.onMessage(msg, currentSock).catch((error) => {
          colors.logger.error("Message", error.message);
        });
      }
    }
  });

  sock.ev.on("group-participants.update", async (update) => {
    if (options.onGroupUpdate) {
      _groupEventQueue.push({
        handler: options.onGroupUpdate,
        args: [update, sock],
      });
      _processGroupQueue();
    }
  });

  sock.ev.on("groups.update", async (updates) => {
    for (const update of updates) {
      if (options.onGroupSettingsUpdate) {
        try {
          await options.onGroupSettingsUpdate(update, sock);
        } catch (error) {
          console.error("[GroupsUpdate] Error:", error.message);
        }
      }
    }
  });

  sock.ev.on("messages.update", async (updates) => {
    if (options.onMessageUpdate) {
      await options.onMessageUpdate(updates, sock);
    }
  });

  {
    const { getDatabase: _getDb } = await import("./lib/maro-database.js");
    const _db = _getDb();
    if (_db.setting("antiCall") ?? config.features?.antiCall) {
      sock.ev.on("call", async (calls) => {
        for (const call of calls) {
          if (call.status === "offer") {
            colors.logger.warn("Call", `رفض مكالمة من ${call.from}`);
            await sock.rejectCall(call.id, call.from);

            await sock.sendMessage(call.from, {
              text: config.messages?.rejectCall,
            });

            if (config.features?.blockIfCall) {
              let targetJid = call.from;

              if (targetJid.endsWith("@lid")) {
                try {
                  const pn =
                    await sock.signalRepository?.lidMapping?.getPNForLID(
                      targetJid,
                    );
                  if (pn) {
                    targetJid = pn;
                    colors.logger.info(
                      "Call",
                      `Berhasil resolve @lid ke PN: ${targetJid}`,
                    );
                  }
                } catch (e) {
                  colors.logger.warn(
                    "Call",
                    `Gagal resolve LID ke PN: ${e.message}`,
                  );
                }
              }

              if (!targetJid.endsWith("@lid")) {
                try {
                  const sanitizedJid = targetJid.replace(/:\d+@/, "@");
                  await _db.setUser(sanitizedJid, { isBlocked: true });

                  try {
                    await sock.updateBlockStatus(
                      sanitizedJid.split("@")[0],
                      "block",
                    );
                    colors.logger.info(
                      "Call",
                      `Berhasil memblokir penelpon di WA & Bot: ${sanitizedJid}`,
                    );
                  } catch (waErr) {
                    colors.logger.warn(
                      "Call",
                      `Diblokir di DB Bot, tapi gagal di WA Server (${sanitizedJid}): ${waErr.message}`,
                    );
                  }
                } catch (e) {
                  colors.logger.error(
                    "Call",
                    `Gagal memblokir di DB: ${e.message}`,
                  );
                }
              } else {
                colors.logger.warn(
                  "Call",
                  `Melewati blokir karena gagal mendapatkan nomor asli dari @lid: ${targetJid}`,
                );
              }
            }
          }
        }
      });
    }
  }

  process.nextTick(() => {
    try {
      sock.ev?.flush?.();
    } catch {}
  });

  setTimeout(() => {
    try {
      sock.ev?.flush?.();
    } catch {}
  }, 2000);

  const flushInterval = setInterval(() => {
    if (!connectionState.isConnected) {
      clearInterval(flushInterval);
      return;
    }
    try {
      sock.ev?.flush?.();
    } catch {}
  }, 30000);
  if (flushInterval.unref) flushInterval.unref();

  return sock;
}

/**
 * Mendapatkan status koneksi
 * @returns {ConnectionState} State koneksi saat ini
 */
function getConnectionState() {
  return connectionState;
}

/**
 * Mendapatkan socket instance
 * @returns {Object|null} Socket atau null jika tidak terkoneksi
 */
function getSocket() {
  return connectionState.sock;
}

/**
 * Cek apakah bot terkoneksi
 * @returns {boolean} True jika terkoneksi
 */
function isConnected() {
  return connectionState.isConnected;
}

/**
 * Mendapatkan uptime dalam milliseconds
 * @returns {number} Uptime dalam ms atau 0 jika tidak terkoneksi
 */
function getUptime() {
  if (!connectionState.connectedAt) return 0;
  return Date.now() - connectionState.connectedAt.getTime();
}

/**
 * Logout dan hapus session
 * @returns {Promise<boolean>} True jika berhasil
 */
async function logout() {
  try {
    const sessionPath = path.join(
      process.cwd(),
      "storage",
      config.session?.folderName || "session",
    );

    if (connectionState.sock) {
      await connectionState.sock.logout();
    }

    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }

    connectionState.isConnected = false;
    connectionState.sock = null;
    connectionState.connectedAt = null;

    colors.logger.success("koneksi", "تم الخروج ومسح الجلسة");
    return true;
  } catch (error) {
    colors.logger.error("koneksi", `فشل الخروج: ${error.message}`);
    return false;
  }
}

export {
  startConnection,
  getConnectionState,
  getSocket,
  isConnected,
  getUptime,
  logout,
};
