// قائمة_المنتجات - أمر لعرض قائمة المنتجات المتاحة

import { getDatabase } from "../../src/lib/maro-database.js";
import config from "../../config.js";

const pluginConfig = {
  name: "قائمة_المنتجات",
  alias: ["listproduk"],
  category: "store",
  description: "🛍️ عرض قائمة المنتجات المتاحة",
  usage: ".قائمة_المنتجات",
  example: ".قائمة_المنتجات",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

function formatPrice(n) {
  return n.toLocaleString("ar-EG") + " عملة";
}

async function handler(m, { sock }) {
  const db = getDatabase();
  const products = db.setting("storeProducts") || [];

  if (products.length === 0) {
    return m.reply(
      `🏪 *لا توجد منتجات متاحة*\n\n` +
        `لا توجد منتجات مضافة من قبل المدير حالياً 😔\n\n` +
        `يرجى التحقق لاحقاً أو التواصل مع المدير لمزيد من المعلومات.\n\n` +
        `_شكراً لاهتمامك_ 🙏`,
    );
  }

  let txt = `🛍️ *قائمة المنتجات*\n\n`;
  txt += `المنتجات المتاحة حالياً 🎉\n`;
  txt += `للشراء، اكتب \`${m.prefix}شراء <الرقم>\`\n\n`;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const type = p.type || "رقمي";
    const typeIcon = type === "رقمي" ? "🔑" : "📦";
    const typeLabel = type === "رقمي" ? "رقمي" : "مادي";

    let stockDisplay;
    if (type === "رقمي") {
      const count = p.stockItems?.length || 0;
      stockDisplay = p.stock === -1 ? "♾️ غير محدود" : `${count} حساب`;
    } else {
      stockDisplay = p.stock === -1 ? "♾️ غير محدود" : `${p.stock} قطعة`;
    }

    const isAvailable =
      type === "رقمي"
        ? p.stockItems?.length > 0 || p.stock === -1
        : p.stock > 0 || p.stock === -1;
    const statusIcon = isAvailable ? "✅" : "❌";

    const priceStr = formatPrice(p.price);
    const originalPriceStr = p.originalPrice
      ? `~~${formatPrice(p.originalPrice)}~~ `
      : "";

    txt += `*${i + 1}.* ${typeIcon} ${p.name}\n`;
    txt += `   💰 ${originalPriceStr}${priceStr}\n`;
    txt += `   📊 المخزون: ${stockDisplay} ${statusIcon}\n`;
    txt += `   🏷️ النوع: ${typeLabel}\n`;
    if (p.description)
      txt += `   📝 _${p.description.substring(0, 60)}${p.description.length > 60 ? "..." : ""}_\n`;
    txt += `\n`;
  }

  txt += `💡 _اكتب \`${m.prefix}شراء <الرقم>\` لطلب المنتج_`;

  if (m.isGroup) {
    const saluranId = config.saluran?.id || "120363400911374213@newsletter";
    const saluranName = config.saluran?.name || config.bot?.name || "Maro-AI";
    await sock.sendMessage(
      m.chat,
      {
        text: txt,
        contextInfo: {
          forwardingScore: 9999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127,
          },
        },
      },
      { quoted: m },
    );
  } else {
    await m.reply(txt);
  }
}

export { pluginConfig as config, handler }