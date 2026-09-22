// ═══════════════════════════════════════════════════════════════
// 📁 src/lib/ui/components.js
// 🧩 AXION UI Primitives — كل رد في البوت يُبنى من هذه اللبنات
// ═══════════════════════════════════════════════════════════════

import style from "./typography.js";
import { GLYPH, RULES, BADGE, STATE, categoryIcon, categoryLabel } from "./theme.js";
import identity from "./identity.js";

const NL = "\n";
const clean = (v) => String(v ?? "").trim();
/** يزيل الأسطر الفارغة الزائدة ويحافظ على تنفّس التصميم */
const compact = (lines) =>
  lines
    .filter((l) => l !== null && l !== undefined)
    .join(NL)
    .replace(/\n{3,}/g, "\n\n")
    .trim();

// ── الترويسة ───────────────────────────────────────────────────
/**
 * ترويسة العلامة.
 * ◆  AXION · أكسيون
 *    منصّة الأوامر الموحّدة
 * ▰▰▰▰▰▰▰▰▰▰▰
 */
function header(title, subtitle) {
  const name = clean(title) || identity.brandName;
  const sub = clean(subtitle) || identity.tagline;
  const out = [`${GLYPH.brand}  ${style.identity(name)}`];
  if (sub) out.push(`${" ".repeat(3)}${style.subtitle(sub)}`);
  out.push(RULES.heavy);
  return out.join(NL);
}

/** ترويسة مصغّرة لرد أمر واحد */
function miniHeader(title, icon = GLYPH.brandAlt) {
  return `${icon} ${style.title(clean(title))}`;
}

// ── الأقسام والصفوف ────────────────────────────────────────────
function section(title, icon = GLYPH.section) {
  return `${icon} ${style.section(clean(title))}`;
}

/** صف مفتاح/قيمة: `· التسمية   القيمة` */
function row(label, value, icon = GLYPH.item) {
  const l = clean(label);
  const v = clean(value);
  if (!v) return `${icon} ${style.label(l)}`;
  return `${icon} ${style.label(l)}  ${style.value(v)}`;
}

/** عنصر قائمة مرقّم: `01 ▸ الاسم   ⟨12⟩` */
function listItem(index, text, meta) {
  const head = `${style.ordinal(index)} ${GLYPH.section} ${clean(text)}`;
  return meta ? `${head}  ${chip(meta)}` : head;
}

/** صف أمر داخل قائمة فئة */
function commandRow(name, badges = []) {
  const marks = badges.filter(Boolean).join(" ");
  return `${GLYPH.bullet} ${style.command(name)}${marks ? `  ${marks}` : ""}`;
}

function divider(kind = "light") {
  return RULES[kind] || RULES.light;
}

function chip(text) {
  return `⟨ ${clean(text)} ⟩`;
}

function badge(kind) {
  return BADGE[kind] || "";
}

/** يحوّل إعدادات إضافة إلى شارات صلاحيات */
function permissionBadges(cfg = {}) {
  const out = [];
  if (cfg.isOwner) out.push(BADGE.owner);
  if (cfg.isPartner) out.push(BADGE.partner);
  if (cfg.isPremium) out.push(BADGE.premium);
  if (cfg.isAdmin) out.push(BADGE.admin);
  if (cfg.isBotAdmin) out.push(BADGE.botAdmin);
  if (cfg.isGroup) out.push(BADGE.group);
  if (cfg.isPrivate) out.push(BADGE.private);
  if (cfg.isEnabled === false) out.push(BADGE.disabled);
  return out;
}

// ── التذييل ────────────────────────────────────────────────────
function footer(note) {
  if (!identity.showFooter) return "";
  // التوقيع وحده يحمل الزخرفة الرياضية؛ الإصدار يبقى حرفياً ليُقرأ بوضوح.
  const line = clean(note)
    ? style.subtitle(clean(note))
    : `${style.identity(identity.signature)} ${GLYPH.dot} v${identity.version}`;
  return `${RULES.light}${NL}${GLYPH.spark} ${line}`;
}

