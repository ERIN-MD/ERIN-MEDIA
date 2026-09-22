/**
 * maro-text-style.test.mjs
 *
 * ⚠️ CONTRACT UPDATED — INTENTIONAL.
 * The previous revision asserted the *legacy* visual identity
 * (⟡ 📌 title ⟡ / ➤ *الاستخدام:* / "> … Tarboo Bot").
 * That visual identity was deliberately and completely replaced by the AXION
 * design system, so those assertions no longer describe the intended output.
 * The behavioural contract that must NOT change is preserved and asserted below:
 *   • the same exported function signatures
 *   • title, usage/example and details all still surface in the output
 *   • a footer is still emitted
 *   • command strings stay literal (copy-pasteable)
 * Plus new invariants: no legacy frame glyphs may come back.
 */
import assert from "node:assert/strict";
import { commandGuide, statusPanel, formatTextPanel, getFooter } from "../src/lib/maro-text-style.js";
import style from "../src/lib/ui/typography.js";

// ── signatures preserved ───────────────────────────────────────
for (const fn of [commandGuide, statusPanel, formatTextPanel, getFooter]) {
  assert.equal(typeof fn, "function");
}

// ── commandGuide keeps surfacing everything it used to ─────────
const guide = commandGuide({
  title: "تحويل النص إلى صوت",
  command: ".صوت <نص>",
  example: ".صوت مرحباً",
});
assert.match(guide, /تحويل النص إلى صوت/, "title must still appear");
assert.match(guide, /الاستخدام/, "usage section must still appear");
assert.ok(guide.includes(".صوت <نص>"), "the command must appear verbatim");
assert.ok(guide.includes(".صوت مرحباً"), "the example must appear verbatim");
assert.match(guide, /`\.صوت <نص>`/, "commands must stay in literal backticks");

// ── statusPanel keeps its details ──────────────────────────────
const status = statusPanel({ title: "تم التفعيل", details: ["*النوع:* 🎙️ صوت"] });
assert.match(status, /تم التفعيل/);
assert.match(status, /\*النوع:\* 🎙️ صوت/, "detail lines must pass through untouched");

// ── formatTextPanel ────────────────────────────────────────────
const panel = formatTextPanel({ title: "لوحة", lines: ["سطر ١", "سطر ٢"] });
assert.match(panel, /لوحة/);
assert.match(panel, /سطر ١/);
assert.match(panel, /سطر ٢/);

// ── a footer is still emitted, consistently, by all three ──────
// NOTE: the brand mark is rendered with Mathematical Alphanumeric codepoints,
// so a plain /AXION/ regex will NOT match it — strip() first. This is exactly
// why style.strip() exists and why no code should grep styled output directly.
assert.ok(getFooter().length > 0, "getFooter must stay non-empty for compatibility");
for (const [label, out] of [["guide", guide], ["status", status], ["panel", panel]]) {
  assert.match(out, /⌁/, `${label} must carry a footer marker`);
  assert.match(style.strip(out), /AXION|أكسيون/, `${label} must carry the brand footer`);
}

// ── new identity invariants: the legacy frame must not return ──
for (const [label, out] of [["guide", guide], ["status", status], ["panel", panel]]) {
  assert.doesNotMatch(out, /[╭╰┃⬡]/, `${label} must not reuse legacy frame glyphs`);
}

console.error("text style tests (AXION contract): passed");
