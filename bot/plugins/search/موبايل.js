import te from "../../src/lib/maro-error.js";
import gsmarena from "gsmarena-api";

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "موبايل",
  alias: ["gsm"],
  category: "search",
  description: "بحث عن مواصفات الهواتف",
  usage: ".موبايل <اسم الهاتف>",
  example: ".موبايل samsung galaxy s25",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 10, energi: 1, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 📱 دوال التنسيق
// ═══════════════════════════════════════════════
function formatList(results, query, prefix) {
  let txt = `📱 *نتائج البحث*\n`;
  txt += `> *${query}*\n\n`;

  results.slice(0, 10).forEach((d, i) => {
    txt += `${i + 1}. 📱 *${d.name}*\n`;
    if (d.description) {
      const desc = d.description.length > 80 ? d.description.slice(0, 80) + "..." : d.description;
      txt += `> ${desc}\n`;
    }
  });

  txt += `\n> اكتب \`${prefix}موبايل <الاسم الكامل>\` للتفاصيل`;
  return txt;
}

function formatDetail(device) {
  let txt = `📱 *${device.name}*\n\n`;

  if (device.quickSpec && device.quickSpec.length > 0) {
    txt += `📋 *ملخص:*\n`;
    for (const s of device.quickSpec) {
      txt += `> 🔹 *${s.name}:* ${s.value}\n`;
    }
    txt += "\n";
  }

  if (device.detailSpec && device.detailSpec.length > 0) {
    for (const cat of device.detailSpec.slice(0, 8)) {
      txt += `📌 *${cat.category}:*\n`;
      for (const s of cat.specifications.slice(0, 5)) {
        txt += `> • *${s.name}:* ${s.value}\n`;
      }
      txt += "\n";
    }
  }
  return txt;
}

// ═══════════════════════════════════════════════
// 📱 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m) {
  const text = m.args.join(" ");
  if (!text) {
    return m.reply(
      `📱 *موبايل*\n\n` +
      `> بحث عن مواصفات الهواتف\n\n` +
      `📌 مثال: \`${m.prefix}موبايل samsung galaxy s25\``
    );
  }

  m.react("⏳");

  try {
    const results = await gsmarena.search.search(text);

    if (!results || results.length === 0) {
      m.react("❌");
      return m.reply(`📱 لم يتم العثور على: *${text}*`);
    }

    if (results.length === 1) {
      const device = await gsmarena.catalog.getDevice(results[0].id);
      m.react("✅");
      return m.reply(formatDetail(device));
    }

    m.react("✅");
    return m.reply(formatList(results, text, m.prefix));
  } catch (error) {
    console.log(error);
    m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };