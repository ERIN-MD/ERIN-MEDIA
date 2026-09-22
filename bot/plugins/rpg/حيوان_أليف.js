// حيوان_أليف - أمر لإدارة الحيوانات الأليفة

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "حيوان_أليف",
  alias: ["pet"],
  category: "rpg",
  description: "إدارة الحيوانات الأليفة",
  usage: ".حيوان_أليف <إطعام/تدريب/حالة>",
  example: ".حيوان_أليف حالة",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 0,
  isEnabled: true,
};

const PET_TYPES = {
  قط: { name: "🐱 قط", baseStats: { هجوم: 5, دفاع: 3, حظ: 5 }, evolve: "أسد" },
  كلب: { name: "🐕 كلب", baseStats: { هجوم: 8, دفاع: 5, حظ: 2 }, evolve: "ذئب" },
  طائر: { name: "🐦 طائر", baseStats: { هجوم: 4, دفاع: 2, حظ: 8 }, evolve: "فينيكس" },
  سمكة: { name: "🐟 سمكة", baseStats: { هجوم: 2, دفاع: 2, حظ: 10 }, evolve: "تنين" },
  أرنب: { name: "🐰 أرنب", baseStats: { هجوم: 3, دفاع: 4, حظ: 6 }, evolve: "أرنب_رعدي" },
  أسد: { name: "🦁 أسد", baseStats: { هجوم: 15, دفاع: 10, حظ: 8 }, evolve: null },
  ذئب: { name: "🐺 ذئب", baseStats: { هجوم: 18, دفاع: 12, حظ: 5 }, evolve: null },
  فينيكس: { name: "🔥 فينيكس", baseStats: { هجوم: 12, دفاع: 8, حظ: 15 }, evolve: null },
  تنين: { name: "🐉 تنين", baseStats: { هجوم: 20, دفاع: 15, حظ: 12 }, evolve: null },
  أرنب_رعدي: { name: "⚡ أرنب رعدي", baseStats: { هجوم: 10, دفاع: 12, حظ: 18 }, evolve: null },
};

const FOOD_ITEMS = {
  خبز: { name: "🍞 خبز", hunger: 10, exp: 5 },
  سمكة: { name: "🐟 سمكة", hunger: 20, exp: 10 },
  لحم: { name: "🍖 لحم", hunger: 30, exp: 15 },
  فاكهة: { name: "🍎 فاكهة", hunger: 15, exp: 8 },
  طعام_مميز: { name: "⭐ طعام مميز", hunger: 50, exp: 30 },
};

