/**
 * security-identity.test.mjs
 * Regression guard for the privilege-escalation fixes:
 *  1. loose (endsWith/includes) identity matching in config.js
 *  2. newsletter chats being granted owner privileges in maro-serialize.js
 */
import assert from "node:assert/strict";
import { initDatabase } from "../src/lib/maro-database.js";

await initDatabase("./database/main");
const cfg = (await import("../config.js")).default;
const { isOwner, isPremium, isBanned, isSelf, setBotNumber, normalizeIdentity } =
  await import("../config.js");

const OWNER = cfg.owner.number[0];

// --- 1. exact matching only --------------------------------------------
assert.equal(isOwner(OWNER), true, "the real owner must still be owner");
assert.equal(isOwner(`${OWNER}:12@s.whatsapp.net`), true, "device suffix + JID must still resolve");
assert.equal(isOwner(`+${OWNER}`), true, "leading + must be tolerated");
for (const impostor of ["20", "220", "5655220", "25655220", `99${OWNER}`, `1${OWNER}`, `${OWNER}9`]) {
  assert.equal(isOwner(impostor), false, `${impostor} must NOT be owner`);
}

// --- 2. bot number must not leak ownership via substrings ---------------
setBotNumber(cfg.session.pairingNumber);
assert.equal(isOwner(cfg.session.pairingNumber), true, "bot's own number stays privileged");
for (const sub of ["240", "3240", "093093240", "8093093240", "34809309324"]) {
  assert.equal(isOwner(sub), false, `substring ${sub} must NOT be owner`);
  assert.equal(isSelf(sub), false, `substring ${sub} must NOT be self`);
}

// --- 3. premium / banned use the same strict rule -----------------------
cfg.premiumUsers = ["201111111111"];
assert.equal(isPremium("201111111111"), true);
assert.equal(isPremium("1111111"), false, "suffix must not grant premium");
assert.equal(isPremium("99201111111111"), false, "prefix must not grant premium");
cfg.premiumUsers = [];

// --- 4. normalizeIdentity contract --------------------------------------
assert.equal(normalizeIdentity("+20 122 565 5220"), "201225655220");
assert.equal(normalizeIdentity("201225655220:7@s.whatsapp.net"), "201225655220");
assert.equal(normalizeIdentity(null), "");
assert.equal(normalizeIdentity(undefined), "");

// --- 5. newsletter chats must NOT be privileged --------------------------
const { serialize } = await import("../src/lib/maro-serialize.js");
const sock = {
  user: { id: `${cfg.session.pairingNumber}:1@s.whatsapp.net`, name: "bot" },
  sendMessage: async () => ({}),
  groupMetadata: async () => ({ participants: [] }),
  onWhatsApp: async () => [],
  profilePictureUrl: async () => null,
};
const mkMsg = (remoteJid) => ({
  key: { remoteJid, fromMe: false, id: "ID" + Math.random().toString(16).slice(2) },
  message: { conversation: ">> return 'pwned'" },
  messageTimestamp: Math.floor(Date.now() / 1000),
  pushName: "Channel Admin",
});

for (const jid of ["120999999999999999@newsletter", cfg.saluran.id]) {
  const m = await serialize(sock, mkMsg(jid), {});
  assert.equal(m.isNewsletter, true, "still recognised as a newsletter");
  assert.equal(m.isOwner, false, `newsletter ${jid} must NOT be owner`);
  assert.equal(m.isPremium, false, `newsletter ${jid} must NOT be premium`);
  assert.equal(m.isPartner, false, `newsletter ${jid} must NOT be partner`);
}

console.error("security identity + newsletter privilege tests: passed");
process.exit(0);
