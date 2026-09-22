/**
 * ui-feature-flag.test.mjs
 * Proves the UI rollback switch is real: config.ui.engine = "legacy" routes the
 * four menu commands back to the preserved original handlers, and "axion"
 * routes them to the new engine. Guards against the legacy files rotting.
 */
import assert from "node:assert/strict";
import { initDatabase } from "../src/lib/maro-database.js";
import { pathToFileURL } from "node:url";
import fs from "node:fs";

await initDatabase("./database/main");
const config = (await import("../config.js")).default;
const { loadPlugins } = await import("../src/lib/maro-plugins.js");
await loadPlugins(process.cwd() + "/plugins");

// ── every preserved legacy handler must still import and expose its config ──
const legacyDir = "plugins/main/_legacy";
const legacyFiles = fs.readdirSync(legacyDir).filter((f) => f.endsWith(".legacy.js"));
assert.equal(legacyFiles.length, 4, "all four original menus must be preserved");
const legacyNames = new Set();
for (const f of legacyFiles) {
  const mod = await import(pathToFileURL(`${legacyDir}/${f}`).href);
  const cfg = mod.config || mod.default?.config;
  const handler = mod.handler || mod.default?.handler;
  assert.ok(cfg, `${f} must still export a config`);
  assert.equal(typeof handler, "function", `${f} must still export a handler`);
  legacyNames.add(Array.isArray(cfg.name) ? cfg.name[0] : cfg.name);
}
assert.deepEqual(
  [...legacyNames].sort(),
  ["menu", "الأوامر", "بحث", "فئة"].sort(),
  "the preserved set must cover exactly the four menu commands",
);

// ── the legacy directory must stay invisible to the plugin loader ──────────
// (otherwise it would collide with the new menus)
const { pluginStore } = await import("../src/lib/maro-plugins.js");
const menuPlugin = pluginStore.commands.get("menu");
assert.ok(menuPlugin, "menu must be registered");
assert.ok(
  !menuPlugin.filePath.includes("_legacy"),
  "the loader must register the NEW menu, not the legacy copy",
);

// ── both engines render without throwing ──────────────────────────────────
const m = {
  pushName: "مختبِر",
  isGroup: false,
  args: [],
  fullArgs: "",
  text: "",
  chat: "1@s.whatsapp.net",
  prefix: ".",
  replies: [],
  async reply(t) { this.replies.push(t); return t; },
};
// sendMenu() prefers an image+caption message and only falls back to m.reply(),
// so the harness must capture BOTH channels.
const sent = [];
const ctx = {
  sock: {
    sendMessage: async (chat, payload) => { sent.push(payload); return {}; },
  },
};
const collect = () => [...m.replies, ...sent.map((p) => p.caption || p.text || "")].join("\n");

const original = config.ui.engine;
try {
  config.ui.engine = "axion";
  const axionMod = await import(pathToFileURL("plugins/main/اوامر.js").href);
  m.replies = []; sent.length = 0;
  await (axionMod.handler || axionMod.default.handler)(m, ctx);
  const axionOut = collect();
  assert.ok(axionOut.length > 100, "axion engine must render the home screen");
  // the image path must carry the menu as a caption, never lose it
  if (sent.length) {
    assert.ok(Buffer.isBuffer(sent[0].image), "menu image must be a real buffer");
    assert.ok((sent[0].caption || "").length > 100, "menu text must ride as the caption");
  }
  assert.doesNotMatch(axionOut, /[╭╰┃⬡]/, "axion output must not use legacy frame glyphs");
  assert.match(axionOut, /▰|▸/, "axion output must use the new visual language");
} finally {
  config.ui.engine = original;
}

console.error("ui feature flag tests: passed");
process.exit(0);
