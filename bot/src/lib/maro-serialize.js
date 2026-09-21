// ═══════════════════════════════════════════════
// 📁 src/lib/maro-serialize.js
// 🖤 Tarboo Bot Serialize - نظام تسلسل الرسائل الكامل
// ═══════════════════════════════════════════════

import {
  downloadContentFromMessage,
  getContentType,
  jidDecode,
  proto,
  generateWAMessageFromContent,
  generateWAMessage,
  prepareWAMessageMedia,
  areJidsSameUser,
  normalizeMessageContent,
} from "maro";
import { writeFileSync, mkdirSync, existsSync, unlinkSync } from "fs";
import { join } from "path";
import config, {
  isBanned,
  isOwner,
  isPartner,
  isPremium,
} from "../../config.js";
import {
  isLid,
  isLidConverted,
  lidToJid,
  convertLidArray,
  decodeAndNormalize,
  resolveLidFromParticipants,
  resolveAnyLidToJid,
  getCachedJid,
  cacheParticipantLids,
  cacheLidJid,
  resolveFromSock,
} from "./maro-lid.js";
import util from "util";
import axios from "axios";
import sharp from "sharp";
import fsc from "fs";
import { getDatabase } from "./maro-database.js";
import { saluranCtx } from "./maro-context.js";
import { getAssetBuffer } from "./maro-asset-manager.js";
let _prefixCache = null;
let _prefixCacheTime = 0;
const PREFIX_CACHE_TTL = 30000;

function getCachedPrefixes() {
  const now = Date.now();
  if (_prefixCache && now - _prefixCacheTime < PREFIX_CACHE_TTL)
    return _prefixCache;
  const configPrefix = config.command?.prefix || ".";
  let prefixList = [configPrefix];
  let isNoPrefix = false;
  try {
    const prefixDbPath = join(process.cwd(), "database", "prefix.json");
    if (existsSync(prefixDbPath)) {
      const prefixData = JSON.parse(fsc.readFileSync(prefixDbPath, "utf8"));
      prefixList = [configPrefix, ...(prefixData.prefixes || [])];
      isNoPrefix = prefixData.noprefix === true;
    }
  } catch { }
  _prefixCache = { list: [...new Set(prefixList)], noprefix: isNoPrefix };
  _prefixCacheTime = now;
  return _prefixCache;
}

function invalidatePrefixCache() {
  _prefixCache = null;
  _prefixCacheTime = 0;
}

const _thumbCache = {};
async function getCachedThumb(filePath) {
  if (_thumbCache[filePath] !== undefined) return _thumbCache[filePath];

  const basename = filePath ? filePath.split('/').pop().split('.')[0] : null;
  if (basename) {
    const assetBuf = getAssetBuffer(basename);
    if (assetBuf) return assetBuf;
  }

  try {
    if (filePath && filePath.startsWith("http")) {
      const res = await axios.get(filePath, { responseType: "arraybuffer", timeout: 5000 });
      _thumbCache[filePath] = Buffer.from(res.data);
    } else if (fsc.existsSync(filePath)) {
      _thumbCache[filePath] = fsc.readFileSync(filePath);
    } else {
      _thumbCache[filePath] = null;
    }
  } catch {
    _thumbCache[filePath] = null;
  }
  return _thumbCache[filePath];
}

let _sharpThumbCache = {};
let _sharpInstance = null;
async function _getSharp() {
  if (!_sharpInstance) _sharpInstance = (await import("sharp")).default;
  return _sharpInstance;
}
async function getCachedSharpThumb(filePath, w, h) {
  const key = `${filePath}_${w}x${h}`;
  if (_sharpThumbCache[key] !== undefined) return _sharpThumbCache[key];
  try {
    const raw = await getCachedThumb(filePath);
    if (raw) {
      const sharp = await _getSharp();
      _sharpThumbCache[key] = await sharp(raw).resize(w, h).toBuffer();
    } else {
      _sharpThumbCache[key] = null;
    }
  } catch {
    _sharpThumbCache[key] = null;
  }
  return _sharpThumbCache[key];
}

const _ppCache = new Map();
const PP_CACHE_TTL = 5 * 60 * 1000;

const _statusCache = new Map();
const STATUS_COOLDOWN = 60000; // دقيقة واحدة

/**
 * فك تشفير JID إلى صيغة نظيفة
 * @param {string} jid - JID المراد فك تشفيره
 * @returns {string|null} JID بعد فك التشفير أو null
 */
function decodeJid(jid) {
  if (!jid) return null;
  if (/:\d+@/gi.test(jid)) {
    const decoded = jidDecode(jid) || {};
    return (
      (decoded.user && decoded.server && decoded.user + "@" + decoded.server) ||
      jid
    );
  }
  return jid;
}

function getMessageType(message) {
  if (!message) return null;
  const contentType = getContentType(message);
  if (
    contentType === "messageContextInfo" &&
    message.interactiveResponseMessage
  ) {
    return "interactiveResponseMessage";
  }
  return contentType;
}

/**
 * الحصول على النص/المحتوى من مختلف أنواع الرسائل
 * @param {Object} message - كائن رسالة واتساب
 * @param {string} type - نوع الرسالة
 * @returns {string} نص/محتوى الرسالة
 */
function getMessageBody(message, type) {
  if (!message || !type) return "";

  const messageContent = message[type];
  if (!messageContent) return "";

  switch (type) {
    case "conversation":
      return message.conversation || "";
    case "extendedTextMessage":
      return messageContent.text || "";
    case "imageMessage":
    case "videoMessage":
    case "documentMessage":
      return messageContent.caption || "";
    case "buttonsResponseMessage":
      return messageContent.selectedButtonId || "";
    case "listResponseMessage":
      return messageContent.singleSelectReply?.selectedRowId || "";
    case "templateButtonReplyMessage":
      return messageContent.selectedId || "";
    case "interactiveResponseMessage":
      try {
        const paramsJson =
          messageContent.nativeFlowResponseMessage?.paramsJson || "{}";
        const parsed = JSON.parse(paramsJson);
        if (parsed.id) return parsed.id;
        if (parsed.response_json) {
          const nested = JSON.parse(parsed.response_json);
          if (nested.id) return nested.id;
          if (nested.selectedRowId) return nested.selectedRowId;
        }
        if (parsed.selectedRowId) return parsed.selectedRowId;
        if (parsed.selected_row_id) return parsed.selected_row_id;
        return "";
      } catch {
        return "";
      }
    case "pollCreationMessage":
      return messageContent.name || "";
    default:
      return "";
  }
}

/**
 * تحليل الأمر والوسائط من نص الرسالة
 * @param {string} body - نص الرسالة
 * @param {string} prefix - بادئة الأمر
 * @returns {Object} معلومات الأمر
 */
