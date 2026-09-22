// حذف_منتج - أمر لحذف منتج من المتجر

import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "حذف_منتج",
  alias: ["hapusproduk"],
  category: "store",
  description: "🗑️ حذف منتج من المتجر",
  usage: ".حذف_منتج <الرقم>",
  example: ".حذف_منتج 1",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const products = db.setting("storeProducts") || [];

  if (products.length === 0) {
    return m.reply(
      `📭 *لا توجد منتجات.*\n\nأضف منتجاً أولاً باستخدام \`${m.prefix}إضافة_منتج\` ➕`,
    );
  }

  const idx = parseInt(m.text?.trim()) - 1;

  if (isNaN(idx) || idx < 0 || idx >= products.length) {
    let txt = `🗑️ *اختر المنتج للحذف*\n\nاكتب \`${m.prefix}حذف_منتج <الرقم>\`\n\n`;
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const typeIcon = p.type === "مادي" ? "📦" : "🔑";
      const stockDisplay =
        p.type === "مادي"
          ? p.stock === -1
            ? "♾️"
            : `${p.stock} قطعة`
          : `${p.stockItems?.length || 0} حساب`;
      txt += `${typeIcon} *${i + 1}.* ${p.name} — ${p.price.toLocaleString("ar-EG")} عملة (${stockDisplay})\n`;
    }
    return m.reply(txt);
  }

  const deleted = products.splice(idx, 1)[0];
  db.setting("storeProducts", products);

  const typeIcon = deleted.type === "مادي" ? "📦" : "🔑";

  await m.react("✅");
  return m.reply(
    `🗑️ *تم حذف المنتج*\n\n` +
      `${typeIcon} الاسم: *${deleted.name}*\n` +
      `💰 السعر: *${deleted.price.toLocaleString("ar-EG")}* عملة\n` +
      `📊 المخزون المحذوف: *${deleted.type === "مادي" ? deleted.stock + " قطعة" : (deleted.stockItems?.length || 0) + " حساب"}*\n\n` +
      `⚠️ _تم حذف المنتج بشكل دائم ولا يمكن استعادته._`,
  );
}

export { pluginConfig as config, handler }