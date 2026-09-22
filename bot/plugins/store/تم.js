// تم - أمر لتأكيد اكتمال المعاملة وإرسال البيانات إلى المشتري (رد على رسالة المشتري)

import { getDatabase } from "../../src/lib/maro-database.js";
import config from "../../config.js";

const pluginConfig = {
  name: "تم",
  alias: ["done"],
  category: "store",
  description:
    "✅ تأكيد اكتمال المعاملة وإرسال البيانات إلى المشتري (رد على رسالة المشتري)",
  usage: ".تم <رقم_المعاملة> (رد على رسالة المشتري)",
  example: ".تم TRX-001",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  energi: 0,
  isEnabled: true,
};

function formatPrice(n) {
  return n.toLocaleString("ar-EG") + " عملة";
}

async function handler(m, { sock }) {
  const db = getDatabase();
  const trxId = m.text?.trim();

  if (!trxId) {
    return m.reply(
      `✅ *تأكيد المعاملة*\n\n` +
        `📋 الصيغة: \`${m.prefix}تم <رقم_المعاملة>\`\n\n` +
        `📌 *طريقة الاستخدام:*\n` +
        `1️⃣ رد على رسالة المشتري (الذي دفع بالفعل 💰)\n` +
        `2️⃣ اكتب \`${m.prefix}تم TRX-001\`\n\n` +
        `🤖 سيقوم البوت تلقائياً:\n` +
        `• إرسال بيانات المنتج إلى رقم المشتري 📤\n` +
        `• تحديد المعاملة كمكتملة ✅\n` +
        `• إرسال إشعار للمشتري 🔔\n\n` +
        `🧾 *رقم المعاملة* يتم الحصول عليه عندما يقوم المشتري بـ \`${m.prefix}شراء <رقم_المنتج>\`\n\n` +
        `⚠️ _تأكد من استلام إثبات الدفع قبل التأكيد_ 📸`,
    );
  }

  const transactions = db.setting("storeTransactions") || {};
  const trx = transactions[trxId];

  if (!trx) {
    const allTrx = Object.values(transactions);
    const pending = allTrx.filter((t) => t.status === "قيد_الانتظار");

    if (pending.length > 0) {
      let txt = `❌ *المعاملة \`${trxId}\` غير موجودة.*\n\n`;
      txt += `⏳ *المعاملات المعلقة حالياً:*\n\n`;
      for (const t of pending) {
        const typeIcon = t.productType === "مادي" ? "📦" : "🔑";
        const time = new Date(t.createdAt).toLocaleString("ar-EG", {
          timeZone: "Asia/Jakarta",
        });
        txt += `• 🧾 \`${t.trxId}\` — ${typeIcon} ${t.productName} (${formatPrice(t.price)}) بواسطة ${t.buyerName}\n`;
        txt += `  🕐 _${time}_\n\n`;
      }
      txt += `📌 رد على رسالة المشتري ثم اكتب: \`${m.prefix}تم <رقم_المعاملة>\``;
      return m.reply(txt);
    }

    return m.reply(
      `❌ *المعاملة \`${trxId}\` غير موجودة.*\n\n` +
        `📭 لا توجد معاملات معلقة حالياً.\n\n` +
        `_يمكن للمشتري إنشاء طلب باستخدام \`${m.prefix}شراء <رقم_المنتج>\`_ 🛒`,
    );
  }

  if (trx.status === "مكتمل") {
    return m.reply(
      `⚠️ *المعاملة مكتملة بالفعل.*\n\n` +
        `🧾 TRX: \`${trxId}\`\n` +
        `${trx.productType === "مادي" ? "📦" : "🔑"} المنتج: *${trx.productName}*\n` +
        `👤 المشتري: ${trx.buyerName}\n` +
        `✅ اكتملت في: ${new Date(trx.completedAt).toLocaleString("ar-EG", { timeZone: "Asia/Jakarta" })}\n\n` +
        `_تم تأكيد هذه المعاملة مسبقاً_ 🔒`,
    );
  }

  let buyerJid = trx.buyerJid;

  if (m.quoted && m.isGroup) {
    const quotedSender = m.quoted.sender || m.quotedSender;
    if (quotedSender && quotedSender !== m.sender) {
      buyerJid = quotedSender;
    }
  }

  if (!buyerJid) {
    return m.reply(
      `❌ *لا يمكن العثور على رقم المشتري.*\n\nهذه المعاملة لا تحتوي على بيانات مشتري صالحة 📱`,
    );
  }

  const buyerNum = buyerJid.split("@")[0];
  const products = db.setting("storeProducts") || [];
  const productIdx = products.findIndex((p) => p.id === trx.productId);
  const product = productIdx !== -1 ? products[productIdx] : null;

  let stockItemDetail = null;

  if (product && trx.productType !== "مادي") {
    if (product.stockItems?.length > 0) {
      const item = product.stockItems.shift();
      stockItemDetail = item.detail;
      product.stock = product.stockItems.length;
      db.setting("storeProducts", products);
    } else if (product?.detail) {
      stockItemDetail = product.detail;
    }
  }

  if (product && trx.productType === "مادي") {
    if (product.stock !== -1 && product.stock > 0) {
      product.stock -= 1;
      db.setting("storeProducts", products);
    }
  }

  trx.status = "مكتمل";
  trx.completedAt = new Date().toISOString();
  trx.buyerJid = buyerJid;
  trx.stockItemDetail = stockItemDetail;
  transactions[trxId] = trx;
  db.setting("storeTransactions", transactions);

  const now = new Date();
  const timeStr = now.toLocaleString("ar-EG", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const saluranId = config.saluran?.id || "120363400911374213@newsletter";
  const saluranName = config.saluran?.name || config.bot?.name || "Maro-AI";

  const typeIcon = trx.productType === "مادي" ? "📦" : "🔑";
  const typeLabel = trx.productType === "مادي" ? "مادي" : "رقمي";

  let invoiceTxt = `🎉 *تمت المعاملة بنجاح*\n\n`;
  invoiceTxt += `🕐 الوقت: \`${timeStr}\`\n`;
  invoiceTxt += `✅ الحالة: *ناجحة*\n\n`;
  invoiceTxt += `📦 *تفاصيل الطلب:*\n`;
  invoiceTxt += `${typeIcon} المنتج: *${trx.productName}*\n`;
  invoiceTxt += `🏷️ النوع: *${typeLabel}*\n`;
  invoiceTxt += `💰 السعر: *${formatPrice(trx.price)}*\n\n`;

  if (stockItemDetail) {
    invoiceTxt += `🔑 *بيانات المنتج:*\n\`\`\`\n${stockItemDetail}\n\`\`\`\n\n`;
    invoiceTxt += `⚠️ _احتفظ بالبيانات أعلاه جيداً. لا تشاركها مع أي شخص_ 🔒\n\n`;
  } else if (trx.productType === "مادي") {
    invoiceTxt += `📦 _سيتم إرسال المنتج المادي بواسطة المدير. يرجى تأكيد عنوان الشحن._\n\n`;
  }

  invoiceTxt += `🙏 شكراً لتسوقك! _نتطلع لخدمتك مجدداً_ ✨`;

  try {
    await sock.sendMessage(buyerJid, {
      text: invoiceTxt,
      contextInfo: {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: saluranId,
          newsletterName: saluranName,
          serverMessageId: 127,
        },
      },
    });
  } catch (e) {
    console.error("[Done] Failed to send to buyer:", buyerJid, e.message);
    await m.reply(
      `❌ *فشل الإرسال إلى المشتري.*\n\n📱 الرقم: \`${buyerNum}\`\n\n_ربما لم يحفظ المشتري رقم البوت. أرسل البيانات يدوياً:_\n\n${invoiceTxt}`,
    );
  }

  if (trx.purchaseIsGroup && trx.purchaseChat) {
    try {
      const buyerMention = `@${buyerNum}`;
      await sock.sendMessage(trx.purchaseChat, {
        text:
          `🎉 *اكتمل الطلب!*\n\n` +
          `${buyerMention} تم تأكيد شرائك لـ *${trx.productName}* ✅\n` +
          `💰 السعر: *${formatPrice(trx.price)}*\n\n` +
          `📦 تم إرسال بيانات المنتج إلى محادثتك الخاصة. تحقق من رسائل البوت! 📱\n\n` +
          `🙏 شكراً لتسوقك!`,
        mentions: [buyerJid],
      });
    } catch (e) {
      console.error(
        "[Done] Failed to notify group:",
        trx.purchaseChat,
        e.message,
      );
    }
  }

  await m.react("✅");

  let confirmTxt = `✅ *تم تأكيد المعاملة*\n\n`;
  confirmTxt += `🧾 TRX: \`${trxId}\`\n`;
  confirmTxt += `${typeIcon} المنتج: *${trx.productName}*\n`;
  confirmTxt += `👤 المشتري: *${trx.buyerName}*\n`;
  confirmTxt += `📱 الرقم: \`${buyerNum}\`\n`;
  confirmTxt += `💰 السعر: *${formatPrice(trx.price)}*\n`;
  if (product) {
    const stockDisplay =
      product.type === "مادي"
        ? `${product.stock === -1 ? "♾️ غير محدود" : product.stock + " قطعة"}`
        : `${product.stockItems?.length || 0} حساب`;
    confirmTxt += `📊 المخزون المتبقي: *${stockDisplay}*\n`;
  }
  confirmTxt += `\n📤 _تم إرسال البيانات إلى رقم المشتري_ ✅`;

  return m.reply(confirmTxt);
}

export { pluginConfig as config, handler };