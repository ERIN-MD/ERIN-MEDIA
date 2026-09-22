// ═══════════════════════════════════════════════════════════════
// 📁 src/lib/ui/menu-engine.js
// 🧭 AXION Menu Engine
// ═══════════════════════════════════════════════════════════════
//   MENU ENGINE → CATEGORY ENGINE → COMMAND DISCOVERY
//   → PERMISSION FILTER → LAYOUT → TYPOGRAPHY → RENDERER
//
// كل شيء مشتق من pluginStore الحقيقي وقت التشغيل — لا قوائم مكتوبة يدوياً.
// ⚠️ الواجهة ليست طبقة أمان: الإخفاء هنا للعرض فقط، والتنفيذ يظل محمياً
//    في checkPermission داخل الـhandler.

import ui from "./components.js";
import identity from "./identity.js";
import { GLYPH } from "./theme.js";
import { pluginStore } from "../maro-plugins.js";
import { quickReply, listButton, urlButton } from "./interactive.js";
import config from "../../../config.js";

// ── ذاكرة مؤقتة للسجل (لا نمسح القرص عند كل استدعاء قائمة) ─────
let _cache = null;
let _cacheStamp = 0;

/** تُستدعى عند إضافة/حذف/إعادة تحميل إضافة */
function invalidateMenuCache() {
  _cache = null;
  _cacheStamp = 0;
}

const primaryName = (cfg) => {
  const n = Array.isArray(cfg.name) ? cfg.name[0] : cfg.name;
  return String(n ?? "").trim();
};

/**
 * COMMAND DISCOVERY — يبني فهرساً موحّداً من pluginStore.
 * @returns {{categories: Map<string, object[]>, commands: object[], stamp: number}}
 */
function buildRegistry() {
  const unique = new Set(pluginStore.commands.values());
  const commands = [];
  for (const plugin of unique) {
    const cfg = plugin?.config;
    if (!cfg) continue;
    const name = primaryName(cfg);
    if (!name) continue;
    const uiMeta = cfg.ui || {};
    commands.push({
      name,
      names: Array.isArray(cfg.name) ? cfg.name : [cfg.name].filter(Boolean),
      aliases: Array.isArray(cfg.alias) ? cfg.alias : cfg.alias ? [cfg.alias] : [],
      category: String(cfg.category ?? "uncategorized").toLowerCase(),
      description: String(cfg.description ?? ""),
      usage: String(cfg.usage ?? ""),
      example: String(cfg.example ?? ""),
      cooldown: Number(cfg.cooldown ?? 3),
      limit: Number(cfg.limit ?? 1),
      isOwner: !!cfg.isOwner,
      isPremium: !!cfg.isPremium,
      isPartner: !!cfg.isPartner,
      isAdmin: !!cfg.isAdmin,
      isBotAdmin: !!cfg.isBotAdmin,
      isGroup: !!cfg.isGroup,
      isPrivate: !!cfg.isPrivate,
      isEnabled: cfg.isEnabled !== false,
      // بيانات واجهة اختيارية، متوافقة رجعياً (غير موجودة = تجاهل)
      icon: uiMeta.icon || null,
      shortLabel: uiMeta.shortLabel || null,
      displayNameAr: uiMeta.displayNameAr || null,
      displayNameEn: uiMeta.displayNameEn || null,
      featured: !!uiMeta.featured,
      order: Number.isFinite(uiMeta.order) ? uiMeta.order : 1000,
      hiddenFromMenu: !!uiMeta.hiddenFromMenu,
      menuGroup: uiMeta.menuGroup || null,
    });
  }

  commands.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "ar"));

  const categories = new Map();
  for (const c of commands) {
    if (!categories.has(c.category)) categories.set(c.category, []);
    categories.get(c.category).push(c);
  }
  return { categories, commands, stamp: pluginStore.commands.size };
}

