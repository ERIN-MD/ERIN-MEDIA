import assert from "node:assert/strict";
import config from "../config.js";
import { allowIncomingMessageProcessing, messageHandler } from "../src/handler.js";
import { shouldReplyAsBot } from "../src/lib/maro-bot-loop-guard.js";
import { jadibotSessions } from "../src/lib/maro-jadibot-manager.js";

const originalPrimary = config.bot.primaryNumber;
config.bot.primaryNumber = "201034648449";

let replies = 0;
const participants = [
  { id: "201034648449@s.whatsapp.net", admin: "admin" },
  { id: "201111111111@s.whatsapp.net", admin: "admin" },
  { id: "201999999999@s.whatsapp.net", admin: null },
];
const sock = {
  user: { id: "201111111111:1@s.whatsapp.net" },
  groupMetadata: async () => ({ id: "priority-test@g.us", subject: "اختبار الأولوية", participants }),
  sendMessage: async () => { replies += 1; },
};
const message = {
  key: {
    remoteJid: "priority-test@g.us",
    participant: "201999999999@s.whatsapp.net",
    fromMe: false,
    id: "PRIORITY-INTEGRATION-1",
  },
  message: { conversation: "رسالة بشرية لتشغيل الردود التلقائية" },
  pushName: "مستخدم اختبار",
  messageTimestamp: Math.floor(Date.now() / 1000),
};

await messageHandler(message, sock);
assert.equal(replies, 0, "البوت الثانوي يتوقف قبل إرسال أي رد تلقائي عند وجود البوت الرئيسي");

const automaticEvents = [];
const primarySock = {
  user: { id: "201034648449:1@s.whatsapp.net" },
  groupMetadata: async () => ({ id: "priority-test@g.us", subject: "اختبار الأولوية", participants }),
  sendMessage: async (chat, content) => { automaticEvents.push({ chat, content }); },
};
const repeatedBody = "رسالة تكامل مكررة لاختبار تفاعل المهلة";
shouldReplyAsBot({
  chat: "priority-test@g.us",
  sender: "201999999999@s.whatsapp.net",
  body: repeatedBody,
  fromMe: false,
  groupMembers: participants,
}, primarySock);
const rateAllowed = await allowIncomingMessageProcessing({
  chat: "priority-test@g.us",
  sender: "201999999999@s.whatsapp.net",
  body: repeatedBody,
  fromMe: false,
  isGroup: true,
  isCommand: false,
  groupMembers: participants,
  react: async (emoji) => primarySock.sendMessage("priority-test@g.us", { react: { text: emoji } }),
}, primarySock);
assert.equal(rateAllowed, false, "المعالج يمنع المسار التلقائي عند وصول رسالة مكررة");
assert.equal(automaticEvents.length, 1, "الرسالة المكررة لا تمر إلى مسارات الرد التلقائي");
assert.ok(automaticEvents[0].content?.react, "الرسالة المكررة تتحول إلى تفاعل فقط");

const eventsBeforeBotMessage = automaticEvents.length;
const botAllowed = await allowIncomingMessageProcessing({ fromMe: true, isGroup: true, isCommand: false }, primarySock);
assert.equal(botAllowed, false, "المعالج يرفض رسالة البوت قبل الردود التلقائية");
assert.equal(automaticEvents.length, eventsBeforeBotMessage, "رسالة البوت تتوقف مبكراً قبل الردود التلقائية");

const childId = "201333333333";
jadibotSessions.set(childId, { jid: `${childId}@s.whatsapp.net`, status: "متصل" });
const childAllowed = await allowIncomingMessageProcessing({
  sender: `${childId}@s.whatsapp.net`,
  fromMe: false,
  isGroup: true,
  isCommand: false,
  chat: "priority-test@g.us",
  body: "منشن صادر من بوت فرعي",
  groupMembers: participants,
  react: async () => { automaticEvents.push({ unexpected: true }); },
}, primarySock);
jadibotSessions.delete(childId);
assert.equal(childAllowed, false, "رسالة البوت الفرعي النشط تتوقف عبر isKnownBotSender");
assert.equal(automaticEvents.length, eventsBeforeBotMessage, "رسالة البوت الفرعي لا تصل إلى أي مسار رد تلقائي");

config.bot.primaryNumber = originalPrimary;
console.log("✅ handler speaker-priority integration test passed");
process.exit(0);