// ── البطاقات المركّبة ──────────────────────────────────────────
/**
 * بطاقة موحّدة: ترويسة + أقسام + تذييل.
 * @param {{title?:string, subtitle?:string, icon?:string,
 *          sections?:{title?:string, icon?:string, lines?:string[]}[],
 *          body?:string, note?:string, footerNote?:string, compactHeader?:boolean}} spec
 */
function card(spec = {}) {
  const parts = [];
  if (spec.compactHeader) parts.push(miniHeader(spec.title, spec.icon));
  else parts.push(header(spec.title, spec.subtitle));
  parts.push("");

  if (spec.body) parts.push(clean(spec.body), "");

  for (const sec of spec.sections || []) {
    if (!sec) continue;
    if (sec.title) parts.push(section(sec.title, sec.icon));
    for (const line of sec.lines || []) parts.push(line);
    parts.push("");
  }

  if (spec.note) parts.push(`${GLYPH.info} ${style.subtitle(spec.note)}`, "");
  const f = footer(spec.footerNote);
  if (f) parts.push(f);
  return compact(parts);
}

// ── حالات موحّدة ───────────────────────────────────────────────
function stateLine(key, detail) {
  const s = STATE[key] || STATE.processing;
  return `${s.glyph} ${style.section(s.ar)}${detail ? `  ${GLYPH.dot} ${clean(detail)}` : ""}`;
}

function success(message, detail) {
  return compact([`${GLYPH.success} ${style.section(clean(message))}`, detail ? clean(detail) : null]);
}
function error(message, hint) {
  return compact([
    `${GLYPH.error} ${style.section(clean(message))}`,
    hint ? `${GLYPH.info} ${style.subtitle(clean(hint))}` : null,
  ]);
}
function warning(message, hint) {
  return compact([
    `${GLYPH.warning} ${style.section(clean(message))}`,
    hint ? `${GLYPH.info} ${style.subtitle(clean(hint))}` : null,
  ]);
}
function info(message) {
  return `${GLYPH.info} ${clean(message)}`;
}
function loading(key = "processing", detail) {
  return stateLine(key, detail);
}
function empty(message = STATE.empty.ar) {
  return `${STATE.empty.glyph} ${style.section(clean(message))}`;
}
function locked(message, hint) {
  return compact([
    `${GLYPH.locked} ${style.section(clean(message))}`,
    hint ? `${GLYPH.info} ${style.subtitle(clean(hint))}` : null,
  ]);
}

// ── ترقيم الصفحات ──────────────────────────────────────────────
/**
 * @param {{page:number,pages:number,total:number,hintCommand?:string}} spec
 */
function pagination({ page, pages, total, hintCommand } = {}) {
  if (!pages || pages <= 1) return "";
  const bar = Array.from({ length: Math.min(pages, 12) }, (_, i) =>
    i + 1 === page ? GLYPH.active : GLYPH.inactive,
  ).join("");
  const lines = [`${bar}  ${chip(`${page}/${pages}`)}${total ? `  ${GLYPH.dot} ${total}` : ""}`];
  if (hintCommand) lines.push(`${GLYPH.arrow} ${style.command(hintCommand)}`);
  return lines.join(NL);
}

/** يقسّم مصفوفة إلى صفحة واحدة */
function paginate(items, page = 1, perPage = identity.itemsPerPage) {
  const list = Array.isArray(items) ? items : [];
  const size = Math.max(1, Number(perPage) || 1);
  const pages = Math.max(1, Math.ceil(list.length / size));
  const current = Math.min(Math.max(1, Number(page) || 1), pages);
  return {
    page: current,
    pages,
    total: list.length,
    items: list.slice((current - 1) * size, current * size),
  };
}

const ui = {
  style,
  GLYPH,
  RULES,
  BADGE,
  STATE,
  identity,
  categoryIcon,
  categoryLabel,
  header,
  miniHeader,
  section,
  row,
  listItem,
  commandRow,
  divider,
  chip,
  badge,
  permissionBadges,
  footer,
  card,
  stateLine,
  success,
  error,
  warning,
  info,
  loading,
  empty,
  locked,
  pagination,
  paginate,
  compact,
};

export default ui;
export {
  ui, header, miniHeader, section, row, listItem, commandRow, divider, chip,
  badge, permissionBadges, footer, card, stateLine, success, error, warning,
  info, loading, empty, locked, pagination, paginate,
};