function getRegistry() {
  // يُبطل تلقائياً إذا تغيّر عدد الأوامر (إضافة/حذف/إعادة تحميل)
  if (!_cache || _cacheStamp !== pluginStore.commands.size) {
    _cache = buildRegistry();
    _cacheStamp = _cache.stamp;
  }
  return _cache;
}

// ── PERMISSION FILTER ──────────────────────────────────────────
/**
 * يبني سياق المستخدم من الرسالة المُسلسلة.
 * لا يقرّر الصلاحية — يصف الحالة فقط.
 */
function viewerContext(m = {}) {
  return {
    isOwner: !!m.isOwner,
    isPartner: !!m.isPartner,
    isPremium: !!m.isPremium,
    isAdmin: !!m.isAdmin,
    isBotAdmin: !!m.isBotAdmin,
    isGroup: !!m.isGroup,
    isPrivate: !!m.isPrivate || (!m.isGroup && !m.isNewsletter),
    pushName: m.pushName || "مستخدم",
  };
}

/** التسمية المعروضة لمستوى المشاهد */
function viewerTier(v) {
  if (v.isOwner) return "مالك";
  if (v.isPartner) return "شريك";
  if (v.isPremium) return "مميّز";
  if (v.isAdmin) return "مشرف مجموعة";
  return "مستخدم عام";
}

/** هل يمكن لهذا المشاهد استخدام الأمر في سياقه الحالي؟ (عرض فقط) */
function canUse(cmd, v) {
  if (!cmd.isEnabled) return false;
  if (cmd.isOwner && !v.isOwner) return false;
  if (cmd.isPartner && !(v.isPartner || v.isOwner)) return false;
  if (cmd.isPremium && !(v.isPremium || v.isPartner || v.isOwner)) return false;
  if (cmd.isAdmin && !(v.isAdmin || v.isOwner)) return false;
  if (cmd.isGroup && !v.isGroup) return false;
  if (cmd.isPrivate && v.isGroup) return false;
  return true;
}

/**
 * @param {object} v سياق المشاهد
 * @param {{mode?: "available"|"all"}} opts
 *   available = ما يستطيع استخدامه الآن · all = كل شيء مع شارات
 */
function visibleCommands(v, { mode = "all" } = {}) {
  const { commands } = getRegistry();
  return commands
    .filter((c) => !c.hiddenFromMenu)
    .filter((c) => (mode === "available" ? canUse(c, v) : true));
}

function visibleCategories(v, opts) {
  const map = new Map();
  for (const c of visibleCommands(v, opts)) {
    if (!map.has(c.category)) map.set(c.category, []);
    map.get(c.category).push(c);
  }
  return [...map.entries()]
    .map(([key, items]) => ({
      key,
      label: ui.categoryLabel(key),
      icon: ui.categoryIcon(key),
      count: items.length,
      items,
    }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

// ── SEARCH ─────────────────────────────────────────────────────
/** تطبيع عربي/لاتيني للبحث فقط — لا يُستخدم أبداً لتنفيذ أمر */
function normalizeSearch(text) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[ً-ٰٟـ]/g, "")   // تشكيل وتطويل
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ؤئ]/g, "ء")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i += 1) {
    const cur = [i];
    for (let j = 1; j <= n; j += 1) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[n];
}

/**
 * بحث في الأوامر. الترتيب: تطابق تام ← بادئة ← تضمين ← تقريبي.
 * @returns {{command:object, score:number, exact:boolean}[]}
 */