function parseCommand(body, prefix) {
  const result = {
    isCommand: false,
    command: "",
    prefix: "",
    args: [],
    text: "",
    fullArgs: "",
  };

  if (!body) return result;

  const cached = getCachedPrefixes();
  const prefixList = cached.list;

  for (const p of prefixList) {
    if (body.startsWith(p)) {
      result.isCommand = true;
      result.prefix = p;

      const withoutPrefix = body.slice(p.length).trim();
      const parts = withoutPrefix.split(/\s+/);

      result.command = config.command?.caseSensitive
        ? parts[0]
        : parts[0].toLowerCase();
      result.args = parts.slice(1);
      result.text = withoutPrefix.slice(result.command.length).trim();
      result.fullArgs = result.text;

      return result;
    }
  }

  if (cached.noprefix) {
    const parts = body.trim().split(/\s+/);
    const potentialCommand = config.command?.caseSensitive
      ? parts[0]
      : parts[0].toLowerCase();

    if (
  potentialCommand &&
  /^[a-z0-9\u0621-\u064A_-]+$/i.test(potentialCommand) &&
  potentialCommand.length <= 20
) {
      result.isCommand = true;
      result.prefix = "";
      result.command = potentialCommand;
      result.args = parts.slice(1);
      result.text = result.args.join(" ");
      result.fullArgs = body.slice(potentialCommand.length).trim();
    }
  }

  return result;
}

/**
 * تسلسل الرسالة المقتبسة مع السياق الكامل
 * @param {Object} message - كائن الرسالة الرئيسية
 * @param {string} type - نوع الرسالة
 * @param {Object} sock - اتصال السوكيت
 * @param {Object[]} participants - مشاركون المجموعة
 * @param {Object} originalMsgKey - مفتاح الرسالة الأصلي
 * @returns {Promise<Object|null>} كائن الرسالة المقتبسة
 */
async function serializeQuotedMessage(
  message,
  type,
  sock,
  participants = [],
  originalMsgKey = {},
) {
  if (!message || !type) return null;

  const messageContent = message[type];
  if (!messageContent) return null;

  const contextInfo = messageContent.contextInfo;
  if (!contextInfo || !contextInfo.quotedMessage) return null;

  const rawQuotedMessage = contextInfo.quotedMessage;
  const quotedMessage =
    normalizeMessageContent(rawQuotedMessage) || rawQuotedMessage;
  const quotedType = getMessageType(quotedMessage);
  const isViewOnce = !!(
    rawQuotedMessage?.viewOnceMessage ||
    rawQuotedMessage?.viewOnceMessageV2 ||
    rawQuotedMessage?.viewOnceMessageV2Extension
  );

  let quotedParticipant = contextInfo.participant || "";

  if (isLid(quotedParticipant) || isLidConverted(quotedParticipant)) {
    const cached = getCachedJid(quotedParticipant);
    if (cached && !isLidConverted(cached)) {
      quotedParticipant = cached;
    } else if (participants && participants.length > 0) {
      quotedParticipant = resolveAnyLidToJid(quotedParticipant, participants);
    } else {
      quotedParticipant = lidToJid(quotedParticipant);
    }
  }

  quotedParticipant = decodeJid(quotedParticipant);

  const db = getDatabase();
  const contacts = db.setting("contacts") || {};
  let qPushName = "~ مستخدم";

  if (sock?.store) {
    try {
      const jid = originalMsgKey?.remoteJid || message.key?.remoteJid;
      const stanzaId = contextInfo.stanzaId;
      if (jid && stanzaId) {
        const rawMsg = await sock.store.loadMessage(jid, stanzaId);
        if (rawMsg && rawMsg.pushName) {
          qPushName = rawMsg.pushName;
        }
      }
    } catch (e) { }
  }

  if (qPushName === "~ مستخدم" && contacts[quotedParticipant]) {
    qPushName = contacts[quotedParticipant].name;
  }

  const quoted = {
    pushName: qPushName,
    key: {
      remoteJid: message.key?.remoteJid || "",
      fromMe: quotedParticipant === decodeJid(sock?.user?.id),
      id: contextInfo.stanzaId || "",
      participant: quotedParticipant,
    },
    id: contextInfo.stanzaId || "",
    sender: quotedParticipant,
    senderNumber: (quotedParticipant || "").replace(/@.+/g, ""),
    type: quotedType,
    body: getMessageBody(quotedMessage, quotedType),
    message: quotedMessage,
    mentionedJid: convertLidArray(contextInfo.mentionedJid || [], participants),
    isMedia: [
      "imageMessage",
      "videoMessage",
      "audioMessage",
      "stickerMessage",
      "documentMessage",
    ].includes(quotedType),
    isImage: quotedType === "imageMessage",
    isVideo: quotedType === "videoMessage",
    isAudio: quotedType === "audioMessage",
    isSticker: quotedType === "stickerMessage",
    isDocument: quotedType === "documentMessage",
    isViewOnce: isViewOnce,
  };

  quoted.download = async (filename = null) => {
    if (!quoted.isMedia) return null;

    const stream = await downloadContentFromMessage(
      quotedMessage[quotedType],
      quotedType.replace("Message", ""),
    );

    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    if (filename) {
      const tempDir = join(process.cwd(), "storage", "temp");
      if (!existsSync(tempDir)) {
        mkdirSync(tempDir, { recursive: true });
      }
      const filepath = join(tempDir, filename);
      writeFileSync(filepath, buffer);
      return filepath;
    }

    return buffer;
  };

  return quoted;
}

/**
 * إنشاء سياق معلومات للرد الوهمي
 * @param {string} jid - JID المرسل الوهمي
 * @param {string} text - نص الرسالة الوهمية
 * @param {string} [title] - العنوان
 * @param {string} [body] - المحتوى الإضافي
 * @param {Buffer} [thumbnail] - صورة مصغرة
 * @returns {Object} كائن سياق المعلومات
 */
function createContextInfo(jid, text, title = "", body = "", thumbnail = null) {
  const contextInfo = {
    mentionedJid: [],
    forwardingScore: 999,
    isForwarded: true,
  };

  if (jid && text) {
    contextInfo.quotedMessage = {
      conversation: text,
    };
    contextInfo.participant = jid;
    contextInfo.stanzaId = "Tarboo Bot" + Date.now();
  }

  return contextInfo;
}

/**
 * تسلسل رسالة واتساب إلى كائن كامل مع جميع الميزات
 * @param {Object} sock - اتصال Baileys
 * @param {Object} msg - الرسالة الخام من حدث Baileys
 * @param {Object} [store] - مخزن البيانات
 * @returns {Promise<SerializedMessage>} كائن الرسالة المسلسل
 */
async function serialize(sock, msg, store = {}) {
  if (!msg) return null;
  if (!msg.message) return null;
  if (!msg.key) return null;

  const m = {};

  m.key = msg.key;
  m.id = msg.key?.id || "";
  m.chat = decodeJid(msg.key?.remoteJid || "");
  m.fromMe = (msg.key && msg.key.fromMe) || false;
  m.isNewsletter = m.chat?.endsWith("@newsletter") || false;
  m.isChannel = m.isNewsletter;
  m.isGroup = m.chat?.endsWith("@g.us") || false;

  const remoteJidAlt = msg.key?.remoteJidAlt
    ? decodeAndNormalize(msg.key.remoteJidAlt)
    : null;
  const participantAlt = msg.key?.participantAlt
    ? decodeAndNormalize(msg.key.participantAlt)
    : null;

  if (
    !m.isGroup &&
    !m.isNewsletter &&
    (isLid(m.chat) || isLidConverted(m.chat))
  ) {
    if (remoteJidAlt && !isLid(remoteJidAlt) && !isLidConverted(remoteJidAlt)) {
      const lidKey = m.chat.endsWith("@lid")
        ? m.chat
        : m.chat.replace("@s.whatsapp.net", "@lid");
      cacheLidJid(lidKey, remoteJidAlt);
      cacheLidJid(m.chat, remoteJidAlt);
      m.chat = remoteJidAlt;
    } else {
      const resolved = resolveAnyLidToJid(m.chat, []);
      if (resolved && !isLidConverted(resolved)) {
        m.chat = resolved;
      } else if (m.fromMe) {
        m.chat = decodeAndNormalize(sock.user.id);
      }
    }
    m.key.remoteJid = m.chat;
  }

  let senderJid;
  if (m.isNewsletter) {
    // ⚠️ أمان: كان يُسند هنا `sock.user.id`، أي أن كل رسالة قناة تُنسب إلى البوت
    // نفسه فتمر كأنها رسالة مالك. الآن تُنسب إلى كاتبها الحقيقي، وإلى معرّف
    // القناة كحل احتياطي، ولا تأخذ هوية البوت إلا إذا كانت fromMe فعلاً.
    senderJid = m.fromMe ? sock.user.id : msg.key.participant || m.chat;
  } else if (m.isGroup) {
    senderJid = msg.key.participant;
  } else {
    senderJid = m.fromMe ? sock.user.id : m.chat;
  }
  senderJid = decodeAndNormalize(senderJid);

  if (!senderJid || isLid(senderJid) || isLidConverted(senderJid)) {
    const altJid = m.isGroup ? participantAlt : remoteJidAlt;
    if (altJid && !isLid(altJid) && !isLidConverted(altJid)) {
      if (senderJid) {
        const lidKey = senderJid.endsWith("@lid")
          ? senderJid
          : senderJid.replace("@s.whatsapp.net", "@lid");
        cacheLidJid(lidKey, altJid);
        cacheLidJid(senderJid, altJid);
      }
      senderJid = altJid;
    } else if (msg.participantPn) {
      senderJid = msg.participantPn;
    } else if (m.isGroup) {
      const sockResolved = await resolveFromSock(senderJid, sock);
      if (
        sockResolved &&
        !isLid(sockResolved) &&
        !isLidConverted(sockResolved)
      ) {
        senderJid = sockResolved;
      } else {
        try {
          const metadata = await sock.groupMetadata(m.chat);
          if (metadata?.participants) {
            cacheParticipantLids(metadata.participants);
          }
          const fallback = msg.key.participant;
          senderJid = resolveAnyLidToJid(
            senderJid || fallback,
            metadata?.participants || [],
          );
        } catch {
          const fallback = msg.key.participant;
          senderJid = resolveAnyLidToJid(senderJid || fallback, []);
        }
      }
    } else {
      const fromCache = resolveAnyLidToJid(senderJid || m.chat, []);
      if (fromCache && !isLidConverted(fromCache)) {
        senderJid = fromCache;
      } else {
        senderJid = await resolveFromSock(senderJid || m.chat, sock);
      }
    }
  }
  m.sender = senderJid;
  m.senderNumber = m.sender ? m.sender.replace(/@.+/g, "") : "";

  if (m.isGroup && m.sender) {
    m.key.participant = m.sender;
  }
  const dbContacts = getDatabase().setting("contacts") || {};
  let finalPushName = msg.pushName || (m.isNewsletter ? "قناة" : "مجهول");
  if ((finalPushName === "مجهول" || finalPushName === "~ مستخدم") && dbContacts[m.sender]) {
    finalPushName = dbContacts[m.sender].name;
  }
  m.pushName = finalPushName;
  m.isBot = m.fromMe;
  // ⚠️ أمان: لا تمنح صلاحيات على أساس نوع المحادثة.
  // كان `m.isNewsletter` يمنح صلاحية المالك لأي قناة واتساب يتابعها البوت،
  // مما يسمح لصاحب أي قناة بتنفيذ أوامر النظام (>> و !! و => و $).
  // الصلاحية تُحسب الآن من هوية المُرسِل فقط؛ ورسائل البوت نفسه (fromMe) تبقى موثوقة.
  m.isOwner = m.fromMe ? true : isOwner(m.sender);
  m.isPartner = m.fromMe ? true : isPartner(m.sender);
  m.isPremium = m.fromMe ? true : isPremium(m.sender);
  m.isBanned = m.fromMe ? false : isBanned(m.sender);
  let messageData = normalizeMessageContent(msg.message);
  m.isViewOnce = !!(
    msg.message?.viewOnceMessage ||
    msg.message?.viewOnceMessageV2 ||
    msg.message?.viewOnceMessageV2Extension
  );
  m.type = getMessageType(messageData);
  m.message = messageData;
  m.body = getMessageBody(messageData, m.type);
  const parsed = parseCommand(m.body, config.command?.prefix || ".");
  m.isCommand = parsed.isCommand;
  m.command = parsed.command;
  m.prefix = parsed.prefix;
  m.args = parsed.args;
  m.text = parsed.text;
  m.fullArgs = parsed.fullArgs;

  m.isQuoted = false;
  m.quoted = null;
  m._pendingQuotedMessage = { messageData, type: m.type, sock };

  const messageContent = messageData[m.type];
  m.mentionedJid = convertLidArray(
    messageContent?.contextInfo?.mentionedJid || [],
  );

  m.isMedia = [
    "imageMessage",
    "videoMessage",
    "audioMessage",
    "stickerMessage",
    "documentMessage",
  ].includes(m.type);
  m.isImage = m.type === "imageMessage";
  m.isVideo = m.type === "videoMessage";
  m.isAudio = m.type === "audioMessage";
  m.isSticker = m.type === "stickerMessage";
  m.isDocument = m.type === "documentMessage";
  m.isContact = m.type === "contactMessage" || m.type === "contactsArrayMessage";
  m.isLocation = m.type === "locationMessage" || m.type === "liveLocationMessage";
  m.isPoll = m.type === "pollCreationMessage";

  m.groupMetadata = null;
  m.isAdmin = false;
  m.isBotAdmin = false;
  m.groupName = "";
  m.groupDesc = "";
  m.groupMembers = [];
  m.groupAdmins = [];

  if (m.isGroup) {
    try {
      m.groupMetadata =
        store.groupMetadata?.[m.chat] || (await sock.groupMetadata(m.chat));
      m.groupName = m.groupMetadata?.subject || "";
      m.groupDesc = m.groupMetadata?.desc || "";
      m.groupMembers = m.groupMetadata?.participants || [];
      m.groupAdmins = m.groupMembers
        ?.filter((p) => p.admin)
        .map((p) => p.jid || p.id || p.lid || "");

      const senderNum = m.sender?.replace(/[^0-9]/g, "") || "";
      const botNum = decodeJid(sock.user.id)?.replace(/[^0-9]/g, "") || "";

      m.isAdmin = m.groupMembers.some((p) => {
        if (!p.admin) return false;
        const pJid = p.jid || p.id || "";
        const pLid = p.lid || "";
        let pNum = pJid.replace(/[^0-9]/g, "");
        const pLidNum = pLid.replace(/[^0-9]/g, "");
        if (isLid(pJid) || isLidConverted(pJid)) {
          const resolved = getCachedJid(pJid) || getCachedJid(pLid);
          if (resolved) pNum = resolved.replace(/[^0-9]/g, "");
        }
        return (
          pNum === senderNum ||
          pLidNum === senderNum ||
          (pNum.length >= 8 &&
            senderNum.length >= 8 &&
            (pNum.endsWith(senderNum) || senderNum.endsWith(pNum)))
        );
      });

      m.isBotAdmin = m.groupMembers.some((p) => {
        if (!p.admin) return false;
        const pJid = p.jid || p.id || "";
        let pNum = pJid.replace(/[^0-9]/g, "");
        if (isLid(pJid) || isLidConverted(pJid)) {
          const resolved = getCachedJid(pJid) || getCachedJid(p.lid || "");
          if (resolved) pNum = resolved.replace(/[^0-9]/g, "");
        }
        return (
          pNum === botNum ||
          (pNum.length >= 8 &&
            botNum.length >= 8 &&
            (pNum.endsWith(botNum) || botNum.endsWith(pNum)))
        );
      });

      cacheParticipantLids(m.groupMembers);

      if (m._pendingQuotedMessage) {
        const { messageData, type, sock } = m._pendingQuotedMessage;
        m.quoted = await serializeQuotedMessage(
          messageData,
          type,
          sock,
          m.groupMembers,
        );
        if (m.quoted) {
          m.isQuoted = true;
        }
        delete m._pendingQuotedMessage;
      }

      if (isLid(m.sender) || isLidConverted(m.sender)) {
        m.sender = resolveAnyLidToJid(m.sender, m.groupMembers);
        m.senderNumber = m.sender ? m.sender.replace(/@.+/g, "") : "";
      }

      if (m.mentionedJid && m.mentionedJid.length > 0) {
        m.mentionedJid = convertLidArray(m.mentionedJid, m.groupMembers);
      }

      if (
        m.quoted &&
        (isLid(m.quoted.sender) || isLidConverted(m.quoted.sender))
      ) {
        m.quoted.sender = resolveAnyLidToJid(m.quoted.sender, m.groupMembers);
        m.quoted.senderNumber = m.quoted.sender
          ? m.quoted.sender.replace(/@.+/g, "")
          : "";
        m.quoted.key.participant = m.quoted.sender;
      }
    } catch (error) { }
  }

  if (m._pendingQuotedMessage) {
    const { messageData, type, sock } = m._pendingQuotedMessage;
    m.quoted = await serializeQuotedMessage(messageData, type, sock, []);
    if (m.quoted) {
      m.isQuoted = true;
    }
    delete m._pendingQuotedMessage;
  }

  m.remoteJid = m.chat;
  m.jid = m.chat;
  m.from = m.chat;
  m.to = m.chat;
  m.botNumber = decodeJid(sock.user?.id)?.replace(/@.+/g, "") || "";
  m.botJid = decodeJid(sock.user?.id) || "";
  m.botName = sock.user?.name || config.bot?.name || "Tarboo Bot";
  m.messageId = m.id;
  m.chatId = m.chat;
  m.senderId = m.sender;
  m.isPrivate = !m.isGroup && !m.isNewsletter;
  m.isPrivateChat = m.isPrivate;
  m.isGroupChat = m.isGroup;
  m.mediaType = m.type;
  m.hasMedia = m.isMedia;
  m.mimetype = messageData[m.type]?.mimetype || "";
  m.fileLength = messageData[m.type]?.fileLength || 0;
  m.fileName = messageData[m.type]?.fileName || "";
  m.seconds = messageData[m.type]?.seconds || 0;
  m.ptt = messageData[m.type]?.ptt || false;
  m.isAnimated = messageData[m.type]?.isAnimated || false;
  m.quotedMsg = m.quoted;
  m.quotedBody = m.quoted?.body || "";
  m.quotedSender = m.quoted?.sender || "";
  m.quotedType = m.quoted?.type || "";
  m.hasQuotedMedia = m.quoted?.isMedia || false;
  m.hasQuotedImage = m.quoted?.isImage || false;
  m.hasQuotedVideo = m.quoted?.isVideo || false;
  m.hasQuotedSticker = m.quoted?.isSticker || false;
  m.hasQuotedAudio = m.quoted?.isAudio || false;
  m.hasQuotedDocument = m.quoted?.isDocument || false;
  m.isReply = m.isQuoted;
  m.hasMentions = m.mentionedJid.length > 0;
  m.isForwarded = messageData[m.type]?.contextInfo?.isForwarded || false;
  m.forwardingScore = messageData[m.type]?.contextInfo?.forwardingScore || 0;
  m.expiration = messageData[m.type]?.contextInfo?.expiration || 0;
  m.ephemeralSettingTimestamp = msg.messageTimestamp || 0;

  const ensureResolved = async (jid) => {
    if (isLidConverted(jid) || isLid(jid)) {
      const pn = await resolveFromSock(jid, sock);
      if (pn && !isLidConverted(pn) && !isLid(pn)) {
        return pn;
      }
    }
    return jid;
  };

  /**
   * رد بنص مع خيارات
   * @param {string} text - النص للرد
   * @param {Object} [options={}] - خيارات إضافية
   * @returns {Promise<Object>} الرسالة المرسلة
   */
  m.reply = async (text, options = {}) => {
    if (!text && text !== 0) return null;

    const db = getDatabase();

    let srtImage = null;
    try {
      if (db?.setting?.('srtEnabled')) {
        const shuffleDir = join(process.cwd(), 'assets', 'image', 'shuffle');
        if (existsSync(shuffleDir)) {
          const files = fsc.readdirSync(shuffleDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.jpeg'));
          if (files.length > 0) {
            const randFile = files[Math.floor(Math.random() * files.length)];
            srtImage = fsc.readFileSync(join(shuffleDir, randFile));
          }
        }
      }
    } catch (e) { }

    let replyVariant = 1;
    try {
      replyVariant =
        db?.setting?.("replyVariant") ||
        db?.db?.data?.settings?.replyVariant ||
        1;
    } catch (e) {
      replyVariant = 1;
    }

    let contextInfo = {
      mentionedJid: options?.mentions || [m?.sender] || [],
      ...options.contextInfo,
    };

    const defaultOptions = { contextInfo };

    let quotedMsg = options.quoted !== false ? msg : undefined;

    // الشكل 1 - افتراضي: نص عادي مع اقتباس
    // الشكل 2 - مستند وهمي مع صورة
    if (replyVariant === 2) {
      quotedMsg = {
        key: {
          participant: `0@s.whatsapp.net`,
          remoteJid: `status@broadcast`,
        },
        message: {
          contactMessage: {
            displayName: `🪸 ${config.bot?.name}`,
            vcard: `BEGIN:VCARD\nVERSION:3.0\nN:XL;ttname,;;;\nFN:ttname\nitem1.TEL;waid=13135550002:+1 (313) 555-0002\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
            sendEphemeral: true,
          },
        },
      };

      return sock.sendMessage(
        await ensureResolved(m.chat),
        {
          document:
            await getCachedThumb(join(process.cwd(), "package.json")) ||
            fsc.readFileSync(join(process.cwd(), "package.json")),
          mimetype: "image/png",
          fileName: config.bot.name,
          fileLength: 99999999999999,
          jpegThumbnail: srtImage ? await sharp(srtImage).resize(300, 300).toBuffer() : await sharp(getAssetBuffer("maro2"))
            .resize(300, 300)
            .toBuffer(),
          caption: text,
          ...defaultOptions,
          ...options,
        },
        { quoted: quotedMsg },
      );
    }
    // الشكل 3 - فيديو GIF مع نص
    else if (replyVariant === 3) {
      return sock.sendMessage(
        await ensureResolved(m.chat),
        {
          video: getAssetBuffer("maro-mp4"),
          caption: text,
          gifPlayback: true,
          contextInfo: { ...contextInfo },
        },
        { quoted: m },
      );
    }
    // الشكل 4 - معاينة رابط
    else if (replyVariant === 4) {
      const thumbnail = srtImage || getAssetBuffer("maro");
      return sock.sendPreview(
        m.chat,
        {
          caption: `${config.info?.website}\n\n${text}`,
          url: config.info?.website || "https://github.com",
          title: config.bot?.name || "Tarboo Bot",
          description: `المطور: ${config.bot.developer} | الإصدار: ${config.bot.version}`,
          image: thumbnail,
          previewType: 0,
        },
        {
          quoted: m,
          contextInfo: {
            mentionedJid: options?.mentions || [m?.sender] || [],
            isForwarded: true,
            forwardingScore: 9,
            forwardedNewsletterMessageInfo: {
              newsletterJid: config.saluran?.id,
              newsletterName: config.saluran?.name || config.bot?.name || "Tarboo Bot",
              serverMessageId: Math.floor(Math.random() * 1000000),
            },
          },
        },
      );
    }
    // الشكل 5 - طلب وهمي (Order)
    else if (replyVariant === 5) {
      const thumbnailBuf = srtImage || getAssetBuffer("maro");
      const fakeOrder = {
        key: {
          participant: "0@s.whatsapp.net",
          remoteJid: m.chat,
          fromMe: false,
        },
        message: {
          orderMessage: {
            orderId: "123456",
            itemCount: 999,
            status: 1,
            surface: 1,
            message: config.bot?.name || "Tarboo Bot",
            orderTitle: "إشعار النظام",
            sellerJid: "0@s.whatsapp.net",
            token: "Tarboo Bot1+",
            totalAmount1000: "1000000",
            totalCurrencyCode: "IDR",
            thumbnail: await sharp(thumbnailBuf).resize(300, 300).toBuffer(),
          }
        }
      };

      return sock.sendMessage(
        await ensureResolved(m.chat),
        { text, ...defaultOptions, ...options },
        { quoted: fakeOrder }
      );
    }
    // الشكل 6 - مستند مع اقتباس
    else if (replyVariant === 6) {
      return sock.sendMessage(
        await ensureResolved(m.chat),
        {
          document:
            await getCachedThumb(join(process.cwd(), "package.json")) ||
            fsc.readFileSync(join(process.cwd(), "package.json")),
          mimetype: "image/png",
          fileName: config.bot.name,
          fileLength: 99999999999999,
          jpegThumbnail: srtImage ? await sharp(srtImage).resize(300, 300).toBuffer() : await sharp(getAssetBuffer("maro2"))
            .resize(300, 300)
            .toBuffer(),
          caption: text,
          ...defaultOptions,
          ...options,
        },
        { quoted: m },
      );
    }
    // الشكل 7 - ViewOnce مع لوكيشن
    else if (replyVariant === 7) {
      const thumbnailBuf = srtImage || getAssetBuffer("maro");

      const msg7 = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
          message: {
            messageContextInfo: {},
            interactiveMessage: {
              header: {
                hasMediaAttachment: true,
                locationMessage: {
                  degreesLatitude: 0,
                  degreesLongitude: 0,
                  name: config.bot?.name || "Tarboo Bot",
                  address: "بوت واتساب متعدد الأجهزة",
                  jpegThumbnail: await sharp(thumbnailBuf).resize(300, 300).toBuffer(),
                }
              },
              body: { text: text },
              contextInfo: {
                mentionedJid: options?.mentions || [m?.sender] || [],
                isForwarded: true,
                forwardingScore: 9,
                ...options.contextInfo
              },
              nativeFlowMessage: { buttons: [] }
            }
          }
        }
      }, { quoted: m, userJid: sock.user.jid });

      return sock.relayMessage(await ensureResolved(m.chat), msg7.message, {
        messageId: msg7.key.id,
      });
    }
    // الشكل 8 - رسالة تفاعلية مع Order Message
    else if (replyVariant === 8) {
      const thumbnailBuf = srtImage || getAssetBuffer("maro");

      return await sock.relayMessage(m.chat, {
        interactiveMessage: {
          header: { title: config?.bot?.name },
          body: { text },
          nativeFlowMessage: {
            buttons: [{ name: "inapp_signup", buttonParamsJson: "{}" }]
          },
          contextInfo: {
            mentionedJid: options?.mentions || [m?.sender] || [],
            groupMentions: [],
            statusAttributions: [],
            participant: m?.sender,
            quotedMessage: {
              orderMessage: {
                orderId: "8999999999999",
                thumbnail: await sharp(thumbnailBuf).resize(300, 300).toBuffer(),
                itemCount: 999,
                status: 1,
                surface: 1,
                message: m?.body,
                orderTitle: "Tarboo Bot",
                sellerJid: "0@s.whatsapp.net",
                totalAmount1000: 0,
                totalCurrencyCode: "IDR"
              }
            },
            remoteJid: m.chat,
            forwardingScore: 999,
            isForwarded: true
          }
        }
      }, {});
    }
    // الشكل 9 - OrderMessage مباشر
    else if (replyVariant === 9) {
      const thumbnailBuf = srtImage || getAssetBuffer("maro");

      return await sock.relayMessage(
        m.chat,
        {
          "orderMessage": {
            "orderId": "Tarboo Bot",
            "thumbnail": thumbnailBuf,
            "itemCount": 1,
            "status": "INQUIRY",
            "surface": "CATALOG",
            "message": text,
            "orderTitle": "Tarboo Bot",
            "token": "maroD",
            "totalAmount1000": "0",
            "totalCurrencyCode": "IDR",
            "messageVersion": 1,
            "contextInfo": {
              "mentionedJid": options?.mentions || [m?.sender] || [],
              "participant": m?.sender,
              "quotedMessage": m?.message || { "conversation": m?.text || "" }
            }
          }
        },
        {}
      );
    }
    // الشكل 10 - طلب دفع وهمي
    else if (replyVariant === 10) {
      return await sock.relayMessage(
        m.chat,
        {
          "requestPaymentMessage": {
            "currencyCodeIso4217": "IDR",
            "amount1000": "75000000",
            "requestFrom": m?.sender || "0@s.whatsapp.net",
            "noteMessage": {
              "extendedTextMessage": {
                "text": text,
                "contextInfo": {
                  "mentionedJid": options?.mentions || [m?.sender] || [],
                  "participant": m?.sender,
                  "quotedMessage": m?.message || { "conversation": m?.text || "" }
                }
              }
            }
          }
        },
        {}
      );
    }
    // الشكل 11 - رسالة متحركة
    else if (replyVariant === 11) {
      const delay = (ms) => new Promise(r => setTimeout(r, ms));
      const chars = [...config.bot.name];

      const sentMsg = await sock.sendMessage(m.chat, { text: "..." }, { quoted: quotedMsg });
      const key = sentMsg.key;

      const getRandomSrtImage = () => {
        try {
          if (db?.setting?.('srtEnabled')) {
            const shuffleDir = join(process.cwd(), 'assets', 'image', 'shuffle');
            if (existsSync(shuffleDir)) {
              const files = fsc.readdirSync(shuffleDir).filter(f => f.match(/\.(jpg|jpeg|png)$/i));
              if (files.length > 0) {
                const randFile = files[Math.floor(Math.random() * files.length)];
                return fsc.readFileSync(join(shuffleDir, randFile));
              }
            }
          }
        } catch (e) { }
        return null;
      };

      (async () => {
        try {
          let iteration = 0;
          while (iteration < 100) {
            let currentTitle = "";
            for (const char of chars) {
              currentTitle += char;
              const randomThumbBuf = getRandomSrtImage() || srtImage || getAssetBuffer("maro");
              await sock.sendMessage(m.chat, {
                text: `${config.info.website}\n\n${text}`,
                edit: key,
                linkPreview: {
                  "matched-text": config.info.website,
                  title: currentTitle,
                  description: "بوت واتساب متعدد الأجهزة",
                  jpegThumbnail: randomThumbBuf
                }
              });
              await delay(2000);
              iteration++;
              if (iteration >= 100) break;
            }
            await delay(5000);
          }
        } catch (e) {
          console.error("خطأ في الحركة V11:", e);
        }
      })();

      return sentMsg;
    }

      // الشكل 12 - رسالة تفاعلية مع أزرار متعددة (CTA, اتصال, الخ)
else if (replyVariant === 12) {
    const msg12 = {
        interactiveMessage: {
            body: { text },
            footer: { text: config.bot?.name || "Tarboo Bot" },
            nativeFlowMessage: {
                buttons: [
                    { name: "inapp_signup", buttonParamsJson: "{}" },
                    { name: "request_contact_info" },
                    {
                        name: "cta_call",
                        buttonParamsJson: JSON.stringify({
                            display_text: "اتصل الآن",
                            phone_number: (config.owner?.number?.[0] || "201234567890").replace(/[^0-9]/g, "")
                        })
                    },
                    {
                        name: "cta_cancel_reminder",
                        buttonParamsJson: JSON.stringify({ display_text: "إلغاء" })
                    },
                    {
                        name: "call_permission_request",
                        buttonParamsJson: JSON.stringify({ has_multiple_buttons: true })
                    }
                ],
                messageParamsJson: JSON.stringify({
                    limited_time_offer: {
                        text: config.bot?.name || "Tarboo Bot",
                        url: config.info?.website || "https://google.com/"
                    }
                })
            },
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                mentionedJid: options?.mentions || [m?.sender] || []
            }
        }
    };

	    return sock.relayMessage(await ensureResolved(m.chat), {
	        viewOnceMessage: {
            message: {
                messageContextInfo: {},
                interactiveMessage: msg12.interactiveMessage
             }
        }
	    }, {});
	}

    // الشكل 13 - معاينة رابط متحركة محسنة مع صورة مصغرة مرفوعة
    else if (replyVariant === 13) {
      const getRandomSrtImage = () => {
        try {
          if (!db?.setting?.("srtEnabled")) return null;
          const shuffleDir = join(process.cwd(), "assets", "image", "shuffle");
          if (!existsSync(shuffleDir)) return null;
          const files = fsc
            .readdirSync(shuffleDir)
            .filter((file) => /\.(jpg|jpeg|png)$/i.test(file));
          if (!files.length) return null;
          const randomFile = files[Math.floor(Math.random() * files.length)];
          return fsc.readFileSync(join(shuffleDir, randomFile));
        } catch {
          return null;
        }
      };

      const thumbnailBuf = getRandomSrtImage() || srtImage || getAssetBuffer("maro");
      const website = config.info?.website || "https://github.com";
      const previewImage = await sharp(thumbnailBuf)
        .resize(300, 300, { fit: "cover" })
        .jpeg({ quality: 82 })
        .toBuffer();

      let faviconMMSMetadata;
      try {
        const uploaded = await prepareWAMessageMedia(
          { image: previewImage },
          {
            upload: sock.waUploadToServer,
            mediaTypeOverride: "thumbnail-link",
          },
        );
        const image = uploaded.imageMessage;
        if (image) {
          faviconMMSMetadata = {
            thumbnailDirectPath: image.directPath,
            thumbnailSha256: image.fileSha256,
            thumbnailEncSha256: image.fileEncSha256,
            mediaKey: image.mediaKey,
            mediaKeyTimestamp: image.mediaKeyTimestamp,
            thumbnailHeight: image.height || 300,
            thumbnailWidth: image.width || 300,
          };
        }
      } catch {}

      const msg13 = generateWAMessageFromContent(
        m.chat,
        {
          extendedTextMessage: {
            text: `${website}\n${text}`,
            matchedText: website,
            title: config.bot?.name || "Tarboo Bot",
            description: `مرحباً ${m.pushName || "بك"}`,
            jpegThumbnail: previewImage,
            previewType: 1,
            ...(faviconMMSMetadata ? { faviconMMSMetadata } : {}),
            contextInfo: {
              mentionedJid: options?.mentions || [m?.sender] || [],
              isForwarded: true,
              forwardingScore: 999,
              forwardedNewsletterMessageInfo: {
                newsletterJid: config.saluran?.id,
                newsletterName: config.saluran?.name || config.bot?.name || "Tarboo Bot",
              },
              ...options.contextInfo,
            },
          },
        },
        { quoted: m, userJid: sock.user?.id },
      );

      return sock.relayMessage(await ensureResolved(m.chat), msg13.message, {
        messageId: msg13.key.id,
      });
    }
      
	    // الشكل الافتراضي - نص عادي
    return sock.sendMessage(
      await ensureResolved(m.chat),
      { text, ...defaultOptions, ...options },
      { quoted: quotedMsg },
    );
  };

  /**
   * رد بنص مع إشارات تلقائية
   * @param {string} text - النص الذي يحتوي على @رقم
   * @returns {Promise<Object>} الرسالة المرسلة
   */
  m.replyWithMentions = async (text) => {
    const mentions = [...text.matchAll(/@(\d+)/g)].map(
      (match) => `${match[1]}@s.whatsapp.net`,
    );
    return m.reply(text, { mentions });
  };

  /**
   * رد بصورة
   * @param {Buffer|string} image - الصورة أو الرابط
   * @param {string} [caption=''] - وصف الصورة
   * @param {Object} [options={}] - خيارات إضافية
   * @returns {Promise<Object>} الرسالة المرسلة
   */
  m.replyImage = async (image, caption = "", options = {}) => {
    let buffer = image;
    if (typeof image === "string" && image.startsWith("http")) {
      const response = await axios.get(image, { responseType: "arraybuffer" });
      buffer = Buffer.from(response.data);
    }

    return sock.sendMessage(
      await ensureResolved(m.chat),
      {
        image: buffer,
        caption,
        contextInfo: options.contextInfo,
        mentions: options.mentions || [],
      },
      { quoted: options.quoted !== false ? msg : undefined },
    );
  };

  /**
   * رد بفيديو
   * @param {Buffer|string} video - الفيديو أو الرابط
   * @param {string} [caption=''] - وصف الفيديو
   * @param {Object} [options={}] - خيارات إضافية
   * @returns {Promise<Object>} الرسالة المرسلة
   */
  m.replyVideo = async (video, caption = "", options = {}) => {
    let buffer = video;
    if (typeof video === "string" && video.startsWith("http")) {
      const response = await axios.get(video, { responseType: "arraybuffer" });
      buffer = Buffer.from(response.data);
    }

    return sock.sendMessage(
      await ensureResolved(m.chat),
      {
        video: buffer,
        caption,
        gifPlayback: options.gif || false,
        contextInfo: options.contextInfo,
        mentions: options.mentions || [],
      },
      { quoted: options.quoted !== false ? msg : undefined },
    );
  };

  /**
   * رد بصوت
   * @param {Buffer|string} audio - الصوت أو الرابط
   * @param {boolean} [ptt=false] - ملاحظة صوتية
   * @param {Object} [options={}] - خيارات إضافية
   * @returns {Promise<Object>} الرسالة المرسلة
   */
  m.replyAudio = async (audio, ptt = false, options = {}) => {
    let buffer = audio;
    if (typeof audio === "string" && audio.startsWith("http")) {
      const response = await axios.get(audio, { responseType: "arraybuffer" });
      buffer = Buffer.from(response.data);
    }

    return sock.sendMessage(
      await ensureResolved(m.chat),
      { audio: buffer, ptt, mimetype: "audio/mpeg" },
      { quoted: options.quoted !== false ? msg : undefined },
    );
  };

  /**
   * رد بملصق
   * @param {Buffer|string} sticker - الملصق أو الرابط
   * @param {Object} [options={}] - خيارات إضافية
   * @returns {Promise<Object>} الرسالة المرسلة
   */
  m.replySticker = async (sticker, options = {}) => {
    let buffer = sticker;
    if (typeof sticker === "string" && sticker.startsWith("http")) {
      const response = await axios.get(sticker, { responseType: "arraybuffer" });
      buffer = Buffer.from(response.data);
    }

    return sock.sendMessage(
      await ensureResolved(m.chat),
      { sticker: buffer },
      { quoted: options.quoted !== false ? msg : undefined },
    );
  };

  /**
   * رد بمستند
   * @param {Buffer|string} document - المستند أو الرابط
   * @param {string} fileName - اسم الملف
   * @param {string} [mimetype] - نوع الملف
   * @param {Object} [options={}] - خيارات إضافية
   * @returns {Promise<Object>} الرسالة المرسلة
   */
  m.replyDocument = async (
    document,
    fileName,
    mimetype = "application/octet-stream",
    options = {},
  ) => {
    let buffer = document;
    if (typeof document === "string" && document.startsWith("http")) {
      const response = await axios.get(document, { responseType: "arraybuffer" });
      buffer = Buffer.from(response.data);
    }

    return sock.sendMessage(
      await ensureResolved(m.chat),
      {
        document: buffer,
        fileName,
        mimetype,
        caption: options.caption || "",
      },
      { quoted: options.quoted !== false ? msg : undefined },
    );
  };

  /**
   * رد بجهة اتصال
   * @param {string} number - رقم الهاتف
   * @param {string} name - الاسم
   * @param {Object} [options={}] - خيارات إضافية
   * @returns {Promise<Object>} الرسالة المرسلة
   */
  m.replyContact = async (number, name, options = {}) => {
    const cleanNumber = number.replace(/[^0-9]/g, "");

    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${name}
TEL;type=CELL;type=VOICE;waid=${cleanNumber}:+${cleanNumber}
END:VCARD`;

    return sock.sendMessage(
      await ensureResolved(m.chat),
      {
        contacts: {
          displayName: name,
          contacts: [{ vcard }],
        },
      },
      { quoted: options.quoted !== false ? msg : undefined },
    );
  };

  /**
   * رد بموقع
   * @param {number} latitude - خط العرض
   * @param {number} longitude - خط الطول
   * @param {Object} [options={}] - خيارات إضافية
   * @returns {Promise<Object>} الرسالة المرسلة
   */
  m.replyLocation = async (latitude, longitude, options = {}) => {
    return sock.sendMessage(
      await ensureResolved(m.chat),
      {
        location: {
          degreesLatitude: latitude,
          degreesLongitude: longitude,
          name: options.name || "",
          address: options.address || "",
        },
      },
      { quoted: options.quoted !== false ? msg : undefined },
    );
  };

  /**
   * رد باقتباس وهمي
   * @param {string} text - نص الرد
   * @param {string} fakeJid - JID وهمي
   * @param {string} fakeText - نص وهمي في الاقتباس
   * @param {Object} [options={}] - خيارات إضافية
   * @returns {Promise<Object>} الرسالة المرسلة
   */
  m.replyWithQuote = async (text, fakeJid, fakeText, options = {}) => {
    const fakeMsg = {
      key: {
        fromMe: false,
        participant: fakeJid,
        remoteJid: m.chat,
      },
      message: { conversation: fakeText },
      pushName: options.pushName || "بوت",
    };

    return sock.sendMessage(
      await ensureResolved(m.chat),
      {
        text,
        contextInfo: {
          ...createContextInfo(fakeJid, fakeText, options.title, options.body, options.thumbnail),
          mentionedJid: options.mentions || [],
        },
      },
      { quoted: fakeMsg },
    );
  };

  /**
   * رد بمعاينة رابط
   * @param {string} text - نص الرد
   * @param {Object} preview - خيارات المعاينة
   * @param {Object} [options={}] - خيارات إضافية
   * @returns {Promise<Object>} الرسالة المرسلة
   */
  m.replyWithPreview = async (text, preview, options = {}) => {
    const ctx = saluranCtx();
    ctx.mentionedJid = options.mentions || [];
    return sock.sendMessage(
      await ensureResolved(m.chat),
      { text, contextInfo: ctx },
      { quoted: options.quoted !== false ? msg : undefined },
    );
  };

  /**
   * تفاعل على الرسالة
   * @param {string} emoji - الإيموجي للتفاعل
   * @returns {Promise<Object>} النتيجة
   */
  m.react = async (emoji) => {
    try {
      return await sock.sendMessage(await ensureResolved(m.chat), {
        react: {
          text: emoji,
          key: msg.key,
        },
      });
    } catch (e) {
      return null;
    }
  };

  /**
   * رد ذكي يقلل التكرار باستخدام التفاعلات
   * @param {string} text - نص الرسالة
   * @param {string} [type='info'] - نوع الحالة (error, busy, etc.)
   * @param {string} [emoji='⏳'] - الإيموجي للتفاعل
   * @returns {Promise<Object>}
   */
  m.statusReply = async (text, type = 'info', emoji = '⏳') => {
    const key = `${m.chat}_${m.command || 'global'}_${type}`;
    const now = Date.now();
    const lastSent = _statusCache.get(key) || 0;

    if (now - lastSent < STATUS_COOLDOWN) {
      return m.react(emoji);
    }

    _statusCache.set(key, now);
    return m.reply(text);
  };

  /**
   * تحميل الوسائط من هذه الرسالة
   * @param {string} [filename] - اسم الملف للحفظ
   * @returns {Promise<Buffer|string>} Buffer أو مسار الملف
   */
  m.download = async (filename = null) => {
    if (!m.isMedia) return null;

    const stream = await downloadContentFromMessage(
      messageData[m.type],
      m.type.replace("Message", ""),
    );

    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    if (filename) {
      const tempDir = join(process.cwd(), "storage", "temp");
      if (!existsSync(tempDir)) {
        mkdirSync(tempDir, { recursive: true });
      }
      const filepath = join(tempDir, filename);
      writeFileSync(filepath, buffer);
      return filepath;
    }

    return buffer;
  };

  /**
   * حذف هذه الرسالة
   * @returns {Promise<Object>} النتيجة
   */
  m.delete = async () => {
    return sock.sendMessage(m.chat, { delete: msg.key });
  };

  /**
   * توجيه الرسالة إلى JID آخر
   * @param {string} jid - JID الهدف
   * @param {boolean} [forceForward=false] - فرض التوجيه
   * @returns {Promise<Object>} النتيجة
   */
  m.forward = async (jid, forceForward = false) => {
    return sock.sendMessage(jid, { forward: msg, force: forceForward });
  };

  /**
   * نسخ الرسالة إلى JID آخر
   * @param {string} jid - JID الهدف
   * @param {Object} [options={}] - خيارات إضافية
   * @returns {Promise<Object>} النتيجة
   */
  m.copy = async (jid, options = {}) => {
    const content = {};

    if (m.isImage) {
      content.image = await m.download();
      content.caption = m.body;
    } else if (m.isVideo) {
      content.video = await m.download();
      content.caption = m.body;
    } else if (m.isAudio) {
      content.audio = await m.download();
    } else if (m.isSticker) {
      content.sticker = await m.download();
    } else if (m.isDocument) {
      content.document = await m.download();
      content.fileName = messageData[m.type]?.fileName || "ملف";
      content.mimetype = messageData[m.type]?.mimetype;
    } else {
      content.text = m.body;
    }

    return sock.sendMessage(await ensureResolved(jid), content, options);
  };

  m.timestamp = msg.messageTimestamp;
  m.raw = msg;

  if (m.chat && (isLidConverted(m.chat) || isLid(m.chat))) {
    resolveFromSock(m.chat, sock).then((resolved) => {
      if (resolved && !isLidConverted(resolved) && !isLid(resolved)) {
        m.chat = resolved;
        m.from = resolved;
        m.jid = resolved;
        m.remoteJid = resolved;
      }
    }).catch(() => { });
  }

  return m;
}

/**
 * الحصول على الرقم من JID
 * @param {string} jid - JID
 * @returns {string} الرقم
 */
function getNumber(jid) {
  if (!jid) return "";
  return jid.replace(/@.+/g, "");
}

/**
 * إنشاء JID من رقم
 * @param {string} number - رقم الهاتف
 * @returns {string} JID
 */
function createJid(number) {
  if (!number) return "";
  const cleaned = number.replace(/[^0-9]/g, "");
  return cleaned + "@s.whatsapp.net";
}

export {
  serialize,
  decodeJid,
  getMessageType,
  getMessageBody,
  parseCommand,
  serializeQuotedMessage,
  createContextInfo,
  getNumber,
  createJid,
  getCachedThumb,
  getCachedSharpThumb,
  invalidatePrefixCache,
};
