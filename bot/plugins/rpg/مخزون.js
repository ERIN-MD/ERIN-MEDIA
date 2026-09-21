// مخزون - أمر لعرض محتويات مخزون RPG

import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "مخزون",
  alias: ["inventory"],
  category: "rpg",
  description: "عرض محتويات مخزون RPG",
  usage: ".مخزون",
  example: ".مخزون",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

const ITEMS = {
  // الصناديق
  common: { emote: "📦", name: "صندوق عادي" },
  uncommon: { emote: "🛍️", name: "صندوق نادر" },
  mythic: { emote: "🎁", name: "صندوق أسطوري" },
  legendary: { emote: "💎", name: "صندوق خرافي" },

  // التعدين
  rock: { emote: "🪨", name: "حجر" },
  coal: { emote: "⚫", name: "فحم" },
  iron: { emote: "⛓️", name: "حديد" },
  gold: { emote: "🥇", name: "ذهب" },
  diamond: { emote: "💠", name: "ماس" },
  emerald: { emote: "💚", name: "زمرد" },

  // الصيد
  trash: { emote: "🗑️", name: "نفايات" },
  fish: { emote: "🐟", name: "سمكة" },
  prawn: { emote: "🦐", name: "جمبري" },
  octopus: { emote: "🐙", name: "أخطبوط" },
  shark: { emote: "🦈", name: "قرش" },
  whale: { emote: "🐳", name: "حوت" },

  // الجرعات
  potion: { emote: "🥤", name: "جرعة صحة" },
  mpotion: { emote: "🧪", name: "جرعة مانا" },
  stamina: { emote: "⚡", name: "جرعة طاقة" },

  // أخرى
  herb: { emote: "🌿", name: "عشبة" },
  leather: { emote: "👞", name: "جلد" },
  mysterybox: { emote: "📦", name: "صندوق غامض" },

  // النينجا
  kunai: { emote: "🗡️", name: "كوناي" },
  shuriken: { emote: "⚔️", name: "شوريكين" },
  chakra: { emote: "🌀", name: "تشاكرا" },
  scroll: { emote: "📜", name: "مخطوطة نينجا" },
  bowlramen: { emote: "🍜", name: "رامن" },
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);
  if (!user.inventory) user.inventory = {};

  let invText = `🎒 *محتويات حقيبتك!* ✨\n\n`;

  invText += `❤️ الصحة: *${user.rpg?.health || 100}*\n`;
  invText += `💸 العملات: *${(user.koin || 0).toLocaleString("ar-EG")}*\n`;
  invText += `📈 الخبرة: *${(user.exp || 0).toLocaleString("ar-EG")}*\n\n`;

  let hasItem = false;
  const categories = {
    "📦 *الصناديق*": ["common", "uncommon", "mythic", "legendary"],
    "⛏️ *نتائج التعدين*": [
      "rock",
      "coal",
      "iron",
      "gold",
      "diamond",
      "emerald",
    ],
    "🎣 *نتائج الصيد*": [
      "trash",
      "fish",
      "prawn",
      "octopus",
      "shark",
      "whale",
    ],
    "🌿 *نتائج الزنزانة*": ["herb", "leather", "mysterybox"],
    "🧪 *الجرعات والتعزيزات*": ["potion", "mpotion", "stamina"],
    "⛩️ *معدات النينجا*": ["kunai", "shuriken", "chakra", "scroll", "bowlramen"],
  };

  for (const [catName, items] of Object.entries(categories)) {
    let catText = "";
    for (const itemKey of items) {
      const count = user.inventory[itemKey] || 0;
      if (count > 0) {
        const item = ITEMS[itemKey];
        catText += `${item.emote} ${item.name}: *${count}×*\n`;
        hasItem = true;
      }
    }
    if (catText) {
      invText += `${catName}\n`;
      invText += catText;
      invText += `\n`;
    }
  }

  if (!hasItem) {
    invText += `حقيبتك فارغة! 🕸️\n`;
    invText += `استخدم أوامر RPG الأخرى للحصول على عناصر ممتعة! 🚀\n`;
  } else {
    invText += `اكتب \`.استخدام <اسم العنصر>\` لاستخدام العنصر! 🎒💖\n`;
  }

  await m.reply(invText);
}

export { pluginConfig as config, handler };