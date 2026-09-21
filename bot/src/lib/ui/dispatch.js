// ═══════════════════════════════════════════════════════════════
// 📁 src/lib/ui/dispatch.js
// 📡 RESPONSE RENDERER / ADAPTER
// ═══════════════════════════════════════════════════════════════
// يحوّل نصاً مبنياً بنظام التصميم إلى رسالة واتساب فعلية.
// القاعدة: لا تفشل القائمة أبداً بسبب ميزة غير مدعومة — النص هو الأساس
// وكل تحسين (صورة/أزرار) اختياري ومحاط بحماية.

import fs from "fs";
import path from "path";
import config from "../../../config.js";
import identity from "./identity.js";

/** يحلّ مساراً من config.assets بأمان، ويرجع null إن لم يوجد */
function resolveAsset(key) {
  try {
    const rel = config.assets?.[key];
    if (!rel) return null;
    const abs = path.resolve(process.cwd(), rel);
    // لا تخرج خارج جذر المشروع
    if (!abs.startsWith(process.cwd())) return null;
    return fs.existsSync(abs) ? abs : null;
  } catch {
    return null;
  }
}

/**
 * يرسل رداً نصياً موحّداً، مع صورة ترويسة اختيارية.
 * @param {object} m رسالة مُسلسلة
 * @param {object} ctx سياق الإضافة ({ sock })
 * @param {string} text نص مبني عبر ui.card()
 * @param {{image?: string|null, asMenu?: boolean}} [opts]
 */
async function sendMenu(m, ctx, text, opts = {}) {
  const body = String(text ?? "").trim();
  if (!body) return null;

  const wantImage = opts.image !== null && config.ui?.menuImage !== false;
  const assetKey = opts.image || config.ui?.menuImageAsset || "maro";
  const imagePath = wantImage ? resolveAsset(assetKey) : null;

  const sock = ctx?.sock || m?.sock;

  if (imagePath && sock?.sendMessage) {
    try {
      return await sock.sendMessage(
        m.chat,
        { image: fs.readFileSync(imagePath), caption: body },
        { quoted: m },
      );
    } catch {
      // تراجُع آمن: أرسل النص وحده
    }
  }

  if (typeof m.reply === "function") return m.reply(body);
  if (sock?.sendMessage) return sock.sendMessage(m.chat, { text: body }, { quoted: m });
  return body;
}

/** رد نصي بسيط عبر نظام التصميم (بدون صورة) */
async function sendText(m, ctx, text) {
  return sendMenu(m, ctx, text, { image: null });
}

export { sendMenu, sendText, resolveAsset, identity };
export default { sendMenu, sendText, resolveAsset };
