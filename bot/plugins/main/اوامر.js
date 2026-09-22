// ═══════════════════════════════════════════════
// 📁 plugins/main/اوامر.js — القائمة الرئيسية (AXION)
// ═══════════════════════════════════════════════
// نفس العقد الخارجي (الاسم/المرادفات/الصلاحيات) ونفس آلية الإرسال
// التفاعلية المستخدمة في النسخة الأولى — التغيير في التصميم فقط.
// للرجوع للتصميم القديم: config.ui.engine = "legacy"
import config from "../../config.js";
import { renderHome, homeButtons } from "../../src/lib/ui/menu-engine.js";
import { sendInteractive } from "../../src/lib/ui/interactive.js";

const pluginConfig = {
  name: "menu",
  alias: ["help", "اوامر", "commands", "m", "أوامر"],
  category: "main",
  description: "عرض القائمة الرئيسية",
  usage: ".menu",
  example: ".menu",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

async function handler(m, ctx) {
  if (config.ui?.engine === "legacy") {
    const legacy = await import("./_legacy/اوامر.legacy.js");
    return (legacy.default?.handler || legacy.handler)(m, ctx);
  }
  let uptime = "";
  try {
    const { getUptime } = await import("../../src/connection.js");
    const { formatUptime } = await import("../../src/lib/maro-formatter.js");
    uptime = formatUptime(getUptime());
  } catch { /* العرض لا يعتمد على مدة التشغيل */ }

  return sendInteractive(m, ctx, {
    body: renderHome(m, { uptime }),
    buttons: homeButtons(m),
  });
}

export default { config: pluginConfig, handler };
export { pluginConfig as config, handler };
