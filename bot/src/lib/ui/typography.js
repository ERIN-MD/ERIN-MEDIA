// ═══════════════════════════════════════════════════════════════
// 📁 src/lib/ui/typography.js
// ✒️  AXION Typography Engine — زخرفة آمنة للعربية والإنجليزية
// ═══════════════════════════════════════════════════════════════
//
// القاعدة الحاكمة: الزخرفة للعرض فقط.
// لا تُطبَّق إطلاقاً على: معرّفات الأوامر، الأسماء المستعارة، معرّفات الأزرار،
// الروابط، البُرد الإلكتروني، معرّفات JID، أرقام الهواتف، المسارات، مفاتيح JSON،
// مفاتيح قاعدة البيانات، الكود، ورسائل تتبّع الأخطاء.
//
// العربية لا تملك أي بدائل Unicode مزخرفة موثوقة، لذلك تُزخرف عبر:
//   • تأكيد واتساب الأصلي (*نص*)
//   • فواصل ورموز هيكلية
// أما الإنجليزية فتستخدم Mathematical Alphanumeric Symbols عند الحاجة فقط.

// ── خرائط الأبجديات الرياضية (إنجليزي فقط) ─────────────────────
const ASCII_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ASCII_LOWER = "abcdefghijklmnopqrstuvwxyz";
const ASCII_DIGIT = "0123456789";

/** يبني خريطة تحويل من نقاط بداية Unicode */
function buildMap(upperStart, lowerStart, digitStart) {
  const map = new Map();
  if (upperStart !== null) {
    for (let i = 0; i < 26; i += 1) map.set(ASCII_UPPER[i], String.fromCodePoint(upperStart + i));
  }
  if (lowerStart !== null) {
    for (let i = 0; i < 26; i += 1) map.set(ASCII_LOWER[i], String.fromCodePoint(lowerStart + i));
  }
  if (digitStart !== null) {
    for (let i = 0; i < 10; i += 1) map.set(ASCII_DIGIT[i], String.fromCodePoint(digitStart + i));
  }
  return map;
}

const FONTS = {
  // 𝗦𝗮𝗻𝘀 𝗕𝗼𝗹𝗱 — الأوضح والأوسع دعماً، هوية العلامة الأساسية
  sansBold: buildMap(0x1d5d4, 0x1d5ee, 0x1d7ec),
  // 𝘚𝘢𝘯𝘴 𝘐𝘵𝘢𝘭𝘪𝘤 — للعناوين الفرعية اللاتينية
  sansItalic: buildMap(0x1d608, 0x1d622, null),
  // 𝙎𝙖𝙣𝙨 𝘽𝙤𝙡𝙙 𝙄𝙩𝙖𝙡𝙞𝙘 — للتوقيع
  sansBoldItalic: buildMap(0x1d63c, 0x1d656, null),
  // 𝙼𝚘𝚗𝚘 — للقيم التقنية القابلة للقراءة
  mono: buildMap(0x1d670, 0x1d68a, 0x1d7f6),
};

// ── كواشف النصوص التي يُمنع تزيينها ────────────────────────────
const PROTECTED_PATTERNS = [
  /```[\s\S]*?```/g,          // كتل الكود
  /`[^`\n]+`/g,               // كود سطري
  /https?:\/\/\S+/gi,         // روابط
  /\bwww\.\S+/gi,             // روابط بدون بروتوكول
  /\b[\w.+-]+@[\w-]+\.[\w.]+\b/g, // بريد إلكتروني
  /\b\d+@(?:s\.whatsapp\.net|g\.us|lid|newsletter|broadcast)\b/gi, // JID
  /\B[+]\d[\d\s-]{6,}\b/g,    // أرقام هواتف دولية
  /(?:\.{1,2})?\/[\w.-]+(?:\/[\w.-]+)+/g, // مسارات
];

/** هل يجب ترك هذا النص كما هو تماماً؟ */
function isProtected(text) {
  const value = String(text ?? "");
  if (!value) return true;
  return PROTECTED_PATTERNS.some((re) => {
    re.lastIndex = 0;
    return re.test(value);
  });
}

/**
 * يقسّم النص إلى أجزاء: محمية (code/url/jid/...) وقابلة للزخرفة.
 * @returns {{text: string, protected: boolean}[]}
 */
function segment(text) {
  const value = String(text ?? "");
  if (!value) return [];
  const marks = new Array(value.length).fill(false);
  for (const re of PROTECTED_PATTERNS) {
    re.lastIndex = 0;
    let match;
    while ((match = re.exec(value)) !== null) {
      for (let i = match.index; i < match.index + match[0].length; i += 1) marks[i] = true;
      if (match[0].length === 0) re.lastIndex += 1;
    }
  }
  const out = [];
  let start = 0;
  for (let i = 1; i <= value.length; i += 1) {
    if (i === value.length || marks[i] !== marks[start]) {
      out.push({ text: value.slice(start, i), protected: marks[start] });
      start = i;
    }
  }
  return out;
}

/** يطبّق خريطة أبجدية على الأحرف اللاتينية فقط، ويترك العربية وغيرها كما هي */
function applyFont(text, fontName) {
  const map = FONTS[fontName];
  if (!map) return String(text ?? "");
  let out = "";
  for (const ch of String(text ?? "")) out += map.get(ch) ?? ch;
  return out;
}

/**
 * زخرفة آمنة: تتجاوز الأجزاء المحمية تلقائياً.
 * @param {string} text
 * @param {keyof typeof FONTS} fontName
 */
function styleSafe(text, fontName) {
  return segment(text)
    .map((part) => (part.protected ? part.text : applyFont(part.text, fontName)))
    .join("");
}

// ── خريطة عكسية: من الحرف المزخرف إلى ASCII ────────────────────
// ⚠️ مهم: الحروف المزخرفة نقاط Unicode مختلفة تماماً عن ASCII، فلا يطابقها
// أي بحث نصي عادي. استخدم strip() قبل أي مقارنة أو بحث أو تسجيل.
const REVERSE = new Map();
for (const map of Object.values(FONTS)) {
  for (const [plain, fancy] of map) if (!REVERSE.has(fancy)) REVERSE.set(fancy, plain);
}

/** يعيد النص المزخرف إلى ASCII عادي (للبحث/المقارنة/السجلات) */
function strip(text) {
  let out = "";
  for (const ch of String(text ?? "")) out += REVERSE.get(ch) ?? ch;
  return out;
}

/** هل النص عربي في الغالب؟ */
function isArabic(text) {
  const value = String(text ?? "");
  const arabic = (value.match(/[؀-ۿݐ-ݿ]/g) || []).length;
  const latin = (value.match(/[A-Za-z]/g) || []).length;
  return arabic > 0 && arabic >= latin;
}

// ── أوضاع العرض ────────────────────────────────────────────────
const MODES = { LUXURY: "luxury", COMPACT: "compact", PLAIN: "plain" };
let activeMode = MODES.LUXURY;

function setMode(mode) {
  activeMode = Object.values(MODES).includes(mode) ? mode : MODES.LUXURY;
  return activeMode;
}
function getMode() {
  return activeMode;
}

/** يلفّ بنمط واتساب العريض مع حماية من التداخل */
function bold(text) {
  const value = String(text ?? "").trim();
  if (!value || value.startsWith("*")) return value;
  return `*${value}*`;
}
function italic(text) {
  const value = String(text ?? "").trim();
  if (!value || value.startsWith("_")) return value;
  return `_${value}_`;
}

// ═══════════════════════════════════════════════════════════════
// 🎨 واجهة الطباعة العامة
// ═══════════════════════════════════════════════════════════════
const style = {
  MODES,
  setMode,
  getMode,
  isArabic,
  isProtected,
  segment,
  strip,

  /** عنوان العلامة الرئيسي — لاتيني مزخرف، عربي مؤكَّد */
  identity(text) {
    if (activeMode === MODES.PLAIN) return String(text ?? "");
    return isArabic(text) ? bold(text) : styleSafe(text, "sansBold");
  },

  /** عنوان قسم رئيسي — تأكيد واتساب (الزخرفة الرياضية للعلامة فقط) */
  title(text) {
    if (activeMode === MODES.PLAIN) return String(text ?? "");
    return bold(text);
  },

  /** عنوان فرعي / سطر وصفي — تأكيد واتساب الأصلي للغتين معاً.
   *  الأبجديات الرياضية محجوزة لهوية العلامة فقط حتى لا تُرهق القراءة. */
  subtitle(text) {
    if (activeMode === MODES.PLAIN) return String(text ?? "");
    const value = String(text ?? "").trim();
    // لا تزخرف نصاً يحوي أجزاء محمية (رابط/كود/معرّف)
    return isProtected(value) ? value : italic(value);
  },

  /** اسم قسم داخل الرسالة */
  section(text) {
    if (activeMode === MODES.PLAIN) return String(text ?? "");
    return bold(text);
  },

  /** تسمية حقل (المفتاح في صف مفتاح/قيمة) */
  label(text) {
    return String(text ?? "");
  },

  /** قيمة حقل */
  value(text) {
    if (activeMode === MODES.PLAIN) return String(text ?? "");
    return bold(text);
  },

  /** معرّف أمر — يبقى حرفياً بالكامل حتى يمكن نسخه وتشغيله */
  command(text) {
    return `\`${String(text ?? "")}\``;
  },

  /** كود — محمي تماماً */
  code(text) {
    return `\`\`\`${String(text ?? "")}\`\`\``;
  },

  /** رابط — محمي تماماً */
  url(text) {
    return String(text ?? "");
  },

  warning(text) { return `⚠︎ ${bold(text)}`; },
  success(text) { return `✓ ${bold(text)}`; },
  error(text) { return `✕ ${bold(text)}`; },
  info(text) { return `◦ ${String(text ?? "")}`; },

  /** أرقام ترتيب مزخرفة للعرض فقط (01، 02 ...) */
  ordinal(n) {
    const num = String(n).padStart(2, "0");
    return activeMode === MODES.PLAIN ? num : applyFont(num, "mono");
  },

  raw(text) { return String(text ?? ""); },
};

export {
  style,
  strip,
  styleSafe,
  applyFont,
  segment,
  isProtected,
  isArabic,
  bold,
  italic,
  FONTS,
  MODES,
};
export default style;
