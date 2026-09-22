// ═══════════════════════════════════════════════
// 📁 plugins/main/فئة.js — قائمة القسم (AXION)
// ═══════════════════════════════════════════════
import config from "../../config.js";
import {
  renderCategory, renderCategories,
  categoryButtons, categoriesButtons, categoryPageCount,
} from "../../src/lib/ui/menu-engine.js";
import { sendInteractive } from "../../src/lib/ui/interactive.js";

const pluginConfig = {
  name: "فئة",
  alias: ["menucat"],
  category: "main",
  description: "عرض الأوامر في فئة معينة",
  usage: ".فئة <الفئة>",
  example: ".فئة tools",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  energi: 0,
  isEnabled: true,
};

async function handler(m, ctx) {
  if (config.ui?.engine === "legacy") {
    const legacy = await import("./_legacy/فئة.legacy.js");
    return (legacy.default?.handler || legacy.handler)(m, ctx);
  }
  const args = Array.isArray(m.args) ? m.args.filter(Boolean) : [];
  if (!args.length) {
    return sendInteractive(m, ctx, {
      body: renderCategories(m),
      buttons: categoriesButtons(m),
    });
  }

  // الوسيط الأخير قد يكون رقم صفحة؛ وما قبله اسم القسم (قد يحوي مسافات)
  const maybePage = Number.parseInt(args[args.length - 1], 10);
  const hasPage = Number.isFinite(maybePage) && String(maybePage) === args[args.length - 1];
  const page = hasPage ? maybePage : 1;
  const key = (hasPage ? args.slice(0, -1) : args).join(" ").trim();

  if (!key) {
    return sendInteractive(m, ctx, {
      body: renderCategories(m),
      buttons: categoriesButtons(m),
    });
  }
  const pages = categoryPageCount(m, key);
  return sendInteractive(m, ctx, {
    body: renderCategory(m, key, page),
    buttons: categoryButtons(m, key, Math.min(Math.max(1, page), pages), pages),
  });
}

export { pluginConfig as config, handler };
export default { config: pluginConfig, handler };
