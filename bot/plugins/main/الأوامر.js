// ═══════════════════════════════════════════════
// 📁 plugins/main/الأوامر.js — فهرس الأوامر الكامل (AXION)
// ═══════════════════════════════════════════════
import config from "../../config.js";
import { renderAllCommands, allCommandsButtons, visibleCategories, viewerContext } from "../../src/lib/ui/menu-engine.js";
import { sendInteractive } from "../../src/lib/ui/interactive.js";

const pluginConfig = {
  name: "الأوامر",
  alias: ["allmenu"],
  category: "main",
  description: "عرض جميع الأوامر الكاملة حسب الفئة",
  usage: ".الأوامر",
  example: ".الأوامر",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 5, energi: 0, isEnabled: true,
};

async function handler(m, ctx) {
  if (config.ui?.engine === "legacy") {
    const legacy = await import("./_legacy/الأوامر.legacy.js");
    return (legacy.default?.handler || legacy.handler)(m, ctx);
  }
  const page = Number.parseInt(m.args?.[0], 10) || 1;
  const pages = Math.max(1, Math.ceil(visibleCategories(viewerContext(m), { mode: "all" }).length / 6));
  return sendInteractive(m, ctx, {
    body: renderAllCommands(m, page),
    buttons: allCommandsButtons(m, Math.min(Math.max(1, page), pages), pages),
  });
}

export { pluginConfig as config, handler };
export default { config: pluginConfig, handler };
