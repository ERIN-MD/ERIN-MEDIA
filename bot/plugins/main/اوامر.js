// ═══════════════════════════════════════════════
// 📁 plugins/main/اوامر.js — القائمة الرئيسية (AXION Menu Engine)
// ═══════════════════════════════════════════════
// العقد الخارجي (الاسم والمرادفات والصلاحيات) محفوظ كما هو تماماً.
// التغيير في العرض فقط. للرجوع للتصميم القديم: config.ui.engine = "legacy"
import config from "../../config.js";
import { renderHome } from "../../src/lib/ui/menu-engine.js";
import { sendMenu } from "../../src/lib/ui/dispatch.js";

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

  return sendMenu(m, ctx, renderHome(m, { uptime }));
}

export default { config: pluginConfig, handler };
export { pluginConfig as config, handler };
