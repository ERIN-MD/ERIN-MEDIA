// شراء - أمر لشراء المنتج والحصول على رقم معاملة

import { getDatabase } from "../../src/lib/maro-database.js";
import config from "../../config.js";

const pluginConfig = {
  name: "شراء",
  alias: ["beli"],
  category: "store",
  description: "🛒 شراء المنتج والحصول على رقم معاملة",
  usage: ".شراء <رقم_المنتج>",
  example: ".شراء 1",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
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
      `📭 *لا توجد منتجات متاحة.*\n\nاكتب \`${m.prefix}قائمة_المنتجات\` لعرض قائمة المنتجات 🛍️`,
    );
  }

  const args = m.text?.trim().split(/\s+/) || [];
  const idx = parseInt(args[0]) - 1;

  if (isNaN(idx) || idx < 0 || idx >= products.length) {
    let txt = `🛒 *اختر المنتج*\n\nاكتب \`${m.prefix}شراء <الرقم>\` للطلب.\n\n`;
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const typeIcon = p.type === "مادي" ? "📦" : "🔑";
      const isAvailable =
        p.type === "مادي"
          ? p.stock > 0 || p.stock === -1
          : p.stockItems?.length > 0 || p.stock === -1;
      txt += `${typeIcon} *${i + 1}.* ${p.name} — ${formatPrice(p.price)} ${isAvailable ? "✅" : "❌"}\n`;
    }
    return m.reply(txt);
  }

  const product = products[idx];
  const typeIcon = product.type === "مادي" ? "📦" : "🔑";
  const typeLabel = product.type === "مادي" ? "مادي" : "رقمي";

  const isAvailable =
    product.type === "مادي"
      ? product.stock > 0 || product.stock === -1
      : product.stockItems?.length > 0 || product.stock === -1;

  if (!isAvailable) {
    return m.reply(
      `❌ *المخزون نفد*\n\n` +
        `${typeIcon} المنتج *${product.name}* غير متوفر حالياً 😔\n\n` +
        `يرجى الاتصال بالمدير أو التحقق لاحقاً.\n\n` +
        `_سنقوم بإعادة تعبئة المخزون قريباً_ 🙏`,
    );
  }

  const transactions = db.setting("storeTransactions") || {};
  let trxCounter = db.setting("storeTrxCounter") || 0;
  trxCounter++;
  const trxId = `TRX-${String(trxCounter).padStart(3, "0")}`;
  db.setting("storeTrxCounter", trxCounter);

  transactions[trxId] = {
    trxId,
    buyerJid: m.sender,
    buyerName: m.pushName || m.sender.split("@")[0],
    purchaseChat: m.chat,
    purchaseIsGroup: m.isGroup,
    productIndex: idx,
    productId: product.id,
    productName: product.name,
    productType: product.type,
    price: product.price,
    status: "قيد_الانتظار",
    createdAt: new Date().toISOString(),
  };
  db.setting("storeTransactions", transactions);

  const ownerNumbers = config.owner?.number || [];
  const ownerJid =
    ownerNumbers.length > 0
      ? `${String(ownerNumbers[0]).replace(/[^0-9]/g, "")}@s.whatsapp.net`
      : null;

  let txt = `🛒 *تم إنشاء الطلب*\n\n`;
  txt += `🧾 رقم المعاملة: \`${trxId}\`\n\n`;
  txt += `📦 *تفاصيل الطلب:*\n`;
  txt += `${typeIcon} المنتج: *${product.name}*\n`;
  txt += `🏷️ النوع: *${typeLabel}*\n`;
  txt += `💰 السعر: *${formatPrice(product.price)}*\n`;
  if (product.originalPrice)
    txt += `🏷️ ~~${formatPrice(product.originalPrice)}~~\n`;
  if (product.description) txt += `📝 _${product.description}_\n`;
  txt += `\n`;

  if (product.image) {
    await sock.sendMessage(
      m.chat,
      { image: { url: product.image }, caption: txt },
      { quoted: m },
    );
  } else if (product.video) {
    await sock.sendMessage(
      m.chat,
      { video: { url: product.video }, caption: txt },
      { quoted: m },
    );
  } else {
    await m.reply(txt);
  }

  let paymentTxt = `💳 *تعليمات الدفع*\n\n`;
  paymentTxt += `1️⃣ قم بتحويل مبلغ *${formatPrice(product.price)}* إلى حساب المدير 💰\n`;

  if (config.store?.payment?.length) {
    for (const p of config.store.payment) {
      paymentTxt += `   🏦 ${p.name}: \`${p.number}\` باسم ${p.holder}\n`;
    }
  }
  if (config.store?.qris) {
    paymentTxt += `   📱 QRIS: متوفر\n`;
  }

  paymentTxt += `\n2️⃣ بعد التحويل، أرسل *إثبات الدفع* إلى المدير 📸\n`;
  paymentTxt += `3️⃣ سيقوم المدير بالتحقق وإرسال بيانات المنتج إليك ✅\n\n`;
  paymentTxt += `🧾 رقم معاملتك: \`${trxId}\`\n`;
  paymentTxt += `_احتفظ بهذا الرقم للرجوع إليه_ 📌`;

  if (ownerJid) {
    paymentTxt += `\n\n📞 تواصل مع المدير: wa.me/${ownerJid.split("@")[0]}`;
  }

  await m.reply(paymentTxt);

  if (ownerJid) {
    const buyerNum = m.sender.split("@")[0];
    await sock.sendMessage(ownerJid, {
      text:
        `🛒 *طلب جديد*\n\n` +
        `🧾 المعاملة: \`${trxId}\`\n` +
        `👤 المشتري: *${m.pushName || buyerNum}*\n` +
        `📱 الرقم: \`${buyerNum}\`\n` +
        `${typeIcon} المنتج: *${product.name}*\n` +
        `💰 السعر: *${formatPrice(product.price)}*\n\n` +
        `_بعد استلام إثبات الدفع 📸، رد على رسالة المشتري واكتب \`${m.prefix}تم ${trxId}\`_ ✅`,
    });
  }
}

export { pluginConfig as config, handler };