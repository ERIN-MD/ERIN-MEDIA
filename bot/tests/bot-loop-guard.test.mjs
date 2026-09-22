import assert from "node:assert/strict";
import config from "../config.js";
import { isKnownBotSender, shouldReplyAsBot } from "../src/lib/maro-bot-loop-guard.js";

const originalPrimary = config.bot.primaryNumber;
const originalPrioritySubs = config.bot.prioritySubBotNumbers;
config.bot.primaryNumber = "201034648449";
config.bot.prioritySubBotNumbers = [];

const groupMembers = [
  { id: "201034648449@s.whatsapp.net" },
  { id: "201111111111@s.whatsapp.net" },
];
const humanMessage = {
  chat: "test-group@g.us",
  sender: "201999999999@s.whatsapp.net",
  body: "مرحبا يا مارو",
  fromMe: false,
  groupMembers,
};

assert.equal(isKnownBotSender({ ...humanMessage, fromMe: true }), true, "تُمنع رسالة البوت نفسه");
assert.equal(isKnownBotSender(humanMessage), false, "تُسمح رسالة المستخدم البشري");

const primary = shouldReplyAsBot(humanMessage, { user: { id: "201034648449:1@s.whatsapp.net" } });
assert.equal(primary.allowed, true, "البوت الرئيسي هو المتحدث");

const secondary = shouldReplyAsBot({ ...humanMessage, body: "رسالة مختلفة" }, { user: { id: "201111111111:1@s.whatsapp.net" } });
assert.equal(secondary.reason, "speaker-priority", "البوت الثانوي لا يتحدث عند وجود الرئيسي");

const first = shouldReplyAsBot({ ...humanMessage, body: "اختبار المهلة" }, { user: { id: "201034648449:1@s.whatsapp.net" } });
const repeated = shouldReplyAsBot({ ...humanMessage, body: "اختبار المهلة" }, { user: { id: "201034648449:1@s.whatsapp.net" } });
assert.equal(first.allowed, true, "يسمح بأول رد");
assert.equal(repeated.reason, "rate-limit", "يمنع الرد النصي المكرر داخل المهلة");

config.bot.primaryNumber = originalPrimary;
config.bot.prioritySubBotNumbers = originalPrioritySubs;
console.log("✅ bot-loop-guard.test.mjs passed");
process.exit(0);
