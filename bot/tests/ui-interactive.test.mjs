/**
 * ui-interactive.test.mjs
 *
 * Guards the interactive layer: buttons and dropdown lists use the same
 * Baileys native-flow mechanism as the original bot, every button id is a
 * REAL command (never decorated text), every message carries the unified
 * footer and the channel context, and the whole thing degrades to plain text
 * without losing any information when buttons are unavailable.
 */
import assert from "node:assert/strict";
import { initDatabase } from "../src/lib/maro-database.js";

await initDatabase("./database/main");
const { loadPlugins, pluginStore } = await import("../src/lib/maro-plugins.js");
await loadPlugins(process.cwd() + "/plugins");
const { extendSocket } = await import("../src/lib/maro-socket.js");
const config = (await import("../config.js")).default;
const engine = await import("../src/lib/ui/menu-engine.js");
const { footerLine, channelContext, buttonsAsText } = await import("../src/lib/ui/interactive.js");

const BOT = "2348093093240";
const USER = "201016948771";
const viewer = { pushName: "Tester", isGroup: false, args: [], chat: `${USER}@s.whatsapp.net` };

// ── 1. footer carries brand + version + channel ───────────────────────
const footer = footerLine();
assert.match(footer, /v\d/, "footer must carry the version");
assert.ok(footer.includes(config.saluran.name.trim()), "footer must carry the channel name");

// ── 2. channel context is attached and well formed ────────────────────
const ctx = channelContext();
assert.ok(ctx.forwardedNewsletterMessageInfo, "channel context must be present");
assert.equal(ctx.forwardedNewsletterMessageInfo.newsletterJid, config.saluran.id);
assert.equal(ctx.isForwarded, true);

// ── 3. every button id must resolve to a real command ─────────────────
const resolves = (raw) => {
  const body = String(raw).replace(config.command.prefix, "").trim().split(/\s+/)[0].toLowerCase();
  return !!(pluginStore.commands.get(body) ||
            pluginStore.commands.get(pluginStore.aliases.get(body) || "\u0000"));
};
const collect = (buttons) => {
  const ids = [];
  for (const b of buttons) {
    const p = JSON.parse(b.buttonParamsJson);
    if (b.name === "single_select") for (const s of p.sections) for (const r of s.rows) ids.push(r.id);
    else if (b.name === "quick_reply") ids.push(p.id);
  }
  return ids;
};
const allButtons = [
  ...engine.homeButtons(viewer),
  ...engine.categoriesButtons(viewer),
  ...engine.categoryButtons(viewer, "ai", 1, 6),
  ...engine.allCommandsButtons(viewer, 1, 3),
  ...engine.searchButtons(viewer, engine.searchCommands("برات", engine.viewerContext(viewer), { limit: 5 })),
];
assert.ok(allButtons.length >= 8, "the screens must produce buttons");
const ids = collect(allButtons);
assert.ok(ids.length > 10, "buttons must expose command ids");
for (const id of ids) {
  assert.ok(resolves(id), `button id "${id}" must resolve to a real command`);
  // ids must never be decorated with Mathematical Alphanumerics
  assert.ok(!/[\u{1D400}-\u{1D7FF}]/u.test(id), `button id "${id}" must stay literal`);
}

// ── 4. at most 3 buttons per message (WhatsApp limit) ─────────────────
for (const [label, b] of [
  ["home", engine.homeButtons(viewer)],
  ["category", engine.categoryButtons(viewer, "ai", 1, 6)],
  ["allCommands", engine.allCommandsButtons(viewer, 1, 3)],
]) {
  assert.ok(b.length <= 3, `${label} must not exceed 3 buttons, got ${b.length}`);
}

// ── 5. the real send path produces an interactive message ─────────────
const sent = [];
const sock = {
  user: { id: `${BOT}:1@s.whatsapp.net`, name: "Bot", jid: `${BOT}@s.whatsapp.net` },
  sendMessage: async (_j, c) => { sent.push(c); return { key: { id: "X" } }; },
  relayMessage: async () => ({}), sendPresenceUpdate: async () => {}, readMessages: async () => {},
  groupMetadata: async () => ({ participants: [] }), onWhatsApp: async () => [],
  profilePictureUrl: async () => { throw new Error("none"); },
  sendReceipt: async () => {}, ev: { on() {} }, ws: { readyState: 1 },
};
extendSocket(sock);
const { messageHandler } = await import("../src/handler.js");
const gate = config.registration.enabled;
config.registration.enabled = false;
try {
  const raw = (body) => ({
    key: { remoteJid: `${USER}@s.whatsapp.net`, fromMe: false, id: "I" + Math.random().toString(16).slice(2) },
    message: { conversation: body },
    messageTimestamp: Math.floor(Date.now() / 1000), pushName: "Tester",
  });
  sent.length = 0;
  await messageHandler(raw(`${config.command.prefix}menu`), sock);
  assert.equal(sent.length, 1, "menu must send exactly one message");
  const msg = sent[0];
  assert.ok(Array.isArray(msg.interactiveButtons) && msg.interactiveButtons.length >= 2,
    "the menu must ship interactive buttons");
  assert.ok(msg.footer && msg.footer.length > 0, "the menu must carry a footer");
  assert.ok(msg.contextInfo?.forwardedNewsletterMessageInfo,
    "the menu must carry the channel context");
  assert.ok((msg.caption || "").length > 100, "the menu body must be present");
} finally {
  config.registration.enabled = gate;
}

// ── 6. graceful degradation: no sendButton => text keeps every command ─
const plain = { ...sock };
delete plain.sendButton;
const asText = buttonsAsText(engine.homeButtons(viewer));
for (const id of collect(engine.homeButtons(viewer))) {
  assert.ok(asText.includes(id), `text fallback must still list "${id}"`);
}

console.error("ui interactive (buttons + footer + channel) tests: passed");
process.exit(0);
