// متجر_الحيوانات - أمر لشراء حيوان أليف من المتجر

import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "متجر_الحيوانات",
  alias: ["petshop"],
  category: "rpg",
  description: "شراء حيوان أليف من المتجر",
  usage: ".متجر_الحيوانات <شراء> <الحيوان>",
  example: ".متجر_الحيوانات شراء قط",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 0,
  isEnabled: true,
};

const PETS_FOR_SALE = {
  قط: { name: "🐱 قط", price: 5000, desc: "يجلب الحظ (حظ عالي، هجوم متوسط)" },
  كلب: { name: "🐕 كلب", price: 6000, desc: "حارس مخلص (هجوم عالي، دفاع جيد)" },
  طائر: { name: "🐦 طائر", price: 4500, desc: "رشيق ومحظوظ (حظ عالي جداً)" },
  سمكة: { name: "🐟 سمكة", price: 3000, desc: "رخيصة (تجلب الحظ)" },
  أرنب: { name: "🐰 أرنب", price: 5500, desc: "صغير ورشيق (جميع الإحصائيات متوازنة)" },
};

function handler(m) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};
  if (!user.inventory) user.inventory = {};

  const args = m.args || [];
  const action = args[0]?.toLowerCase();
  const petKey = args[1]?.toLowerCase();

  if (!action || action !== "شراء" && action !== "buy") {
    let txt = `مرحباً أيها المغامر! مرحباً بك في متجر الحيوانات الأليفة 🐾🏪\n`;
    txt += `اختر رفيقاً لمغامراتك!\n\n`;
    
    txt += `*قائمة الحيوانات:*\n`;
    for (const [key, pet] of Object.entries(PETS_FOR_SALE)) {
      txt += `\n*${pet.name}*\n`;
      txt += `💰 السعر: ${pet.price.toLocaleString("ar-EG")} عملة\n`;
      txt += `📝 الصفات: ${pet.desc}\n`;
      txt += `👉 شراء: \`.متجر_الحيوانات شراء ${key}\`\n`;
    }
    
    txt += `\n\n💰 *رصيدك:* ${(user.koin || 0).toLocaleString("ar-EG")} عملة`;
    return m.reply(txt);
  }

  if (action === "buy" || action === "شراء") {
    if (!petKey) {
      return m.reply(`ما الحيوان الذي تريد شراءه؟ 😂\nمثال: \`${m.prefix}متجر_الحيوانات شراء قط\``);
    }

    if (user.rpg.pet) {
      return m.reply(`لديك بالفعل حيوان أليف! 😭\nسيكون غيوراً. تخلى عن حيوانك القديم أو استخدم نظام التزاوج (\`.تزاوج\`).`);
    }

    const petToBuy = PETS_FOR_SALE[petKey];
    if (!petToBuy) {
      return m.reply(`هذا الحيوان غير متوفر! ❌\nتحقق من القائمة باستخدام \`${m.prefix}متجر_الحيوانات\``);
    }

    if ((user.koin || 0) < petToBuy.price) {
      return m.reply(`رصيدك غير كافٍ! 😭\nالسعر ${petToBuy.price.toLocaleString("ar-EG")} عملة، لديك فقط ${(user.koin || 0).toLocaleString("ar-EG")} عملة`);
    }

    user.koin -= petToBuy.price;

    user.rpg.pet = {
      type: petKey,
      name: petToBuy.name.split(" ")[1] || "حيواني",
      level: 1,
      exp: 0,
      hunger: 80,
      stats: null,
    };

    db.save();

    return m.reply(
      `تهانينا! 🎉🎉\n\n` +
        `لقد تبنيت *${petToBuy.name}*!\n` +
        `💰 رسوم التبني: *-${petToBuy.price.toLocaleString("ar-EG")}* عملة\n\n` +
        `إنه متحمس لمرافقتك! لا تنس إطعامه والاطلاع على حالته باستخدام \`${m.prefix}حيوان_أليف\`! 🐾✨`
    );
  }
}

export { pluginConfig as config, handler };