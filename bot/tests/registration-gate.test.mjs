/**
 * registration-gate.test.mjs
 *
 * Regression guard for a total lockout that shipped in the original bot:
 * config.registration.enabled is true, so every command from a non-registered,
 * non-owner, non-premium user is answered with "type .تسجيل" — but no plugin
 * ever registered the name `تسجيل`. The only registered names were `daftar`
 * and `register`, so users who followed the bot's own instructions got nothing
 * and the bot appeared completely unresponsive.
 */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { initDatabase } from "../src/lib/maro-database.js";

const dbRoot = await fs.mkdtemp(path.join(os.tmpdir(), "marobot-reg-"));
const db = await initDatabase(path.join(dbRoot, "main"));
const { loadPlugins, pluginStore } = await import("../src/lib/maro-plugins.js");
await loadPlugins(process.cwd() + "/plugins");
const { messageHandler } = await import("../src/handler.js");
const config = (await import("../config.js")).default;

// ── 1. whatever the gate tells the user to type MUST be a real command ──
const handlerSource = await fs.readFile(new URL("../src/handler.js", import.meta.url), "utf8");
const told = handlerSource.match(
  /التسجيل مطلوب[\s\S]{0,300}?\$\{m\.prefix\}([\u0600-\u06FF\w_]+)/,
);
const promptedCommand = told[1].trim().toLowerCase();

const resolves = (name) =>
  pluginStore.commands.get(name) ||
  pluginStore.commands.get(pluginStore.aliases.get(name) || "\u0000");

assert.ok(
  resolves(promptedCommand),
  `the registration prompt tells users to type "${promptedCommand}" — it must resolve to a real command`,
);

// ── 2. the usual Arabic and Latin spellings all reach the same plugin ───
const target = resolves("daftar");
for (const spelling of ["daftar", "register", "تسجيل", "التسجيل", "سجل"]) {
  assert.equal(resolves(spelling), target, `"${spelling}" must reach the register plugin`);
}

// ── 3. end to end: a brand-new user is not locked out ──────────────────
assert.equal(config.registration.enabled, true, "this test covers the gated configuration");
const USER = "209999999999";
const sent = [];
const sock = {
  user: { id: "2348093093240:1@s.whatsapp.net", name: "Bot" },
  sendMessage: async (_jid, c) => { sent.push(c); return { key: {} }; },
  relayMessage: async () => ({}), sendPresenceUpdate: async () => {},
  readMessages: async () => {}, groupMetadata: async () => ({ participants: [] }),
  onWhatsApp: async () => [], profilePictureUrl: async () => null,
  sendReceipt: async () => {}, ws: { readyState: 1 },
};
const raw = (body) => ({
  key: { remoteJid: `${USER}@s.whatsapp.net`, fromMe: false, id: "R" + Math.random().toString(16).slice(2) },
  message: { conversation: body },
  messageTimestamp: Math.floor(Date.now() / 1000),
  pushName: "NewUser",
});
const say = async (body) => { sent.length = 0; await messageHandler(raw(body), sock); return sent.map((c) => c.text ?? c.caption ?? "").join("\n"); };

const gated = await say(`${config.command.prefix}menu`);
assert.match(gated, /التسجيل مطلوب/, "an unregistered user is still gated (unchanged behaviour)");

const started = await say(`${config.command.prefix}${promptedCommand}`);
assert.ok(started.length > 0, "the prompted command must NOT be silent — that was the deadlock");
assert.doesNotMatch(started, /التسجيل مطلوب/, "it must start registration, not repeat the gate");

delete db.db.data.users[`${USER}@s.whatsapp.net`];
await fs.rm(dbRoot, { recursive: true, force: true });
console.error("registration gate tests: passed");
process.exit(0);