function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};
  if (!user.inventory) user.inventory = {};

  const args = m.args || [];
  const action = args[0]?.toLowerCase();

  if (!user.rpg.pet) {
    return m.reply(
      `ليس لديك حيوان أليف! 😭\nمن الحزين أن تخوض المغامرة وحدك...\n\n` +
        `*طريقة الحصول على رفيق:*\n` +
        `🛒 الشراء من \`${m.prefix}متجر_الحيوانات\`\n` +
        `💕 الحصول من \`${m.prefix}تزاوج\`\n` +
        `🗡️ الحصول من الزعماء!`
    );
  }

  const pet = user.rpg.pet;
  const petInfo = PET_TYPES[pet.type];

  if (!action || !["إطعام", "تدريب", "حالة", "تسمية", "تطور"].includes(action) && !["feed", "train", "status", "rename", "evolve"].includes(action)) {
    const maxHunger = 100;
    const hungerStatus = pet.hunger >= 70 ? "😊 سعيد وممتلئ" : pet.hunger >= 40 ? "😐 عادي" : "😰 جائع جداً!";

    let txt = `🐾 *بطاقة تعريف الحيوان الأليف* 🐾\n\n`;
    txt += `*معلومات ${pet.name}:*\n`;
    txt += `• النوع: *${petInfo.name}*\n`;
    txt += `• المستوى: *${pet.level || 1}*\n`;
    txt += `• الخبرة: *${pet.exp || 0} / ${(pet.level || 1) * 100}*\n`;
    txt += `• الجوع: *${pet.hunger}/${maxHunger}* (${hungerStatus})\n\n`;

    txt += `*الإحصائيات:*\n`;
    txt += `⚔️ الهجوم: *${pet.stats?.هجوم || petInfo.baseStats.هجوم}*\n`;
    txt += `🛡️ الدفاع: *${pet.stats?.دفاع || petInfo.baseStats.دفاع}*\n`;
    txt += `🍀 الحظ: *${pet.stats?.حظ || petInfo.baseStats.حظ}*\n\n`;

    txt += `*التفاعلات:*\n`;
    txt += `👉 \`${m.prefix}حيوان_أليف إطعام <الطعام>\` - إطعام\n`;
    txt += `👉 \`${m.prefix}حيوان_أليف تدريب\` - تدريب\n`;
    txt += `👉 \`${m.prefix}حيوان_أليف تسمية <اسم_جديد>\` - تغيير الاسم\n`;
    if (petInfo.evolve) {
      txt += `👉 \`${m.prefix}حيوان_أليف تطور\` - التطور (عند توفر الشروط)\n`;
    }

    return m.reply(txt);
  }

  if (action === "feed" || action === "إطعام") {
    const foodKey = args[1]?.toLowerCase();

    if (!foodKey) {
      let txt = `${pet.name} ينظر إليك وهو يلعق شفتيه... 🤤\nماذا تريد أن تطعمه؟\n\n`;
      txt += `*قائمة الطعام في حقيبتك:*\n`;
      for (const [key, food] of Object.entries(FOOD_ITEMS)) {
        const have = user.inventory[key] || 0;
        txt += `\n*${food.name}* (لديك: ${have}×)\n`;
        txt += `🍖 الشبع: +${food.hunger} | ✨ الخبرة: +${food.exp}\n`;
        txt += `👉 إطعام: \`.حيوان_أليف إطعام ${key}\`\n`;
      }
      return m.reply(txt);
    }

    const food = FOOD_ITEMS[foodKey];
    if (!food) {
      return m.reply(`لا تطعمه أشياء غريبة! سيصاب بمغص! 😂❌`);
    }

    if ((user.inventory[foodKey] || 0) < 1) {
      return m.reply(`ليس لديك *${food.name}* في حقيبتك! اشتري أولاً! 🛒🏃`);
    }

    if (pet.hunger >= 100) {
      return m.reply(`${pet.name} ممتلئ جداً! لا تعذبه بإطعامه أكثر! 🤢`);
    }

    user.inventory[foodKey]--;
    if (user.inventory[foodKey] <= 0) delete user.inventory[foodKey];

    pet.hunger = Math.min(100, pet.hunger + food.hunger);
    pet.exp = (pet.exp || 0) + food.exp;

    let levelUpMsg = "";
    const expNeeded = (pet.level || 1) * 100;
    if (pet.exp >= expNeeded) {
      pet.level = (pet.level || 1) + 1;
      pet.exp -= expNeeded;
      pet.stats = pet.stats || { ...petInfo.baseStats };
      pet.stats.هجوم += 2;
      pet.stats.دفاع += 1;
      pet.stats.حظ += 1;
      levelUpMsg = `\n🎉 *${pet.name} وصل إلى المستوى ${pet.level}!* 🎉`;
    }

    db.save();

    return m.reply(
      `يم... يم... يم! 🤤🍖\n\n` +
        `${pet.name} أكل *${food.name}* بشهية!\n` +
        `🍖 الشبع: *+${food.hunger}* (${pet.hunger}/100)\n` +
        `✨ الخبرة: *+${food.exp}*` +
        levelUpMsg
    );
  }

  if (action === "train" || action === "تدريب") {
    if (pet.hunger < 20) {
      return m.reply(`قاسٍ! تدريبه وهو جائع! 😭\n${pet.name} جائع جداً، أطعمه أولاً!`);
    }

    pet.hunger = Math.max(0, pet.hunger - 15);
    const expGain = 20 + Math.floor(Math.random() * 20);
    pet.exp = (pet.exp || 0) + expGain;

    let levelUpMsg = "";
    const expNeeded = (pet.level || 1) * 100;
    if (pet.exp >= expNeeded) {
      pet.level = (pet.level || 1) + 1;
      pet.exp -= expNeeded;
      pet.stats = pet.stats || { ...petInfo.baseStats };
      pet.stats.هجوم += 2;
      pet.stats.دفاع += 1;
      pet.stats.حظ += 1;
      levelUpMsg = `\n🎉 *${pet.name} وصل إلى المستوى ${pet.level}!* 🎉`;
    }

    db.save();

    let txt = `هوب! هوب! هيا!! 🏃‍♂️💨\n\n`;
    txt += `${pet.name} تدرب بقوة اليوم!\n`;
    txt += `✨ الخبرة المكتسبة: *+${expGain}*\n`;
    txt += `😰 الجوع: *-15*\n`;
    txt += levelUpMsg;

    return m.reply(txt);
  }

  if (action === "rename" || action === "تسمية") {
    const newName = args.slice(1).join(" ");
    if (!newName || newName.length < 2 || newName.length > 15) {
      return m.reply(`اسم غريب! اختر اسماً مناسباً (2-15 حرفاً)! 😂`);
    }

    const oldName = pet.name;
    pet.name = newName;
    db.save();

    return m.reply(`تم تغيير الاسم!\nالآن يدعى *${newName}*! (كان سابقاً: ${oldName}) ✨`);
  }

  if (action === "evolve" || action === "تطور") {
    if (!petInfo.evolve) {
      return m.reply(`${pet.name} في ذروة تطوره، لا يمكنه التطور أكثر! 🌟`);
    }

    if ((pet.level || 1) < 10) {
      return m.reply(`${pet.name} لا يزال صغيراً! يحتاج *المستوى 10* للتطور (مستواه الحالي ${pet.level || 1}). 🐣`);
    }

    const evolvedPet = PET_TYPES[petInfo.evolve];
    pet.type = petInfo.evolve;
    pet.stats = { ...evolvedPet.baseStats };
    pet.level = 1;
    pet.exp = 0;

    db.save();

    return m.reply(
      `رنين!! ✨🌟\n\n` +
        `${pet.name} يضيء فجأة!\n` +
        `لقد *تطور* إلى *${evolvedPet.name}* القوي!\n\n` +
        `إحصائياته أعيدت لكنه أصبح أقوى بكثير! استخدم \`.حيوان_أليف حالة\` للمشاهدة! 😎🔥`
    );
  }
}

export { pluginConfig as config, handler };