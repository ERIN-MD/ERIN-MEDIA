// ═══════════════════════════════════════════════════════════════
// 📁 src/lib/ui/interactive.js
// 🎛️ AXION Interactive Layer — أزرار وقوائم منسدلة
// ═══════════════════════════════════════════════════════════════
// يستخدم نفس آلية النسخة الأولى بالضبط (Baileys native flow:
// single_select / quick_reply / cta_url / cta_copy) مع تصميم جديد.
// القاعدة الحاكمة: الأزرار تحسين وليست شرطاً — أي فشل في بناء أو
// إرسال الرسالة التفاعلية يسقط تلقائياً إلى نص كامل يحمل نفس
// المعلومات ونفس معرّفات الأوامر، فلا تضيع أي وظيفة.

import fs from "fs";
import path from "path";
import config from "../../../config.js";
import ui from "./components.js";
import identity from "./identity.js";
import { GLYPH } from "./theme.js";
import { saluranCtx } from "../maro-context.js";

// ── معرّفات الأزرار = أوامر حقيقية (عقد ثابت لا يُزخرف) ─────────
const cmd = (name) => `${identity.prefix}${name}`;

/** زر رد سريع — id يجب أن يكون أمراً صالحاً */
function quickReply(displayText, commandId) {
  return {
    name: "quick_reply",
    buttonParamsJson: JSON.stringify({
      display_text: String(displayText),
      id: String(commandId),
    }),
  };
}

/** زر قائمة منسدلة (single_select) */
function listButton(title, sections) {
  return {
    name: "single_select",
    buttonParamsJson: JSON.stringify({
      title: String(title),
      sections: sections.map((s) => ({
        title: String(s.title || ""),
        highlight_label: s.label ? String(s.label) : undefined,
        rows: (s.rows || []).slice(0, 10).map((r) => ({
          header: r.header ? String(r.header) : "",
          title: String(r.title),
          description: String(r.description || ""),
          id: String(r.id),
        })),
      })),
    }),
  };
}

/** زر فتح رابط */
function urlButton(displayText, url) {
  return {
    name: "cta_url",
    buttonParamsJson: JSON.stringify({
      display_text: String(displayText),
      url: String(url),
      merchant_url: String(url),
    }),
  };
}

/** زر نسخ نص */
function copyButton(displayText, value) {
  return {
    name: "cta_copy",
    buttonParamsJson: JSON.stringify({
      display_text: String(displayText),
      id: String(value),
      copy_code: String(value),
    }),
  };
}

// ── التذييل الموحّد ────────────────────────────────────────────
/** تذييل كل رسالة: العلامة + الإصدار + اسم القناة */
function footerLine(note) {
  const brand = `${identity.signature} ${GLYPH.dot} v${identity.version}`;
  const channel = config.saluran?.name?.trim();
  const base = note ? String(note) : brand;
  return channel ? `${base}  ${GLYPH.dot}  ${channel}` : base;
}

// ── سياق القناة ────────────────────────────────────────────────
/** سياق القناة الذي يظهر أعلى كل رسالة (كما في النسخة الأولى) */
function channelContext(extra = {}) {
  if (config.saluran?.showInAllMessages === false) return { ...extra };
  try {
    return { ...saluranCtx(), ...extra };
  } catch {
    return { ...extra };
  }
}

// ── حلّ الأصول ─────────────────────────────────────────────────
function assetPath(key) {
  try {
    const rel = config.assets?.[key];
    if (!rel) return null;
    const abs = path.resolve(process.cwd(), rel);
    if (!abs.startsWith(process.cwd())) return null;
    return fs.existsSync(abs) ? abs : null;
  } catch {
    return null;
  }
}

/**
 * يرسل رسالة تفاعلية (صورة + نص + أزرار) مع تراجع آمن إلى النص.
 *
 * @param {object} m رسالة مُسلسلة
 * @param {object} ctx سياق الإضافة ({ sock })
 * @param {{body:string, buttons?:object[], footer?:string,
 *          image?:string|null, fallbackText?:string}} spec
 */
async function sendInteractive(m, ctx, spec = {}) {
  const sock = ctx?.sock || m?.sock;
  const body = String(spec.body ?? "").trim();
  if (!body) return null;

  const buttons = (spec.buttons || []).filter(Boolean).slice(0, 3);
  const footer = footerLine(spec.footer);
  const imgKey = spec.image === null ? null : spec.image || config.ui?.menuImageAsset || "maro";
  const imgPath = imgKey && config.ui?.menuImage !== false ? assetPath(imgKey) : null;

  // 1) المسار التفاعلي الكامل
  if (sock?.sendButton && buttons.length) {
    try {
      return await sock.sendButton(
        m.chat,
        imgPath ? fs.readFileSync(imgPath) : null,
        body,
        m,
        { buttons, footer, contextInfo: channelContext() },
      );
    } catch {
      // يسقط إلى المسار التالي
    }
  }

  // 2) صورة + تعليق (بلا أزرار)
  if (sock?.sendMessage && imgPath) {
    try {
      return await sock.sendMessage(
        m.chat,
        {
          image: fs.readFileSync(imgPath),
          caption: `${body}\n\n${GLYPH.spark} ${footer}`,
          contextInfo: channelContext(),
        },
        { quoted: m },
      );
    } catch {
      // يسقط إلى النص
    }
  }

  // 3) نص كامل — لا تفقد أي معلومة، وأضف الأوامر البديلة للأزرار
  const hint = spec.fallbackText
    ? `\n\n${spec.fallbackText}`
    : buttons.length
      ? `\n\n${buttonsAsText(buttons)}`
      : "";
  const text = `${body}${hint}\n\n${GLYPH.spark} ${footer}`;
  if (typeof m.reply === "function") return m.reply(text);
  if (sock?.sendMessage) {
    return sock.sendMessage(m.chat, { text, contextInfo: channelContext() }, { quoted: m });
  }
  return text;
}

/** يحوّل الأزرار إلى أسطر نصية قابلة للنسخ عند غياب دعم الأزرار */
function buttonsAsText(buttons) {
  const lines = [];
  for (const b of buttons) {
    let params = {};
    try { params = JSON.parse(b.buttonParamsJson); } catch { continue; }
    if (b.name === "single_select") {
      for (const s of params.sections || []) {
        for (const r of s.rows || []) lines.push(`${GLYPH.bullet} ${ui.style.command(r.id)}  ${r.title}`);
      }
    } else if (b.name === "quick_reply") {
      lines.push(`${GLYPH.arrow} ${ui.style.command(params.id)}  ${params.display_text}`);
    } else if (b.name === "cta_url") {
      lines.push(`${GLYPH.arrow} ${params.display_text}: ${params.url}`);
    } else if (b.name === "cta_copy") {
      lines.push(`${GLYPH.arrow} ${params.display_text}: ${params.copy_code}`);
    }
  }
  return lines.length ? `${ui.section("التنقّل")}\n${lines.join("\n")}` : "";
}

export {
  cmd,
  quickReply,
  listButton,
  urlButton,
  copyButton,
  footerLine,
  channelContext,
  assetPath,
  sendInteractive,
  buttonsAsText,
};
export default { quickReply, listButton, urlButton, copyButton, sendInteractive, footerLine, channelContext };
