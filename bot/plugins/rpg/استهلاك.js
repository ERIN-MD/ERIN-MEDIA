// استهلاك - أمر لاستخدام العناصر الاستهلاكية أو فتح الصناديق

import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "استهلاك",
  alias: ["use"],
  category: "rpg",
  description: "استخدام العناصر الاستهلاكية أو فتح الصناديق",
  usage: ".استهلاك <العنصر>",
  example: ".استهلاك جرعة",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);
  const args = m.args || [];
  const itemKey = args[0]?.toLowerCase();

  if (!itemKey) {
    return m.reply(
      `🎒 *استهلاك العنصر*\n\n` +
      `*📋 طريقة الاستخدام:*\n` +
      `> \`.استهلاك <اسم_العنصر>\`\n` +
      `> تحقق من المخزون: \`.مخزون\``,
    );
  }

  user.inventory = user.inventory || {};
  user.rpg = user.rpg || {};
  user.rpg.health = user.rpg.health || 100;
  user.rpg.maxHealth = user.rpg.maxHealth || 100;
  user.rpg.mana = user.rpg.mana || 100;
  user.rpg.maxMana = user.rpg.maxMana || 100;
  user.rpg.stamina = user.rpg.stamina || 100;
  user.rpg.maxStamina = user.rpg.maxStamina || 100;

  const count = user.inventory[itemKey] || 0;

  if (count <= 0) {
    return m.reply(
      `❌ *العنصر غير موجود*\n\n` +
      `> ليس لديك عنصر *${itemKey}*!\n` +
      `> تحقق من المخزون: \`.مخزون\``,
    );
  }

  let msg = "";

  switch (itemKey) {
    case "جرعة":
    case "potion":
      if (user.rpg.health >= user.rpg.maxHealth) {
        return m.reply(`❤️ *الصحة ممتلئة*\n\n> صحتك ممتلئة بالفعل!`);
      }
      user.rpg.health = Math.min(user.rpg.health + 50, user.rpg.maxHealth);
      user.inventory[itemKey]--;
      msg = `🥤 *تم استهلاك العنصر*\n\n> شربت *جرعة صحة*.\n> ❤️ صحتك الآن: ${user.rpg.health}/${user.rpg.maxHealth}`;
      break;

    case "جرعة_مانا":
    case "mpotion":
      if (user.rpg.mana >= user.rpg.maxMana) {
        return m.reply(`💧 *المانا ممتلئة*\n\n> المانا لديك ممتلئة بالفعل!`);
      }
      user.rpg.mana = Math.min(user.rpg.mana + 50, user.rpg.maxMana);
      user.inventory[itemKey]--;
      msg = `🧪 *تم استهلاك العنصر*\n\n> شربت *جرعة مانا*.\n> 💧 المانا الآن: ${user.rpg.mana}/${user.rpg.maxMana}`;
      break;

    case "جرعة_طاقة":
    case "stamina":
      if (user.rpg.stamina >= user.rpg.maxStamina) {
        return m.reply(`⚡ *الطاقة ممتلئة*\n\n> طاقتك ممتلئة بالفعل!`);
      }
      user.rpg.stamina = Math.min(user.rpg.stamina + 20, user.rpg.maxStamina);
      user.inventory[itemKey]--;
      msg = `⚡ *تم استهلاك العنصر*\n\n> شربت *جرعة طاقة*.\n> ⚡ طاقتك الآن: ${user.rpg.stamina}/${user.rpg.maxStamina}`;
      break;

    case "عشبة":
    case "herb":
      if (user.rpg.health >= user.rpg.maxHealth) {
        return m.reply(`❤️ *الصحة ممتلئة*\n\n> صحتك ممتلئة بالفعل!`);
      }
      user.rpg.health = Math.min(user.rpg.health + 20, user.rpg.maxHealth);
      user.inventory[itemKey]--;
      msg = `🌿 *تم استهلاك العنصر*\n\n> مضغت *عشبة*.\n> ❤️ صحتك الآن: ${user.rpg.health}/${user.rpg.maxHealth}`;
      break;

    case "جلد":
    case "leather":
      user.rpg.هجوم = (user.rpg.هجوم || 10) + 3;
      user.inventory[itemKey]--;
      msg = `👞 *تم استهلاك العنصر*\n\n> ارتديت *جلداً* للحماية.\n> ⚔️ هجومك زاد: +3 (الآن: ${user.rpg.هجوم})`;
      break;

    case "صندوق_غامض":
    case "mysterybox": {
      user.inventory[itemKey]--;
      const rewards = [
        { type: "koin", min: 1000, max: 50000, icon: "💰" },
        { type: "exp", min: 500, max: 5000, icon: "✨" },
        { type: "جرعة", qty: [1, 3], icon: "🥤" },
        { type: "ماس", qty: [1, 2], icon: "💠" },
      ];
      const pick = rewards[Math.floor(Math.random() * rewards.length)];
      let rewardMsg = "";
      if (pick.type === "koin") {
        const amount =
          Math.floor(Math.random() * (pick.max - pick.min)) + pick.min;
        user.koin = (user.koin || 0) + amount;
        rewardMsg = `${pick.icon} عملات: +${amount.toLocaleString("ar-EG")}`;
      } else if (pick.type === "exp") {
        const amount =
          Math.floor(Math.random() * (pick.max - pick.min)) + pick.min;
        db.updateExp(m.sender, amount);
        rewardMsg = `${pick.icon} خبرة: +${amount.toLocaleString("ar-EG")}`;
      } else {
        const qty =
          Math.floor(Math.random() * (pick.qty[1] - pick.qty[0] + 1)) +
          pick.qty[0];
        user.inventory[pick.type] = (user.inventory[pick.type] || 0) + qty;
        rewardMsg = `${pick.icon} ${pick.type}: +${qty}`;
      }
      msg = `📦 *تم فتح الصندوق الغامض!*\n\n> فتحت صندوقاً غامضاً...\n> ${rewardMsg}`;
      break;
    }

    case "رامن":
    case "bowlramen":
      if (user.rpg.health >= user.rpg.maxHealth) {
        return m.reply(`❤️ *الصحة ممتلئة*\n\n> صحتك ممتلئة، لا حاجة لتناول الرامن!`);
      }
      user.rpg.health = Math.min(user.rpg.health + 40, user.rpg.maxHealth);
      user.inventory[itemKey]--;
      msg = `🍜 *تم استهلاك العنصر*\n\n> أكلت وعاءً من *الرامن الساخن*.\n> ❤️ صحتك تحسنت: ${user.rpg.health}/${user.rpg.maxHealth}`;
      break;

    case "تشاكرا":
    case "chakra":
      if (user.rpg.stamina >= user.rpg.maxStamina) {
        return m.reply(`⚡ *الطاقة ممتلئة*\n\n> طاقتك/تشاكراك ممتلئة بالفعل!`);
      }
      user.rpg.stamina = Math.min(user.rpg.stamina + 30, user.rpg.maxStamina);
      user.inventory[itemKey]--;
      msg = `🌀 *تم استهلاك العنصر*\n\n> امتصصت *شظية تشاكرا*.\n> ⚡ طاقتك زادت: ${user.rpg.stamina}/${user.rpg.maxStamina}`;
      break;

    case "كوناي":
    case "kunai":
    case "شوريكين":
    case "shuriken":
      user.rpg.هجوم = (user.rpg.هجوم || 10) + 2;
      user.inventory[itemKey]--;
      msg = `🗡️ *تم استهلاك العنصر*\n\n> جهزت نفسك بـ *${itemKey}*.\n> ⚔️ هجومك زاد: +2 (الآن: ${user.rpg.هجوم})`;
      break;

    case "مخطوطة":
    case "scroll": {
      user.inventory[itemKey]--;
      const scrollRewards = [
        { type: "koin", min: 2000, max: 10000, icon: "💰" },
        { type: "exp", min: 1000, max: 8000, icon: "✨" },
      ];
      const sPick = scrollRewards[Math.floor(Math.random() * scrollRewards.length)];
      let sRewardMsg = "";
      if (sPick.type === "koin") {
        const amount = Math.floor(Math.random() * (sPick.max - sPick.min)) + sPick.min;
        user.koin = (user.koin || 0) + amount;
        sRewardMsg = `${sPick.icon} عملات (ريو): +${amount.toLocaleString("ar-EG")}`;
      } else {
        const amount = Math.floor(Math.random() * (sPick.max - sPick.min)) + sPick.min;
        db.updateExp(m.sender, amount);
        sRewardMsg = `${sPick.icon} خبرة النينجا: +${amount.toLocaleString("ar-EG")}`;
      }
      msg = `📜 *تم فتح المخطوطة!*\n\n> فتحت مخطوطة النينجا السرية...\n> ${sRewardMsg}`;
      break;
    }

    case "صندوق_عادي":
    case "common":
    case "صندوق_نادر":
    case "uncommon":
    case "صندوق_أسطوري":
    case "mythic":
    case "صندوق_خرافي":
    case "legendary": {
      user.inventory[itemKey]--;
      const rewardMoney =
        Math.floor(Math.random() * (itemKey === "legendary" || itemKey === "صندوق_خرافي" ? 100000 : 10000)) +
        1000;
      const rewardExp =
        Math.floor(Math.random() * (itemKey === "legendary" || itemKey === "صندوق_خرافي" ? 5000 : 500)) +
        100;

      user.koin = (user.koin || 0) + rewardMoney;
      db.updateExp(m.sender, rewardExp);

      // ترجمة اسم الصندوق للعرض
      const chestNames = {
        "صندوق_عادي": "صندوق عادي",
        "common": "صندوق عادي",
        "صندوق_نادر": "صندوق نادر",
        "uncommon": "صندوق نادر",
        "صندوق_أسطوري": "صندوق أسطوري",
        "mythic": "صندوق أسطوري",
        "صندوق_خرافي": "صندوق خرافي",
        "legendary": "صندوق خرافي"
      };
      const chestName = chestNames[itemKey] || itemKey;

      msg =
        `🎁 *تم فتح الصندوق*\n\n` +
        `> فتحت *${chestName}*!\n` +
        `> 💰 العملات: +${rewardMoney.toLocaleString("ar-EG")}\n` +
        `> 🚄 الخبرة: +${rewardExp}`;
      break;
    }

    default:
      return m.reply(
        `❌ *العنصر غير قابل للاستهلاك*\n\n> العنصر *${itemKey}* لا يمكن استخدامه مباشرة.`,
      );
  }

  db.save();
  await m.reply(msg);
}

export { pluginConfig as config, handler };