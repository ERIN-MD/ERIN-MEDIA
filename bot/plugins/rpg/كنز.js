// كنز - أمر لفتح صناديق الكنز للحصول على جوائز عشوائية

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "كنز",
  alias: ["treasure"],
  category: "rpg",
  description: "فتح صناديق الكنز للحصول على جوائز عشوائية",
  usage: ".كنز",
  example: ".كنز",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 30,
  energi: 1,
  isEnabled: true,
};

const CHEST_TYPES = {
  صندوق_خشبي: { name: "📦 صندوق خشبي", minGold: 50, maxGold: 200, expRange: [30, 80], rarity: "عادي" },
  صندوق_حديدي: { name: "🗃️ صندوق حديدي", minGold: 150, maxGold: 500, expRange: [80, 150], rarity: "غير_مألوف" },
  صندوق_ذهبي: { name: "🎁 صندوق ذهبي", minGold: 400, maxGold: 1200, expRange: [150, 300], rarity: "نادر" },
  صندوق_ماسي: { name: "💎 صندوق ماسي", minGold: 1000, maxGold: 3000, expRange: [300, 600], rarity: "ملحمي" },
  صندوق_غامض: { name: "🎲 صندوق غامض", minGold: 500, maxGold: 5000, expRange: [200, 800], rarity: "أسطوري" },
};

const LOOT_TABLE = {
  عادي: [
    { item: "خشب", qty: [3, 8], chance: 40 },
    { item: "حديد", qty: [1, 4], chance: 30 },
    { item: "عشبة", qty: [2, 5], chance: 25 },
    { item: "جرعة", qty: [1, 2], chance: 20 },
  ],
  غير_مألوف: [
    { item: "حديد", qty: [3, 7], chance: 40 },
    { item: "ذهب", qty: [1, 3], chance: 25 },
    { item: "جلد", qty: [2, 5], chance: 30 },
    { item: "جرعة", qty: [2, 4], chance: 35 },
  ],
  نادر: [
    { item: "ذهب", qty: [2, 5], chance: 45 },
    { item: "ماس", qty: [1, 2], chance: 20 },
    { item: "جرعة_مانا", qty: [1, 3], chance: 30 },
    { item: "جرعة_قوة", qty: [1, 1], chance: 15 },
  ],
  ملحمي: [
    { item: "ماس", qty: [2, 4], chance: 40 },
    { item: "ذهب", qty: [5, 10], chance: 50 },
    { item: "إكسير", qty: [1, 1], chance: 15 },
    { item: "حراشف_تنين", qty: [1, 2], chance: 10 },
  ],
  أسطوري: [
    { item: "ماس", qty: [3, 8], chance: 50 },
    { item: "قلب_عملاق", qty: [1, 2], chance: 20 },
    { item: "قلب_إلهي", qty: [1, 1], chance: 10 },
    { item: "إكسير", qty: [1, 3], chance: 25 },
    { item: "سيف_ذهبي", qty: [1, 1], chance: 5 },
  ],
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.inventory) user.inventory = {};
  if (!user.rpg) user.rpg = {};

  const args = m.args || [];
  const chestType = args[0]?.toLowerCase();

  const availableChests = Object.entries(CHEST_TYPES).filter(([key]) => (user.inventory[key] || 0) > 0);

  if (!chestType) {
    let txt = `🎁 *مخزن الكنوز* 🎁\n\n`;

    if (availableChests.length === 0) {
      txt += `ليس لديك أي صندوق كنز! 😭\n\n`;
      txt += `💡 *طرق الحصول على الصناديق:*\n`;
      txt += `> ⚔️ الاستكشاف \`.مغامرة\` / الزنزانات\n`;
      txt += `> 👹 هزيمة الزعماء\n`;
      txt += `> 🗓️ إكمال \`.يومي\`\n`;
      txt += `> 🛒 الشراء من \`.متجر\``;
    } else {
      txt += `لديك صناديق! أي صندوق تريد فتحه؟\n\n`;
      for (const [key, chest] of availableChests) {
        txt += `📦 ${chest.name}: *${user.inventory[key]} قطعة*\n`;
        txt += `   └ فتح: \`${m.prefix}كنز ${key}\`\n\n`;
      }
    }
    return m.reply(txt);
  }

  const chest = CHEST_TYPES[chestType];
  if (!chest) {
    return m.reply(`الصندوق *${chestType}* غير موجود!`);
  }

  if ((user.inventory[chestType] || 0) < 1) {
    return m.reply(`ليس لديك *${chest.name}*! 😅`);
  }

  user.inventory[chestType]--;
  if (user.inventory[chestType] <= 0) delete user.inventory[chestType];

  await m.react("🎁");
  await m.reply(`🔓 تفتيش القفل... \nفتح *${chest.name}* ببطء... ✨`);
  await new Promise((r) => setTimeout(r, 2500));

  const goldReward = Math.floor(Math.random() * (chest.maxGold - chest.minGold)) + chest.minGold;
  const expReward = Math.floor(Math.random() * (chest.expRange[1] - chest.expRange[0])) + chest.expRange[0];

  user.koin = (user.koin || 0) + goldReward;

  const droppedItems = [];
  const lootPool = LOOT_TABLE[chest.rarity] || LOOT_TABLE.عادي;

  for (const loot of lootPool) {
    if (Math.random() * 100 < loot.chance) {
      const qty = Math.floor(Math.random() * (loot.qty[1] - loot.qty[0] + 1)) + loot.qty[0];
      user.inventory[loot.item] = (user.inventory[loot.item] || 0) + qty;
      droppedItems.push(`${loot.item} (×${qty})`);
    }
  }

  await addExpWithLevelCheck(sock, m, db, user, expReward);
  db.save();

  await m.react("✅");

  let txt = `💥 *انفتح الصندوق!!* 💥\n\n`;
  txt += `رائع! حصلت على كنز من *${chest.name}*:\n\n`;
  txt += `💰 الذهب: *+${goldReward.toLocaleString("ar-EG")}* عملة\n`;
  txt += `✨ الخبرة: *+${expReward}*\n`;
  if (droppedItems.length > 0) {
    txt += `🎒 *غنائم إضافية:*\n`;
    for (const item of droppedItems) {
      txt += `  • ${item}\n`;
    }
  } else {
    txt += `🎒 *غنائم إضافية:* _للأسف، لم تحصل على عناصر إضافية..._\n`;
  }

  if (chest.rarity === "أسطوري" || chest.rarity === "ملحمي") {
    txt += `\n> _"حظ رائع!"_ 🌟🔥`;
  }

  return m.reply(txt);
}

export { pluginConfig as config, handler };