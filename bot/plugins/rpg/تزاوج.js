// تزاوج - أمر لتزاوج الحيوانات الأليفة للحصول على حيوان جديد

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "تزاوج",
  alias: ["breeding"],
  category: "rpg",
  description: "تزاوج الحيوانات الأليفة للحصول على حيوان جديد",
  usage: ".تزاوج @مستخدم",
  example: ".تزاوج @مستخدم",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 3600,
  energi: 3,
  isEnabled: true,
};

const BREEDING_RESULTS = {
  "قط+قط": ["قط", "قط", "أسد"],
  "كلب+كلب": ["كلب", "كلب", "ذئب"],
  "قط+كلب": ["قط", "كلب", "أرنب"],
  "طائر+طائر": ["طائر", "طائر", "فينيكس"],
  "سمكة+سمكة": ["سمكة", "سمكة", "تنين"],
  "أرنب+أرنب": ["أرنب", "أرنب", "أرنب_رعدي"],
  "قط+طائر": ["قط", "طائر", "فينيكس"],
  "كلب+أرنب": ["كلب", "أرنب", "ذئب"],
  default: ["قط", "كلب", "طائر", "سمكة", "أرنب"],
};

const PET_NAMES = {
  قط: "🐱 قط",
  كلب: "🐕 كلب",
  طائر: "🐦 طائر",
  سمكة: "🐟 سمكة",
  أرنب: "🐰 أرنب",
  أسد: "🦁 أسد",
  ذئب: "🐺 ذئب",
  فينيكس: "🔥 فينيكس",
  تنين: "🐉 تنين",
  أرنب_رعدي: "⚡ أرنب رعدي",
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};

  const mentioned = m.mentionedJid?.[0] || m.quoted?.sender;

  if (!mentioned) {
    return m.reply(
      `💕 *تربية وتزاوج الحيوانات* 💕\n\n` +
        `هذا النظام يسمح لحيوانك الأليف بالتزاوج مع حيوان لاعب آخر!\nقد تحصل على سلالة نادرة! ✨\n\n` +
        `*طريقة الاستخدام:*\n` +
        `👉 \`${m.prefix}تزاوج @مستخدم_الهدف\`\n\n` +
        `*الشروط:*\n` +
        `1. أنت والهدف كل لديكم حيوان أليف\n` +
        `2. كلا الحيوانين بمستوى 5 على الأقل\n` +
        `3. رسوم الولادة: *3000 عملة*`
    );
  }

  if (mentioned === m.sender) {
    return m.reply(`هل تريد التزاوج مع نفسك؟ لا يمكن! أشر إلى صديقك! 😂❌`);
  }

  if (!user.rpg.pet) {
    return m.reply(`ليس لديك حيوان أليف! اشترِ واحداً من \`${m.prefix}متجر_الحيوانات\` 😭`);
  }

  const partner = db.getUser(mentioned);
  if (!partner?.rpg?.pet) {
    return m.reply(`الشخص الذي أشرت إليه ليس لديه حيوان أليف! حيوانك الأليف وحيد. 💔`);
  }

  const myPet = user.rpg.pet;
  const partnerPet = partner.rpg.pet;

  if ((myPet.level || 1) < 5) {
    return m.reply(`حيوانك الأليف لا يزال صغيراً جداً للتزاوج! يحتاج إلى *مستوى 5* على الأقل (مستواه الحالي ${myPet.level || 1}). 🐣`);
  }

  if ((partnerPet.level || 1) < 5) {
    return m.reply(`حيوان شريكك لا يزال صغيراً جداً للتزاوج! يحتاج إلى *مستوى 5* على الأقل (مستواه الحالي ${partnerPet.level || 1}). 🐣`);
  }

  const breedingCost = 3000;
  if ((user.koin || 0) < breedingCost) {
    return m.reply(`ليس لديك ما يكفي من المال لدفع رسوم الطبيب البيطري! تحتاج ${breedingCost.toLocaleString("ar-EG")} عملة. 😭`);
  }

  user.koin -= breedingCost;

  await m.react("💕");
  await m.reply(`انظر، ${PET_NAMES[myPet.type]} الخاص بك مع ${PET_NAMES[partnerPet.type]} شريكك في موعد غرامي... 💕✨\nانتظر قليلاً، الطبيب البيطري يفحص الولادة!`);
  await new Promise((r) => setTimeout(r, 4000));

  // ترجمة أنواع الحيوانات للمفتاح
  const petTypeMap = {
    'قط': 'قط',
    'كلب': 'كلب',
    'طائر': 'طائر',
    'سمكة': 'سمكة',
    'أرنب': 'أرنب'
  };
  
  const myType = petTypeMap[myPet.type] || myPet.type;
  const partnerType = petTypeMap[partnerPet.type] || partnerPet.type;
  const breedKey = [myType, partnerType].sort().join("+");
  const possibleResults = BREEDING_RESULTS[breedKey] || BREEDING_RESULTS["default"];
  const resultPetType = possibleResults[Math.floor(Math.random() * possibleResults.length)];

  const isRare = ["أسد", "ذئب", "فينيكس", "تنين", "أرنب_رعدي"].includes(resultPetType);

  if (!user.rpg.petStorage) user.rpg.petStorage = [];

  const newPet = {
    type: resultPetType,
    name: PET_NAMES[resultPetType]?.split(" ")[1] || "صغير",
    level: 1,
    exp: 0,
    hunger: 100,
    stats: null,
    birthDate: Date.now(),
  };

  user.rpg.petStorage.push(newPet);

  const expReward = isRare ? 500 : 200;
  await addExpWithLevelCheck(sock, m, db, user, expReward);
  db.save();

  await m.react(isRare ? "🎉" : "✅");

  let txt = `أوه!! ولادة جديدة! 🍼✨\n\n`;
  if (isRare) {
    txt += `🎉 *محظوظ!! سلالة نادرة!!* 🎉\n`;
  }
  
  txt += `تهانينا! لقد نجحت في إنجاب صغير:\n`;
  txt += `🐣 النوع: *${PET_NAMES[resultPetType]}*\n\n`;
  
  txt += `حصلت على خبرة *+${expReward}*\n`;
  txt += `رسوم الولادة: *-${breedingCost.toLocaleString("ar-EG")}* عملة\n\n`;
  
  txt += `*(تم حفظ الصغير في مخزن الحيوانات. إجمالي مخزونك: ${user.rpg.petStorage.length} حيوان)*`;

  return m.reply(txt, { mentions: [m.sender, mentioned] });
}

export { pluginConfig as config, handler };