function searchCommands(query, v, { limit = 12 } = {}) {
  const q = normalizeSearch(query);
  if (!q) return [];
  const pool = visibleCommands(v, { mode: "all" });
  const results = [];
  for (const c of pool) {
    const haystack = [
      ...c.names, ...c.aliases, c.description, c.category,
      c.displayNameAr, c.displayNameEn, ui.categoryLabel(c.category),
    ]
      .filter(Boolean)
      .map(normalizeSearch);

    let score = 0;
    let exact = false;
    for (const h of haystack) {
      if (!h) continue;
      if (h === q) { score = Math.max(score, 100); exact = true; }
      else if (h.startsWith(q)) score = Math.max(score, 80);
      else if (h.includes(q)) score = Math.max(score, 60);
      else if (q.length >= 3) {
        const d = levenshtein(q, h.slice(0, Math.max(q.length + 2, 4)));
        if (d <= Math.max(1, Math.floor(q.length / 3))) score = Math.max(score, 40 - d);
      }
    }
    if (score > 0) results.push({ command: c, score, exact });
  }
  return results
    .sort((a, b) => b.score - a.score || a.command.name.localeCompare(b.command.name, "ar"))
    .slice(0, limit);
}

/** يعثر على أمر بالاسم أو الاسم المستعار — مطابقة تامة فقط */
function findCommandExact(name) {
  const key = String(name ?? "").trim().toLowerCase();
  if (!key) return null;
  const direct = pluginStore.commands.get(key);
  if (direct?.config) return normalizeOne(direct.config);
  const aliased = pluginStore.aliases.get(key);
  if (aliased) {
    const p = pluginStore.commands.get(aliased);
    if (p?.config) return normalizeOne(p.config);
  }
  return null;
}
function normalizeOne(cfg) {
  const { commands } = getRegistry();
  return commands.find((c) => c.name === primaryName(cfg)) || null;
}

// ═══════════════════════════════════════════════════════════════
// 🖼️ RENDERERS
// ═══════════════════════════════════════════════════════════════

/** الشاشة الرئيسية */
function renderHome(m, extra = {}) {
  const v = viewerContext(m);
  const cats = visibleCategories(v, { mode: "all" });
  const all = visibleCommands(v, { mode: "all" });
  const usable = all.filter((c) => canUse(c, v)).length;
  const p = identity.prefix;

  const featured = all.filter((c) => c.featured).slice(0, 5);

  const sections = [
    {
      title: "الحالة",
      lines: [
        ui.row("المستخدم", v.pushName),
        ui.row("الصلاحية", viewerTier(v)),
        ui.row("السياق", v.isGroup ? "مجموعة" : "محادثة خاصة"),
        ui.row("الإصدار", identity.version),
        extra.uptime ? ui.row("التشغيل", extra.uptime) : null,
      ].filter(Boolean),
    },
    {
      title: "المنظومة",
      lines: [
        ui.row("الأقسام", String(cats.length)),
        ui.row("الأوامر", String(all.length)),
        ui.row("المتاح لك", String(usable)),
      ],
    },
    {
      title: "الأقسام",
      lines: cats
        .slice(0, 12)
        .map((c, i) => ui.listItem(i + 1, `${c.icon} ${c.label}`, String(c.count))),
    },
  ];

  if (featured.length) {
    sections.push({
      title: "مختارات",
      lines: featured.map((c) => ui.commandRow(`${p}${c.name}`, ui.permissionBadges(c))),
    });
  }

  sections.push({
    title: "التنقّل",
    lines: [
      `${GLYPH.arrow} ${ui.style.command(`${p}فئة <اسم القسم>`)}  عرض قسم`,
      `${GLYPH.arrow} ${ui.style.command(`${p}الأوامر`)}  كل الأوامر`,
      `${GLYPH.arrow} ${ui.style.command(`${p}بحث <كلمة>`)}  بحث`,
    ],
  });

  return ui.card({
    title: `${identity.brandName} ${GLYPH.dot} ${identity.brandNameAr}`,
    subtitle: identity.tagline,
    sections,
  });
}

