// صيد_الأسماك - أمر لصيد الأسماك للحصول على مأكولات بحرية

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "صيد_الأسماك",
  alias: ["fishing"],
  category: "rpg",
  description: "صيد الأسماك للحصول على مأكولات بحرية",
  usage: ".صيد_الأسماك",
  example: ".صيد_الأسماك",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 60,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};
  if (!user.inventory) user.inventory = {};

  const staminaCost = 15;
  user.rpg.stamina = user.rpg.stamina || 100;

  if (user.rpg.stamina < staminaCost) {
    return m.reply(`طاقتك منخفضة! 😭⚡\n\nتحتاج *${staminaCost}* طاقة للصيد، لكن لديك فقط *${user.rpg.stamina}*.\nاسترح قليلاً! 🛌💤`);
  }

  user.rpg.stamina -= staminaCost;

  await m.react("🎣");
  await m.reply(`ألقِ سنارة الصيد في الماء الهادئ... 🌊🎣\nاهدأ، لا تصدر ضجيجاً! 🤫👀`);
  await new Promise((r) => setTimeout(r, 4000));

  const drops = [
    { item: "نفايات", chance: 20, name: "🗑️ نفايات", exp: 10 },
    { item: "سمكة", chance: 50, name: "🐟 سمكة", exp: 100 },
    { item: "جمبري", chance: 30, name: "🦐 جمبري", exp: 150 },
    { item: "أخطبوط", chance: 15, name: "🐙 أخطبوط", exp: 300 },
    { item: "قرش", chance: 5, name: "🦈 قرش", exp: 800 },
    { item: "حوت", chance: 1, name: "🐳 حوت", exp: 2000 },
  ];

  const rand = Math.random() * 100;
  let caught = drops[0];

  for (const drop of drops.sort((a, b) => a.chance - b.chance)) {
    if (rand <= drop.chance) {
      caught = drop;
      break;
    }
  }

  const qty = 1;
  user.inventory[caught.item] = (user.inventory[caught.item] || 0) + qty;

  const expReward = caught.exp;
  const levelResult = await addExpWithLevelCheck(sock, m, db, user, expReward);

  db.save();

  await m.react("✅");

  let txt = `شد السنارة! 🎣💦\n\nلقد اصطدت:\n`;
  if (caught.item === "نفايات") {
    txt += `> ${caught.name} 🤢\nللأسف، حصلت على نفايات... على الأقل حصلت على *+${expReward} خبرة* من تنظيف النفايات! 😂\n\n`;
  } else {
    txt += `> *${caught.name}* 🎉✨\nرائع! حصلت أيضاً على *+${expReward} خبرة*!\n\n`;
  }
  
  txt += `⚡ الطاقة المستخدمة: *-${staminaCost}*\n`;
  txt += `\nالأسماك/النفايات في حقيبتك (\`.مخزون\`)! عد للصيد مرة أخرى! 💖🌊`;

  await m.reply(txt);
}

export { pluginConfig as config, handler };