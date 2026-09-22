// ═══════════════════════════════════════════════════════════════
// 📁 src/lib/maro-text-style.js
// ✒️ واجهة توافق — تفوّض إلى نظام الطباعة/التصميم الجديد (AXION)
// ═══════════════════════════════════════════════════════════════
// حافظنا على نفس التواقيع القديمة حتى لا تنكسر أي إضافة تستخدمها،
// لكن المخرجات صارت بالهوية الجديدة وبنفس لبنات بقية البوت.

import ui from "./ui/components.js";
import style from "./ui/typography.js";
import identity from "./ui/identity.js";

/** تذييل موحّد */
function getFooter() {
  return `${identity.signature} · v${identity.version}`;
}

/**
 * لوحة نصية عامة (نفس العقد القديم).
 * @param {{icon?:string,title?:string,lines?:string[],footer?:string}} spec
 */
function formatTextPanel({ icon = ui.GLYPH.brandAlt, title, lines = [], footer } = {}) {
  return ui.card({
    title,
    icon,
    compactHeader: true,
    sections: [{ lines: lines.map((l) => (typeof l === "string" ? l : String(l ?? ""))) }],
    footerNote: footer,
  });
}

/**
 * دليل استخدام أمر (نفس العقد القديم).
 */
function commandGuide({ icon = ui.GLYPH.section, title, command, example, note, footer } = {}) {
  return ui.card({
    title,
    icon,
    compactHeader: true,
    sections: [
      {
        title: "الاستخدام",
        lines: [
          command ? `${ui.GLYPH.chevron} ${style.command(command)}` : null,
          example ? `${ui.GLYPH.chevron} ${style.command(example)}` : null,
        ].filter(Boolean),
      },
    ],
    note,
    footerNote: footer,
  });
}

/**
 * لوحة حالة (نفس العقد القديم).
 */
function statusPanel({ icon = ui.GLYPH.success, title, details = [], footer } = {}) {
  return ui.card({
    title,
    icon,
    compactHeader: true,
    sections: [{ lines: details.map((d) => (typeof d === "string" ? d : String(d ?? ""))) }],
    footerNote: footer,
  });
}

export { getFooter, formatTextPanel, commandGuide, statusPanel };
export { ui, style };