/** نظرة عامة على الأقسام */
function renderCategories(m) {
  const v = viewerContext(m);
  const cats = visibleCategories(v, { mode: "all" });
  const p = identity.prefix;
  return ui.card({
    title: "الأقسام",
    subtitle: `${cats.length} قسماً`,
    sections: [
      {
        title: "الفهرس",
        lines: cats.map((c, i) =>
          ui.listItem(i + 1, `${c.icon} ${c.label}`, String(c.count)),
        ),
      },
      {
        title: "التنقّل",
        lines: [`${GLYPH.arrow} ${ui.style.command(`${p}فئة <اسم القسم>`)}`],
      },
    ],
  });
}

/** تفاصيل قسم واحد مع ترقيم صفحات */
function renderCategory(m, categoryKey, page = 1) {
  const v = viewerContext(m);
  const key = String(categoryKey ?? "").toLowerCase();
  const cats = visibleCategories(v, { mode: "all" });
  const cat =
    cats.find((c) => c.key === key) ||
    cats.find((c) => ui.categoryLabel(c.key) === String(categoryKey).trim());

  if (!cat) {
    return ui.card({
      title: "قسم غير معروف",
      compactHeader: true,
      body: ui.empty(`لا يوجد قسم باسم «${categoryKey}»`),
      sections: [
        {
          title: "الأقسام المتاحة",
          lines: cats.slice(0, 18).map((c) => ui.commandRow(c.key, [ui.chip(String(c.count))])),
        },
      ],
    });
  }

  const p = identity.prefix;
  const pg = ui.paginate(cat.items, page);
  return ui.card({
    title: `${cat.icon} ${cat.label}`,
    subtitle: `${cat.count} أمراً`,
    sections: [
      {
        title: "الأوامر",
        lines: pg.items.map((c) => {
          const badges = ui.permissionBadges(c);
          const line = ui.commandRow(`${p}${c.name}`, badges);
          return c.description ? `${line}\n   ${ui.style.subtitle(c.description)}` : line;
        }),
      },
      {
        lines: [
          ui.pagination({
            page: pg.page,
            pages: pg.pages,
            total: pg.total,
            hintCommand: pg.pages > 1 ? `${p}فئة ${cat.key} ${pg.page + 1}` : null,
          }),
        ].filter(Boolean),
      },
      {
        title: "التفاصيل",
        lines: [`${GLYPH.arrow} ${ui.style.command(`${p}بحث <اسم الأمر>`)}`],
      },
    ],
  });
}

/** كل الأوامر مجمّعة حسب القسم، مع ترقيم صفحات على مستوى الأقسام */
function renderAllCommands(m, page = 1) {
  const v = viewerContext(m);
  const cats = visibleCategories(v, { mode: "all" });
  const p = identity.prefix;
  const pg = ui.paginate(cats, page, 6);
  const total = cats.reduce((n, c) => n + c.count, 0);

  return ui.card({
    title: "فهرس الأوامر الكامل",
    subtitle: `${total} أمراً في ${cats.length} قسماً`,
    sections: [
      ...pg.items.map((c) => ({
        title: `${c.icon} ${c.label}  ${ui.chip(String(c.count))}`,
        lines: [
          c.items
            .map((cmd) => `${p}${cmd.name}`)
            .join(`  ${GLYPH.dot}  `),
        ],
      })),
      {
        lines: [
          ui.pagination({
            page: pg.page,
            pages: pg.pages,
            total: cats.length,
            hintCommand: pg.pages > 1 ? `${p}الأوامر ${pg.page + 1}` : null,
          }),
        ].filter(Boolean),
      },
    ],
  });
}

