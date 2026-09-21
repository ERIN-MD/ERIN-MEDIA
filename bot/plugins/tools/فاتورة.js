// فاتورة - أمر لإنشاء فاتورة/إيصال مبيعات

import axios from "axios";
import config from "../../config.js";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "فاتورة",
  alias: ["invoicemaker"],
  category: "tools",
  description: "إنشاء فاتورة/إيصال مبيعات",
  usage: ".فاتورة <المتجر>|<الفاتورة>|<التاريخ>|<الحالة>|<العناصر>|<الإجمالي>",
  example:
    ".فاتورة متجري|INV001|15/01/2026|مدفوعة|أرز مقلي:1×:15000,شاي مثلج:2×:6000|21000",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 15,
  energi: 2,
  isEnabled: true,
};

const NEOXR_APIKEY = config.APIkey?.neoxr || "Milik-Bot-MaroMD";

async function handler(m, { sock }) {
  const args = m.args || [];
  const text = args.join(" ");

  if (!text || !text.includes("|")) {
    return m.reply(
      `🧾 *إنشاء الفاتورة*\n\n` +
        `╭┈┈⬡「 📋 *الصيغة* 」\n` +
        `┃ \`${m.prefix}فاتورة <المتجر>|<الفاتورة>|<التاريخ>|<الحالة>|<العناصر>|<الإجمالي>\`\n` +
        `╰┈┈⬡\n\n` +
        `╭┈┈⬡「 📝 *المعلمات* 」\n` +
        `┃ • المتجر: اسم المتجر\n` +
        `┃ • الفاتورة: رقم الفاتورة\n` +
        `┃ • التاريخ: صيغة DD/MM/YYYY\n` +
        `┃ • الحالة: مدفوعة/غير_مدفوعة\n` +
        `┃ • العناصر: الاسم:الوحدة:السعر (مفصولة بفواصل)\n` +
        `┃ • الإجمالي: السعر الإجمالي\n` +
        `╰┈┈⬡\n\n` +
        `> مثال:\n` +
        `\`${m.prefix}فاتورة متجري|INV001|15/01/2026|مدفوعة|أرز مقلي:1×:15000,شاي مثلج:2×:6000|21000\``,
    );
  }

  const parts = text.split("|").map((p) => p.trim());

  if (parts.length < 6) {
    return m.reply(
      `❌ الصيغة غير مكتملة! مطلوب 6 معاملات (المتجر|الفاتورة|التاريخ|الحالة|العناصر|الإجمالي)`,
    );
  }

  const [store, invoice, date, status, itemsRaw, totalRaw] = parts;

  // دعم الحالة بالعربية والإنجليزية
  const statusMap = {
    'مدفوعة': 'paid',
    'غير_مدفوعة': 'unpaid',
    'paid': 'paid',
    'unpaid': 'unpaid'
  };

  const normalizedStatus = statusMap[status.toLowerCase()];
  if (!normalizedStatus) {
    return m.reply(`❌ الحالة يجب أن تكون 'مدفوعة' أو 'غير_مدفوعة'!`);
  }

  const itemsArr = itemsRaw.split(",").map((item) => {
    const [name, unit, price] = item.split(":").map((i) => i.trim());
    return {
      name: name || "عنصر",
      unit: unit || "1×",
      price: parseInt(price) || 0,
    };
  });

  if (itemsArr.length === 0 || itemsArr.some((i) => !i.name)) {
    return m.reply(
      `❌ صيغة العناصر خاطئة! استخدم: الاسم:الوحدة:السعر (مفصولة بفواصل للعناصر المتعددة)`,
    );
  }

  const total =
    parseInt(totalRaw) || itemsArr.reduce((sum, i) => sum + i.price, 0);

  m.react("🧾");

  try {
    const qrImage = "https://i.ibb.co.com/kt5fyrg/qr.jpg";

    const url =
      `https://api.neoxr.eu/api/invoice-maker?` +
      `store=${encodeURIComponent(store)}` +
      `&invoice=${encodeURIComponent(invoice)}` +
      `&date=${encodeURIComponent(date)}` +
      `&status=${normalizedStatus}` +
      `&image=${encodeURIComponent(qrImage)}` +
      `&items=${encodeURIComponent(JSON.stringify(itemsArr))}` +
      `&total=${total}` +
      `&apikey=${NEOXR_APIKEY}`;

    const response = await axios.get(url, { timeout: 60000 });

    if (!response.data?.status || !response.data?.data?.image?.url) {
      throw new Error("لم يعد API ببيانات صالحة");
    }

    const imageUrl = response.data.data.image.url;
    const data = response.data.data;

    const saluranId = config.saluran?.id || "120363400911374213@newsletter";
    const saluranName = config.saluran?.name || config.bot?.name || "Maro-AI";

    // ترجمة الحالة للعرض
    const statusDisplay = data.status === "paid" ? "✅ مدفوعة" : "❌ غير مدفوعة";

    let caption = `🧾 *تم إنشاء الفاتورة*\n\n`;
    caption += `╭┈┈⬡「 📋 *التفاصيل* 」\n`;
    caption += `┃ 🏪 المتجر: *${data.store}*\n`;
    caption += `┃ 🔢 الفاتورة: *${data.invoice}*\n`;
    caption += `┃ 📅 التاريخ: *${data.date}*\n`;
    caption += `┃ 📌 الحالة: *${statusDisplay}*\n`;
    caption += `╰┈┈⬡\n\n`;

    caption += `╭┈┈⬡「 🛒 *العناصر* 」\n`;
    data.items.forEach((item, i) => {
      caption += `┃ ${i + 1}. ${item.name} (${item.unit}) - ${item.price.toLocaleString("ar-EG")} عملة\n`;
    });
    caption += `╰┈┈⬡\n\n`;

    caption += `> 💰 الإجمالي: *${data.total.toLocaleString("ar-EG")}* عملة`;

    await sock.sendMessage(
      m.chat,
      {
        image: { url: imageUrl },
        caption,
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

    m.react("✅");
  } catch (err) {
    m.react("☢");
    return m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };