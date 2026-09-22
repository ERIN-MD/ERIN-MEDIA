import config from "../../config.js";
import { getActiveJadibots } from "./maro-jadibot-manager.js";

const recentReplies = new Map();
const messageDecisions = new WeakMap();
const REPLY_WINDOW_MS = 20_000;

function bareJid(value = "") { return String(value).split(":")[0].replace(/@.+$/, ""); }

function isKnownBotSender(m) {
  const sender = bareJid(m.sender);
  const children = getActiveJadibots().map((item) => bareJid(item.jid));
  return m.fromMe || children.includes(sender);
}

function shouldReplyAsBot(m, sock) {
  if (messageDecisions.has(m)) return messageDecisions.get(m);
  if (isKnownBotSender(m)) return { allowed: false, reason: "bot-message" };
  const self = bareJid(sock.user?.id);
  const primary = bareJid(config.bot?.primaryNumber || process.env.MAROBOT_PRIMARY_NUMBER || "");
  const children = getActiveJadibots().map((item) => bareJid(item.jid)).filter(Boolean);
  const members = (m.groupMembers || m.groupMetadata?.participants || [])
    .map((member) => bareJid(member.id || member.jid || member))
    .filter(Boolean);
  const present = (jid) => !members.length || members.includes(jid);
  const upgraded = (config.bot?.prioritySubBotNumbers || process.env.MAROBOT_PRIORITY_SUBBOTS || [])
    .toString()
    .split(",")
    .map(bareJid)
    .filter((jid) => children.includes(jid) && present(jid));
  const available = [self, ...children].filter((jid) => present(jid));
  const candidate = primary && present(primary)
    ? primary
    : upgraded[0] || available.sort()[0];
  if (candidate && self !== candidate) {
    const decision = { allowed: false, reason: "speaker-priority" };
    messageDecisions.set(m, decision);
    return decision;
  }
  const key = `${m.chat}:${bareJid(m.sender)}:${String(m.body || "").slice(0, 80)}`;
  const last = recentReplies.get(key) || 0;
  if (Date.now() - last < REPLY_WINDOW_MS) {
    const decision = { allowed: false, reason: "rate-limit" };
    messageDecisions.set(m, decision);
    return decision;
  }
  recentReplies.set(key, Date.now());
  const decision = { allowed: true, reason: "" };
  messageDecisions.set(m, decision);
  return decision;
}

export { isKnownBotSender, shouldReplyAsBot };