/** بطاقة تفاصيل أمر واحد */
function renderCommandDetail(m, cmd) {
  const v = viewerContext(m);
  const p = identity.prefix;
  const badges = ui.permissionBadges(cmd);
  const related = getRegistry()
    .categories.get(cmd.category)
    ?.filter((c) => c.name !== cmd.name)
    .slice(0, 6) || [];

  return ui.card({
    title: `${cmd.icon || ui.categoryIcon(cmd.category)} ${cmd.name}`,
    subtitle: cmd.description || ui.categoryLabel(cmd.category),
    sections: [
      {
        title: "البطاقة",
        lines: [
          ui.row("القسم", `${ui.categoryIcon(cmd.category)} ${ui.categoryLabel(cmd.category)}`),
          cmd.aliases.length ? ui.row("مرادفات", cmd.aliases.join("، ")) : null,
          ui.row("الصلاحية", badges.length ? badges.join(" ") : "متاح للجميع"),
          ui.row("السياق", cmd.isGroup ? "مجموعات فقط" : cmd.isPrivate ? "خاص فقط" : "الكل"),
          ui.row("التهدئة", `${cmd.cooldown}ث`),
          ui.row("الاستهلاك", String(cmd.limit)),
          ui.row("متاح لك", canUse(cmd, v) ? "نعم" : "لا"),
        ].filter(Boolean),
      },
      cmd.usage || cmd.example
        ? {
            title: "الاستخدام",
            lines: [
              cmd.usage ? `${GLYPH.chevron} ${ui.style.command(cmd.usage)}` : null,
              cmd.example ? `${GLYPH.chevron} ${ui.style.command(cmd.example)}` : null,
            ].filter(Boolean),
          }
        : null,
      related.length
        ? {
            title: "أوامر قريبة",
            lines: [related.map((c) => `${p}${c.name}`).join(`  ${GLYPH.dot}  `)],
          }
        : null,
    ].filter(Boolean),
  });
}

/** نتائج البحث */
function renderSearch(m, query, results) {
  const p = identity.prefix;
  if (!results.length) {
    return ui.card({
      title: "بحث",
      compactHeader: true,
      body: ui.empty(`لا نتائج لـ «${query}»`),
      note: `جرّب ${p}الأوامر لتصفّح الفهرس الكامل`,
    });
  }
  return ui.card({
    title: "نتائج البحث",
    subtitle: `«${query}» ${GLYPH.dot} ${results.length} نتيجة`,
    sections: [
      {
        title: "الأوامر",
        lines: results.map(({ command: c, exact }) => {
          const badges = ui.permissionBadges(c);
          if (exact) badges.unshift(ui.chip("تطابق"));
          const line = ui.commandRow(`${p}${c.name}`, badges);
          return c.description ? `${line}\n   ${ui.style.subtitle(c.description)}` : line;
        }),
      },
    ],
  });
}


// ═══════════════════════════════════════════════════════════════
// 🎛️ أزرار الشاشات — نفس آلية النسخة الأولى (native flow)
// ═══════════════════════════════════════════════════════════════
const P = () => identity.prefix;

/** أزرار الشاشة الرئيسية: قائمة الأقسام + اختصارات */
function homeButtons(m) {
  if (config.ui?.buttons === false) return [];
  const v = viewerContext(m);
  const cats = visibleCategories(v, { mode: "all" });
  const rows = cats.slice(0, 10).map((c) => ({
    header: c.icon,
    title: `${c.label}`,
    description: `${c.count} أمراً`,
    id: `${P()}فئة ${c.key}`,
  }));
  return [
    listButton("تصفّح الأقسام", [{ title: "الأقسام", label: "AXION", rows }]),
    quickReply("الفهرس الكامل", `${P()}الأوامر`),
    quickReply("المطوّر", `${P()}المطور`),
  ];
}

/** أزرار شاشة الأقسام */
function categoriesButtons(m) {
  if (config.ui?.buttons === false) return [];
  const v = viewerContext(m);
  const cats = visibleCategories(v, { mode: "all" });
  const rows = cats.slice(0, 10).map((c) => ({
    header: c.icon,
    title: c.label,
    description: `${c.count} أمراً`,
    id: `${P()}فئة ${c.key}`,
  }));
  return [
    listButton("اختر قسماً", [{ title: "الأقسام", rows }]),
    quickReply("الرئيسية", `${P()}menu`),
  ];
}

/** أزرار قسم واحد: أوامره + تنقّل الصفحات */
function categoryButtons(m, categoryKey, page, pages) {
  if (config.ui?.buttons === false) return [];
  const v = viewerContext(m);
  const cat = visibleCategories(v, { mode: "all" }).find(
    (c) => c.key === String(categoryKey).toLowerCase(),
  );
  const out = [];
  if (cat) {
    const start = (page - 1) * identity.itemsPerPage;
    const rows = cat.items.slice(start, start + 10).map((c) => ({
      header: c.icon || cat.icon,
      title: `${P()}${c.name}`,
      description: (c.description || "").slice(0, 60),
      id: `${P()}بحث ${c.name}`,
    }));
    if (rows.length) out.push(listButton("تفاصيل أمر", [{ title: cat.label, rows }]));
  }
  if (pages > 1 && page < pages) {
    out.push(quickReply(`الصفحة ${page + 1}`, `${P()}فئة ${categoryKey} ${page + 1}`));
  }
  out.push(quickReply("الرئيسية", `${P()}menu`));
  return out.slice(0, 3);
}

/** أزرار بطاقة أمر */
function commandButtons(m, cmd) {
  if (config.ui?.buttons === false) return [];
  const out = [];
  if (cmd?.example) out.push(quickReply("جرّب المثال", cmd.example));
  if (cmd?.category) out.push(quickReply(`قسم ${ui.categoryLabel(cmd.category)}`, `${P()}فئة ${cmd.category}`));
  out.push(quickReply("الرئيسية", `${P()}menu`));
  return out.slice(0, 3);
}

/** أزرار نتائج البحث */
function searchButtons(m, results) {
  if (config.ui?.buttons === false) return [];
  const rows = (results || []).slice(0, 10).map(({ command: c }) => ({
    header: c.icon || ui.categoryIcon(c.category),
    title: `${P()}${c.name}`,
    description: (c.description || "").slice(0, 60),
    id: `${P()}بحث ${c.name}`,
  }));
  const out = [];
  if (rows.length) out.push(listButton("افتح نتيجة", [{ title: "النتائج", rows }]));
  out.push(quickReply("الرئيسية", `${P()}menu`));
  return out;
}

/** أزرار فهرس الأوامر الكامل */
function allCommandsButtons(m, page, pages) {
  if (config.ui?.buttons === false) return [];
  const out = [];
  const v = viewerContext(m);
  const cats = visibleCategories(v, { mode: "all" });
  const rows = cats.slice(0, 10).map((c) => ({
    header: c.icon,
    title: c.label,
    description: `${c.count} أمراً`,
    id: `${P()}فئة ${c.key}`,
  }));
  if (rows.length) out.push(listButton("اذهب إلى قسم", [{ title: "الأقسام", rows }]));
  if (pages > 1 && page < pages) out.push(quickReply(`الصفحة ${page + 1}`, `${P()}الأوامر ${page + 1}`));
  out.push(quickReply("الرئيسية", `${P()}menu`));
  return out.slice(0, 3);
}

/** عدد صفحات قسم — تحتاجه الإضافة لبناء أزرار التنقّل */
function categoryPageCount(m, categoryKey) {
  const v = viewerContext(m);
  const cat = visibleCategories(v, { mode: "all" }).find(
    (c) => c.key === String(categoryKey).toLowerCase(),
  );
  if (!cat) return 1;
  return Math.max(1, Math.ceil(cat.count / identity.itemsPerPage));
}

export {
  getRegistry,
  buildRegistry,
  invalidateMenuCache,
  viewerContext,
  viewerTier,
  canUse,
  visibleCommands,
  visibleCategories,
  searchCommands,
  findCommandExact,
  normalizeSearch,
  renderHome,
  renderCategories,
  renderCategory,
  renderAllCommands,
  renderCommandDetail,
  renderSearch,
  homeButtons,
  categoriesButtons,
  categoryButtons,
  commandButtons,
  searchButtons,
  allCommandsButtons,
  categoryPageCount,
};
