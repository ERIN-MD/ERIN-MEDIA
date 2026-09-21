/**
 * ui-menu-engine.test.mjs
 * Snapshot + behaviour tests for the AXION menu engine and the four rewired
 * menu plugins. Guards: command/alias contracts, permission-aware rendering,
 * pagination, search safety, and typography protection rules.
 */
import assert from "node:assert/strict";
import { initDatabase } from "../src/lib/maro-database.js";

await initDatabase("./database/main");
const { loadPlugins, pluginStore } = await import("../src/lib/maro-plugins.js");
await loadPlugins(process.cwd() + "/plugins");

const engine = await import("../src/lib/ui/menu-engine.js");
const ui = (await import("../src/lib/ui/components.js")).default;
const style = (await import("../src/lib/ui/typography.js")).default;

// ── 1. الأوامر الأربع ما زالت مسجّلة بأسمائها ومرادفاتها ───────────
const CONTRACTS = {
  menu: ["help", "اوامر", "commands", "m", "أوامر"],
  "الأوامر": ["allmenu"],
  "فئة": ["menucat"],
  "بحث": ["carifitur"],
};
for (const [name, aliases] of Object.entries(CONTRACTS)) {
  const p = pluginStore.commands.get(name.toLowerCase());
  assert.ok(p, `command "${name}" must stay registered`);
  for (const a of aliases) {
    assert.equal(
      pluginStore.aliases.get(a.toLowerCase()),
      name.toLowerCase(),
      `alias "${a}" must still resolve to "${name}"`,
    );
  }
}

// ── 2. العرض حسب الصلاحية ─────────────────────────────────────────
const publicUser = { pushName: "زائر", isGroup: false };
const owner = { pushName: "المالك", isGroup: false, isOwner: true };

const vPublic = engine.viewerContext(publicUser);
const vOwner = engine.viewerContext(owner);
assert.equal(engine.viewerTier(vPublic), "مستخدم عام");
assert.equal(engine.viewerTier(vOwner), "مالك");

const availPublic = engine.visibleCommands(vPublic, { mode: "available" });
const availOwner = engine.visibleCommands(vOwner, { mode: "available" });
assert.ok(availOwner.length > availPublic.length, "owner must see more commands");
assert.ok(
  availPublic.every((c) => !c.isOwner),
  "no owner-only command may appear as available to a public user",
);

// ── 3. القائمة الرئيسية تُبنى ولا تفرّغ ─────────────────────────────
for (const [label, who] of [["public", publicUser], ["owner", owner]]) {
  const home = engine.renderHome(who, { uptime: "1س" });
  assert.ok(home.length > 200, `${label} home must render`);
  assert.match(home, /الأقسام/, `${label} home must list categories`);
  assert.match(home, /AXION|أكسيون/, `${label} home must carry the brand`);
  // الهوية القديمة يجب ألا تظهر
  assert.doesNotMatch(home, /╭┈|╰┈|⬡/, `${label} home must not reuse the legacy frame`);
}

// ── 4. ترقيم صفحات الأقسام ────────────────────────────────────────
const cats = engine.visibleCategories(vPublic, { mode: "all" });
const big = cats.find((c) => c.count > 20);
assert.ok(big, "expected at least one large category to paginate");
const p1 = engine.renderCategory(publicUser, big.key, 1);
const p2 = engine.renderCategory(publicUser, big.key, 2);
assert.notEqual(p1, p2, "page 2 must differ from page 1");
assert.match(p1, /⟨ 1\//, "page indicator must be present");
// صفحة خارج المدى تنزلق لآخر صفحة بدل الانهيار
const pBig = engine.renderCategory(publicUser, big.key, 9999);
assert.ok(pBig.length > 100, "out-of-range page must still render");

// ── 5. قسم غير موجود لا يرمي استثناءً ──────────────────────────────
const unknown = engine.renderCategory(publicUser, "لا-يوجد-هذا-القسم", 1);
assert.match(unknown, /قسم غير معروف/);

// ── 6. البحث: تطابق تام + تطبيع عربي ──────────────────────────────
assert.ok(engine.findCommandExact("menu"), "exact lookup by name");
assert.ok(engine.findCommandExact("allmenu"), "exact lookup by alias");
assert.equal(engine.findCommandExact("mEnU")?.name, "menu", "case folding");
assert.equal(engine.findCommandExact("لا-يوجد"), null);
assert.equal(engine.normalizeSearch("الأوامر"), engine.normalizeSearch("الاوامر"));
assert.equal(engine.normalizeSearch("فئة"), engine.normalizeSearch("فئه"));
const found = engine.searchCommands("منيو", vPublic, { limit: 5 });
assert.ok(Array.isArray(found), "search must always return an array");

// ── 7. الطباعة: الحماية مطلقة ──────────────────────────────────────
for (const protectedText of [
  "https://example.com/a?b=1",
  "user@example.com",
  "201225655220@s.whatsapp.net",
  "```const a = 1```",
  "`npm test`",
  "./src/lib/ui/theme.js",
]) {
  assert.equal(
    style.subtitle(protectedText),
    protectedText,
    `protected text must pass through untouched: ${protectedText}`,
  );
}
// معرّف الأمر يبقى حرفياً بالكامل
assert.equal(style.command("menu"), "`menu`");
assert.ok(!/[\u{1D400}-\u{1D7FF}]/u.test(style.command("menu")), "command ids must never be styled");
// الزخرفة اللاتينية تعمل للعلامة
assert.match(style.identity("AXION"), /[\u{1D400}-\u{1D7FF}]/u);
// العربية لا تُشوَّه أبداً
const ar = "قائمة الأوامر";
assert.equal(style.title(ar), `*${ar}*`, "Arabic must use WhatsApp emphasis, never mangled glyphs");

// ── 8. وضع plain يعطّل كل الزخرفة ──────────────────────────────────
style.setMode("plain");
assert.equal(style.title("AXION"), "AXION");
assert.equal(style.subtitle("مرحبا"), "مرحبا");
style.setMode("luxury");

// ── 9. لبنات الواجهة ───────────────────────────────────────────────
assert.match(ui.success("تم"), /✓/);
assert.match(ui.error("فشل"), /✕/);
assert.match(ui.locked("مقفل"), /⌾/);
assert.match(ui.loading("uploading"), /جارٍ الرفع/);
assert.equal(ui.pagination({ page: 1, pages: 1 }), "", "single page renders no pager");
const pg = ui.paginate([1, 2, 3, 4, 5], 2, 2);
assert.deepEqual(pg.items, [3, 4]);
assert.equal(pg.pages, 3);

console.error("AXION ui/menu engine tests: passed");
process.exit(0);
