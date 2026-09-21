// ═══════════════════════════════════════════════════════════════
// 📁 src/lib/ui/theme.js
// 🎨 AXION Theme — رموز دلالية بدل الألوان (واتساب لا يدعم ألوان النص)
// ═══════════════════════════════════════════════════════════════
// اللون في واتساب يُترجَم إلى: رمز + تسلسل هرمي + مسافات.
// جميع الرموز هنا مختارة لتكون مختلفة جذرياً عن الهوية القديمة
// (لا ╭┈ ولا ┃ ولا ╰┈ ولا ⬡) ولتُعرض بثبات على أندرويد و iOS والويب.

const GLYPH = {
  // هوية
  brand: "◆",
  brandAlt: "◇",
  spark: "⌁",

  // بنية
  section: "▸",
  item: "·",
  bullet: "▪",
  arrow: "→",
  chevron: "›",

  // حالات دلالية (بديل الألوان)
  success: "✓",
  error: "✕",
  warning: "⚠︎",
  info: "◦",
  pending: "◌",
  active: "●",
  inactive: "○",
  locked: "⌾",

  // فواصل
  ruleSolid: "▰",
  ruleLight: "▱",
  dash: "╌",
  dot: "⋅",
};

const RULES = {
  /** فاصل رئيسي تحت ترويسة العلامة */
  heavy: GLYPH.ruleSolid.repeat(11),
  /** فاصل ثانوي بين الأقسام */
  light: GLYPH.dash.repeat(22),
  /** فاصل خفيف جداً */
  hair: GLYPH.dot.repeat(9),
};

/** شارات الصلاحيات — تظهر بجانب الأوامر المقيّدة */
const BADGE = {
  owner: "⬖ مالك",
  partner: "⬗ شريك",
  premium: "⬥ مميّز",
  admin: "⬘ مشرف",
  botAdmin: "⬙ بوت مشرف",
  group: "⌸ مجموعة",
  private: "⌹ خاص",
  disabled: "⌾ معطّل",
};

/** حالات المعالجة الموحّدة */
const STATE = {
  preparing:   { glyph: "◌", ar: "جارٍ التحضير",  en: "Preparing" },
  processing:  { glyph: "◐", ar: "جارٍ المعالجة",  en: "Processing" },
  fetching:    { glyph: "◓", ar: "جارٍ الجلب",     en: "Fetching" },
  generating:  { glyph: "◑", ar: "جارٍ التوليد",   en: "Generating" },
  uploading:   { glyph: "◒", ar: "جارٍ الرفع",     en: "Uploading" },
  completed:   { glyph: "✓", ar: "اكتمل",          en: "Completed" },
  failed:      { glyph: "✕", ar: "فشل",            en: "Failed" },
  timedOut:    { glyph: "⧖", ar: "انتهت المهلة",   en: "Timed out" },
  unavailable: { glyph: "⌾", ar: "غير متاح",       en: "Unavailable" },
  empty:       { glyph: "∅", ar: "لا توجد نتائج",  en: "Empty" },
};

/** أيقونة لكل فئة — تُكتشف الفئات ديناميكياً، وهذه مجرد تحسين عرض */
const CATEGORY_ICON = {
  ai: "⟡", anime: "❈", asupan: "◈", canvas: "◨", cecan: "❃", cek: "⊙",
  clan: "⛨", convert: "⇄", downloader: "⇩", ephoto: "◫", fun: "◉",
  game: "⬟", group: "⌸", info: "⊛", islamic: "۞", linode: "⬢",
  main: "◆", media: "▤", nsfw: "⊘", owner: "⬖", panel: "▣", photo: "◧",
  primbon: "☾", pushkontak: "⇪", random: "⁂", religi: "۞", rpg: "⚔",
  search: "⌕", stalker: "◎", sticker: "◩", store: "⌗", tools: "⚙",
  tts: "◍", user: "◔", utility: "⚙", vps: "▦",
};

/** الاسم العربي المعروض لكل فئة (المفتاح الداخلي لا يتغيّر أبداً) */
const CATEGORY_LABEL = {
  ai: "الذكاء الاصطناعي", anime: "أنمي", asupan: "مقاطع", canvas: "تصميم",
  cecan: "صور", cek: "فحص", clan: "العشائر", convert: "تحويل",
  downloader: "تحميل", ephoto: "تأثيرات", fun: "تسلية", game: "ألعاب",
  group: "المجموعات", info: "معلومات", islamic: "إسلامي", linode: "لينود",
  main: "الرئيسية", media: "وسائط", nsfw: "للبالغين", owner: "المالك",
  panel: "اللوحات", photo: "صور", primbon: "تنجيم", pushkontak: "نشر",
  random: "عشوائي", religi: "ديني", rpg: "عالم RPG", search: "بحث",
  stalker: "تتبّع", sticker: "ملصقات", store: "المتجر", tools: "أدوات",
  tts: "نطق", user: "المستخدم", utility: "خدمات", vps: "سيرفرات",
};

function categoryIcon(key) {
  return CATEGORY_ICON[String(key ?? "").toLowerCase()] || GLYPH.brandAlt;
}
function categoryLabel(key) {
  const k = String(key ?? "").toLowerCase();
  return CATEGORY_LABEL[k] || k;
}

export { GLYPH, RULES, BADGE, STATE, CATEGORY_ICON, CATEGORY_LABEL, categoryIcon, categoryLabel };
export default { GLYPH, RULES, BADGE, STATE, categoryIcon, categoryLabel };
