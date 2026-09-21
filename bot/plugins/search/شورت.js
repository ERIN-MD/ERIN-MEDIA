import config from "../../config.js";
import te from "../../src/lib/maro-error.js";
import maroApi from "../../src/lib/maro-apimanager.js";

// ═══════════════════════════════════════════════
// 🛠️ دوال مساعدة
// ═══════════════════════════════════════════════
function trimText(text, max = 90) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  if (!value) return "-";
  if (value.length <= max) return value;
  return value.slice(0, max) + "...";
}

function normalizeResults(data) {
  const groups = [];
  for (const [section, items] of Object.entries(data || {})) {
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      groups.push({
        section,
        title: item?.title || "-",
        url: item?.url || "-",
        image: item?.image || "",
        rating: item?.rating || "-",
        episodes: item?.episodes || "-",
      });
    }
  }
  return groups;
}

async function fetchMelolo(category) {
  const data = await maroApi.covenant.meloloCategory(category, { timeout: 30000 });
  if (!data?.status || !data?.data) throw new Error(data?.message || "لم يتم العثور على نتائج");
  return data;
}

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "شورت",
  alias: ["short"],
  category: "search",
  description: "بحث عن دراما قصيرة من Melolo",
  usage: ".شورت <فئة>",
  example: ".شورت fantasy",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 8, energi: 1, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🎭 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const category = m.text?.trim();

  if (!category) {
    return m.reply(`🎭 *شورت*\n\n📌 مثال: \`${m.prefix}شورت fantasy\``);
  }

  if (!config.APIkey?.covenant) {
    return m.reply("❌ مفتاح API covenant غير مضبوط!");
  }

  m.react("🔍");

  try {
    const result = await fetchMelolo(category);
    const items = normalizeResults(result.data).slice(0, 10);

    if (items.length === 0) {
      m.react("❌");
      return m.reply(`❌ لم يتم العثور على نتائج لـ: ${category}`);
    }

    let caption = "🎭 *شورت*\n\n";
    caption += `🌿 *الفئة:* ${category}\n`;
    caption += `📦 *المجموع:* ${items.length}\n\n`;

    items.forEach((item, index) => {
      caption += `*${index + 1}.* ${trimText(item.title, 70)}\n`;
      caption += `   ├ ⭐ ${item.rating || "-"}\n`;
      caption += `   └ ${item.url}\n\n`;
    });

    const cover = items.find((item) => item.image)?.image;
    if (cover) {
      await sock.sendMedia(m.chat, cover, caption.trim(), m, { type: "image" });
    } else {
      await m.reply(caption.trim());
    }

    m.react("✅");
  } catch (error) {
    m.react("❌");
    const message = error?.response?.data?.message || error?.message;
    if (message) return m.reply(`❌ ${message}`);
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };