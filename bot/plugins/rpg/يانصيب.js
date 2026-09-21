// يانصيب - أمر للعب اليانصيب/الجاشا للحصول على جوائز عشوائية

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "يانصيب",
  alias: ["lottery"],
  category: "rpg",
  description: "اليانصيب/الجاشا للحصول على جوائز عشوائية",
  usage: ".يانصيب <1/10>",
  example: ".يانصيب 10",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 30,
  energi: 1,
  isEnabled: true,
};

const GACHA_POOL = [
  { item: "نفايات", name: "🗑️ نفايات متعفنة", chance: 30, rarity: "عادي" },
  { item: "خشب", name: "🪵 حطب", chance: 20, qty: [3, 8], rarity: "عادي" },
  { item: "حديد", name: "🔩 حديد خردة", chance: 15, qty: [2, 5], rarity: "عادي" },
  { item: "ذهب", name: "🪙 سبيكة ذهب", chance: 10, qty: [1, 3], rarity: "غير_مألوف" },
  { item: "جرعة", name: "🧪 جرعة سحرية", chance: 8, qty: [1, 3], rarity: "غير_مألوف" },
  { item: "ماس", name: "💎 ماس نقي", chance: 5, qty: [1, 2], rarity: "نادر" },
  { item: "صندوق_ذهبي", name: "🎁 صندوق ذهبي", chance: 3, qty: [1, 1], rarity: "نادر" },
  { item: "صندوق_ماسي", name: "💎 صندوق ماسي", chance: 1.5, qty: [1, 1], rarity: "ملحمي" },
  { item: "صندوق_غامض", name: "🎲 صندوق غامض", chance: 0.8, qty: [1, 1], rarity: "ملحمي" },
  { item: "سيف_ذهبي", name: "🗡️ سيف إكسكاليبور الذهبي", chance: 0.3, qty: [1, 1], rarity: "أسطوري" },
  { item: "درع_ماسي", name: "🛡️ درع الماس الأبدي", chance: 0.2, qty: [1, 1], rarity: "أسطوري" },
  { item: "قلب_إلهي", name: "⚡ القلب الإلهي", chance: 0.1, qty: [1, 1], rarity: "خرافي" },
];

const RARITY_COLORS = {
  عادي: "⚪",
  غير_مألوف: "🟢",
  نادر: "🔵",
  ملحمي: "🟣",
  أسطوري: "🟡",
  خرافي: "🔴",
};

const GACHA_COST = 500;

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.inventory) user.inventory = {};
  if (!user.rpg) user.rpg = {};

  const args = m.args || [];
  const pulls = Math.min(10, Math.max(1, parseInt(args[0]) || 1));
  const totalCost = GACHA_COST * pulls;

  if ((user.koin || 0) < totalCost) {
    return m.reply(
      `💸 *رصيدك غير كافٍ للجاشا!* 💸\n\n` +
        `سعر الجاشا: *${GACHA_COST.toLocaleString("ar-EG")} عملة/سحب*\n` +
        `المطلوب: *${totalCost.toLocaleString("ar-EG")} عملة (${pulls} سحب)*\n\n` +
        `رصيدك الحالي: *${(user.koin || 0).toLocaleString("ar-EG")} عملة*. اربح المزيد أولاً!`
    );
  }

  user.koin -= totalCost;

  await m.react("🎰");
  await m.reply(`✨ أضواء الديسكو... آلة الجاشا تدور... سحب *${pulls}* جائزة! 🎁✨`);
  await new Promise((r) => setTimeout(r, 2500));

  const results = [];
  let totalExp = 0;

  for (let i = 0; i < pulls; i++) {
    const roll = Math.random() * 100;
    let cumulative = 0;
    let result = GACHA_POOL[0];

    for (const item of GACHA_POOL) {
      cumulative += item.chance;
      if (roll <= cumulative) {
        result = item;
        break;
      }
    }

    if (result.item !== "نفايات") {
      const qty = result.qty ? Math.floor(Math.random() * (result.qty[1] - result.qty[0] + 1)) + result.qty[0] : 1;
      user.inventory[result.item] = (user.inventory[result.item] || 0) + qty;
      results.push({ ...result, finalQty: qty });

      const expByRarity = { عادي: 10, غير_مألوف: 30, نادر: 80, ملحمي: 150, أسطوري: 300, خرافي: 500 };
      totalExp += expByRarity[result.rarity] || 10;
    } else {
      results.push({ ...result, finalQty: 0 });
    }
  }

  await addExpWithLevelCheck(sock, m, db, user, totalExp);
  db.save();

  const grouped = {};
  for (const r of results) {
    if (!grouped[r.item]) {
      grouped[r.item] = { ...r, count: 0, totalQty: 0 };
    }
    grouped[r.item].count++;
    grouped[r.item].totalQty += r.finalQty;
  }

  let txt = `🎉 *فتح الصندوق!!* 🎉\n\n`;
  txt += `سحب *${pulls}* | التكلفة: *${totalCost.toLocaleString("ar-EG")}* عملة\n\n`;
  txt += `*🎁 نتائج الجاشا:* \n`;

  let hasRare = false;
  let hasLegendary = false;

  for (const [key, item] of Object.entries(grouped)) {
    const rarityIcon = RARITY_COLORS[item.rarity] || "⚪";
    if (item.item === "نفايات") {
      txt += `> ${rarityIcon} ${item.name} *(نفايات ×${item.count})*\n`;
    } else {
      txt += `> ${rarityIcon} ${item.name} *×${item.totalQty}*\n`;
    }

    if (["ملحمي", "أسطوري", "خرافي"].includes(item.rarity)) hasRare = true;
    if (["أسطوري", "خرافي"].includes(item.rarity)) hasLegendary = true;
  }

  txt += `\n📈 *خبرة إضافية:* +${totalExp} ✨\n`;

  if (hasLegendary) {
    txt += `\n🌟🌟 *رائع!! حصلت على عنصر أسطوري!! حظ العمر!* 🌟🌟`;
  } else if (hasRare) {
    txt += `\n✨ *حصلت على عنصر نادر!*`;
  } else {
    txt += `\n🥲 *نفايات... معظمها خردة.*`;
  }

  await m.react(hasLegendary ? "🌟" : hasRare ? "🎉" : "✅");

  return m.reply(txt);
}

export { pluginConfig as config, handler };