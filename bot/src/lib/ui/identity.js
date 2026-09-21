// ═══════════════════════════════════════════════════════════════
// 📁 src/lib/ui/identity.js
// 🪪 هوية العلامة — مصدر واحد للحقيقة، قابل للتهيئة من config.ui
// ═══════════════════════════════════════════════════════════════
// لا تكتب اسم العلامة داخل أي إضافة. اقرأه من هنا دائماً.

import config from "../../../config.js";

const DEFAULTS = {
  brandName: "AXION",
  brandNameAr: "أكسيون",
  tagline: "منصّة الأوامر الموحّدة",
  taglineEn: "Unified Command Platform",
  signature: "AXION CORE",
  mode: "luxury",            // luxury | compact | plain
  showFooter: true,
  itemsPerPage: 14,
};

function ui() {
  const fromConfig = config.ui?.identity || {};
  return { ...DEFAULTS, ...fromConfig };
}

const identity = {
  get brandName() { return ui().brandName; },
  get brandNameAr() { return ui().brandNameAr; },
  get tagline() { return ui().tagline; },
  get taglineEn() { return ui().taglineEn; },
  get signature() { return ui().signature; },
  get mode() { return config.ui?.typography?.mode || ui().mode; },
  get showFooter() { return ui().showFooter; },
  get itemsPerPage() { return Number(config.ui?.itemsPerPage || ui().itemsPerPage); },

  /** اسم البوت الفعلي كما ضبطه المالك (يبقى مصدره config.bot) */
  get botName() { return config.bot?.name || ui().brandName; },
  get version() { return config.bot?.version || "1.0.0"; },
  get developer() { return config.bot?.developer || "—"; },
  get prefix() { return config.command?.prefix || "."; },
};

export { identity, DEFAULTS };
export default identity;
