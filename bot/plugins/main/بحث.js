// ═══════════════════════════════════════════════
// 📁 plugins/main/بحث.js — البحث في الأوامر (AXION)
// ═══════════════════════════════════════════════
import config from "../../config.js";
import ui from "../../src/lib/ui/components.js";
import {
  searchCommands, viewerContext, findCommandExact,
  renderSearch, renderCommandDetail,
} from "../../src/lib/ui/menu-engine.js";
import { sendMenu } from "../../src/lib/ui/dispatch.js";

const pluginConfig = {
  name: "بحث",
  alias: ["carifitur"],
  category: "main",
  description: "البحث عن الميزات باستخدام كلمة مفتاحية مع تفاصيل كاملة",
  usage: ".بحث <كلمة-مفتاحية>",
  example: ".بحث ملصق",
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
    const legacy = await import("./_legacy/بحث.legacy.js");
    return (legacy.default?.handler || legacy.handler)(m, ctx);
  }
  const query = (m.fullArgs || m.text || "").trim();
  if (!query) {
    return sendMenu(
      m, ctx,
      ui.card({
        title: "البحث",
        compactHeader: true,
        body: ui.info("اكتب كلمة للبحث في كل الأوامر والمرادفات والأوصاف."),
        sections: [{ title: "أمثلة", lines: [
          `${ui.GLYPH.chevron} ${ui.style.command(`${ui.identity.prefix}بحث ملصق`)}`,
          `${ui.GLYPH.chevron} ${ui.style.command(`${ui.identity.prefix}بحث تحميل`)}`,
        ] }],
      }),
    );
  }

  // تطابق تام لاسم أمر ⇒ اعرض بطاقة التفاصيل مباشرة.
  // ⚠️ البحث التقريبي لا يُستخدم أبداً لتنفيذ أمر — للعرض فقط.
  const exact = findCommandExact(query);
  if (exact) return sendMenu(m, ctx, renderCommandDetail(m, exact));

  const results = searchCommands(query, viewerContext(m), { limit: 12 });
  if (results.length === 1 && results[0].exact) {
    return sendMenu(m, ctx, renderCommandDetail(m, results[0].command));
  }
  return sendMenu(m, ctx, renderSearch(m, query, results));
}

export { pluginConfig as config, handler };
export default { config: pluginConfig, handler };
