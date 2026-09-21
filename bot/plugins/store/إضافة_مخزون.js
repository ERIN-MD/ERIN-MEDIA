// إضافة_مخزون - أمر لإضافة مخزون إلى المنتج (فقط في المحادثة الخاصة)

import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "إضافة_مخزون",
  alias: ["addstok"],
  category: "store",
  description: "📦 إضافة مخزون إلى المنتج (فقط في المحادثة الخاصة)",
  usage:
    ".إضافة_مخزون <رقم_المنتج>|<التفاصيل> أو .إضافة_مخزون <الرقم> <الكمية> (مادي)",
  example: ".إضافة_مخزون 1|البريد: user@mail.com;;كلمة_المرور: pass123",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: true,
  cooldown: 3,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  if (m.isGroup) {
    return m.reply(
      `🚫 *تم رفض الوصول*\n\n` +
        `للحفاظ على خصوصية بيانات المخزون 🛡️، يمكن إضافة المخزون فقط في *المحادثة الخاصة*.\n\n` +
        `يرجى التحدث مع البوت مباشرة 📱`,
    );
  }

  const db = getDatabase();
  const products = db.setting("storeProducts") || [];

  if (products.length === 0) {
    return m.reply(
      `📭 *لا توجد منتجات.*\n\nأضف منتجاً أولاً: \`${m.prefix}إضافة_منتج\` ➕`,
    );
  }

  const text = m.text?.trim() || "";
  const pipeIdx = text.indexOf("|");

  if (pipeIdx === -1) {
    const productNo = parseInt(text.split(/\s+/)[0]) - 1;

    if (!isNaN(productNo) && productNo >= 0 && productNo < products.length) {
      const product = products[productNo];

      if (product.type === "مادي") {
        const addCount = parseInt(text.split(/\s+/)[1]);
        if (!isNaN(addCount) && addCount > 0) {
          product.stock = (product.stock === -1 ? 0 : product.stock) + addCount;
          db.setting("storeProducts", products);
          await m.react("✅");
          return m.reply(
            `📦 *تمت إضافة المخزون المادي*\n\n` +
              `🏷️ المنتج: *${product.name}*\n` +
              `➕ تمت الإضافة: *${addCount} قطعة*\n` +
              `📊 إجمالي المخزون: *${product.stock} قطعة*\n\n` +
              `_إضافة المزيد: \`${m.prefix}إضافة_مخزون ${productNo + 1} <الكمية>\`_`,
          );
        }

        return m.reply(
          `📦 *إضافة مخزون مادي*\n\n` +
            `المنتج *${product.name}* من نوع **مادي** 📦\n\n` +
            `الصيغة: \`${m.prefix}إضافة_مخزون ${productNo + 1} <الكمية>\`\n\n` +
            `📝 *مثال:*\n` +
            `\`${m.prefix}إضافة_مخزون ${productNo + 1} 8\` — إضافة 8 قطع\n\n` +
            `المخزون الحالي: *${product.stock === -1 ? "♾️ غير محدود" : product.stock + " قطعة"}*`,
        );
      }

      if (m.quoted) {
        const quotedType = m.quoted.type || m.quoted.mtype;
        const isDocument =
          quotedType === "documentMessage" ||
          quotedType === "documentWithCaptionMessage";
        const fileName =
          m.quoted.fileName ||
          m.quoted.message?.documentMessage?.fileName ||
          "";

        if (isDocument && fileName.toLowerCase().endsWith(".txt")) {
          await m.reply(`⏳ _جاري معالجة الملف..._`);
          let fileBuffer;
          try {
            fileBuffer = await m.quoted.download();
          } catch {
            return m.reply(
              `❌ *فشل قراءة الملف.*\n\nتأكد من أن الملف غير فارغ وقابل للتحميل 📄`,
            );
          }
          if (!fileBuffer || fileBuffer.length === 0)
            return m.reply(`❌ *الملف فارغ.* 📄`);

          const fileContent = fileBuffer.toString("utf-8").trim();
          const lines = [];
          if (fileContent.includes(";;")) {
            const rawLines = fileContent
              .split(/[\n\r]+/)
              .map((l) => l.trim())
              .filter((l) => l.length > 0);
            for (const raw of rawLines) {
              const subItems = raw
                .split(/\s{2,}/)
                .map((s) => s.trim())
                .filter((s) => s.length >= 3);
              if (subItems.length > 1) lines.push(...subItems);
              else lines.push(raw);
            }
          } else {
            const tokens = fileContent
              .split(/[\s\n\r]+/)
              .map((t) => t.trim())
              .filter((t) => t.length >= 3);
            lines.push(...tokens);
          }
          if (lines.length === 0)
            return m.reply(`❌ *الملف لا يحتوي على بيانات صالحة.* 📄`);
          if (lines.length > 1000)
            return m.reply(
              `❌ *عدد العناصر كبير جداً.* الحد الأقصى 1000 عنصر في الاستيراد 📄`,
            );

          if (!product.stockItems) product.stockItems = [];
          const existingDetails = new Set(
            product.stockItems.map((item) => item.detail),
          );
          let added = 0,
            skipped = 0;

          for (let i = 0; i < lines.length; i++) {
            const detail = lines[i].replace(/;;/g, "\n");
            if (detail.length < 3) continue;
            if (existingDetails.has(detail)) {
              skipped++;
              continue;
            }
            product.stockItems.push({
              id: Date.now() + i,
              detail,
              addedAt: new Date().toISOString(),
            });
            existingDetails.add(detail);
            added++;
          }

          product.stock = product.stockItems.length;
          db.setting("storeProducts", products);
          await m.react("✅");
          return m.reply(
            `✅ *تم استيراد المخزون*\n\n` +
              `🏷️ المنتج: *${product.name}*\n` +
              `➕ تمت الإضافة: *${added}* حساب 🔑\n` +
              (skipped > 0 ? `⏭️ تم تخطي المكررات: *${skipped}*\n` : "") +
              `\n📊 إجمالي المخزون: *${product.stockItems.length}* حساب\n\n` +
              `_عرض المخزون: \`${m.prefix}قائمة_المخزون ${productNo + 1}\`_`,
          );
        }
      }
    }

    return m.reply(
      `📦 *إضافة المخزون*\n\n` +
        `🔑 *منتج رقمي* — إضافة بيانات الحساب/المفتاح:\n` +
        `\`${m.prefix}إضافة_مخزون <رقم_المنتج>|<التفاصيل>\`\n\n` +
        `📄 *استيراد من ملف .txt:*\n` +
        `\`${m.prefix}إضافة_مخزون <رقم_المنتج>\` (رد على ملف .txt)\n\n` +
        `📦 *منتج مادي* — إضافة كمية المخزون:\n` +
        `\`${m.prefix}إضافة_مخزون <رقم_المنتج> <الكمية>\`\n\n` +
        `📝 *مثال رقمي:*\n` +
        `\`${m.prefix}إضافة_مخزون 1|البريد: user@mail.com;;كلمة_المرور: pass123\`\n\n` +
        `📝 *مثال مادي:*\n` +
        `\`${m.prefix}إضافة_مخزون 2 8\` — إضافة 8 قطع للمنتج رقم 2\n\n` +
        `• استخدم \`;;\` لسطر جديد في التفاصيل 🔑\n` +
        `• كل سطر في ملف .txt = عنصر مخزون واحد 📄\n` +
        `• الحد الأقصى 1000 عنصر في كل استيراد 📊\n\n` +
        `_بيانات المخزون الرقمي سرية 🔒 ولا ترسل إلا للمشتري بعد تأكيد الدفع_`,
    );
  }

  const productNo = parseInt(text.substring(0, pipeIdx).trim()) - 1;
  const detail = text
    .substring(pipeIdx + 1)
    .trim()
    .replace(/;;/g, "\n");

  if (isNaN(productNo) || productNo < 0 || productNo >= products.length) {
    return m.reply(
      `❌ *رقم المنتج غير صالح.*\n\nعرض المنتجات: \`${m.prefix}قائمة_المخزون\` 📋`,
    );
  }

  const product = products[productNo];

  if (product.type === "مادي") {
    const addCount = parseInt(detail);
    if (isNaN(addCount) || addCount <= 0) {
      return m.reply(
        `📦 *هذا المنتج مادي*\n\n` +
          `استخدم الصيغة: \`${m.prefix}إضافة_مخزون ${productNo + 1} <الكمية>\`\n\n` +
          `📝 مثال: \`${m.prefix}إضافة_مخزون ${productNo + 1} 8\` — إضافة 8 قطع`,
      );
    }
    product.stock = (product.stock === -1 ? 0 : product.stock) + addCount;
    db.setting("storeProducts", products);
    await m.react("✅");
    return m.reply(
      `📦 *تمت إضافة المخزون المادي*\n\n` +
        `🏷️ المنتج: *${product.name}*\n` +
        `➕ تمت الإضافة: *${addCount} قطعة*\n` +
        `📊 إجمالي المخزون: *${product.stock} قطعة*`,
    );
  }

  if (!detail || detail.length < 3) {
    return m.reply(
      `❌ *تفاصيل المخزون قصيرة جداً.*\n\nيلزم 3 أحرف على الأقل لتكون بيانات المخزون صالحة 🔑`,
    );
  }

  if (!product.stockItems) product.stockItems = [];

  const isDuplicate = product.stockItems.some((item) => item.detail === detail);
  if (isDuplicate) {
    return m.reply(
      `⚠️ *بيانات المخزون موجودة بالفعل.*\n\nعنصر بنفس التفاصيل مسجل بالفعل في المنتج *${product.name}* 🔑`,
    );
  }

  product.stockItems.push({
    id: Date.now(),
    detail,
    addedAt: new Date().toISOString(),
  });
  product.stock = product.stockItems.length;
  db.setting("storeProducts", products);

  await m.react("✅");
  return m.reply(
    `✅ *تمت إضافة المخزون*\n\n` +
      `🏷️ المنتج: *${product.name}*\n` +
      `🔑 إجمالي المخزون الحالي: *${product.stockItems.length}* حساب\n\n` +
      `_إضافة المزيد: \`${m.prefix}إضافة_مخزون ${productNo + 1}|<التفاصيل>\`_`,
  );
}

export { pluginConfig as config, handler };