// كيمياء - أمر لصنع الجرعات والخلطات من الأعشاب

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "كيمياء",
  alias: ["alchemy"],
  category: "rpg",
  description: "صنع الجرعات والخلطات من الأعشاب",
  usage: ".كيمياء <الجرعة>",
  example: ".كيمياء جرعة_صحة",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 60,
  energi: 1,
  isEnabled: true,
};

const POTIONS = {
  جرعة_صحة: {
    name: "❤️ جرعة الصحة",
    materials: { عشبة: 3 },
    effect: "استعادة 50 نقطة صحة",
    exp: 80,
    result: "جرعة_صحة",
  },
  جرعة_مانا: {
    name: "💙 جرعة المانا",
    materials: { عشبة: 2, زهرة: 1 },
    effect: "استعادة 50 نقطة مانا",
    exp: 90,
    result: "جرعة_مانا",
  },
  جرعة_طاقة: {
    name: "⚡ جرعة الطاقة",
    materials: { عشبة: 2, فطر: 1 },
    effect: "استعادة 30 نقطة طاقة",
    exp: 100,
    result: "جرعة_طاقة",
  },
  جرعة_قوة: {
    name: "💪 جرعة القوة",
    materials: { عشبة: 3, حراشف_تنين: 1 },
    effect: "+20 هجوم (5 دقائق)",
    exp: 200,
    result: "جرعة_قوة",
  },
  جرعة_دفاع: {
    name: "🛡️ جرعة الدفاع",
    materials: { عشبة: 3, حديد: 2 },
    effect: "+15 دفاع (5 دقائق)",
    exp: 180,
    result: "جرعة_دفاع",
  },
  جرعة_حظ: {
    name: "🍀 جرعة الحظ",
    materials: { عشبة: 5, ماس: 1 },
    effect: "+30% فرصة السقوط (10 دقائق)",
    exp: 300,
    result: "جرعة_حظ",
  },
  جرعة_خبرة: {
    name: "✨ جرعة الخبرة",
    materials: { عشبة: 4, ذهب: 2 },
    effect: "+50% خبرة (15 دقيقة)",
    exp: 250,
    result: "جرعة_خبرة",
  },
  ترياق: {
    name: "💊 الترياق",
    materials: { عشبة: 2 },
    effect: "علاج السم",
    exp: 50,
    result: "ترياق",
  },
  إكسير: {
    name: "🧪 الإكسير",
    materials: { عشبة: 10, ماس: 2, ذهب: 5 },
    effect: "استعادة جميع الإحصائيات",
    exp: 500,
    result: "إكسير",
  },
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.inventory) user.inventory = {};
  if (!user.rpg) user.rpg = {};

  const args = m.args || [];
  const potionName = args[0]?.toLowerCase();

  if (!potionName) {
    let txt = `مرحباً أيها الخيميائي! ماذا تريد أن تصنع اليوم؟ 🧙‍♂️🧪\n\n`;
    txt += `*قائمة وصفات الخلطات:*\n`;

    for (const [key, pot] of Object.entries(POTIONS)) {
      const mats = Object.entries(pot.materials)
        .map(([m, qty]) => `${qty}x ${m}`)
        .join(", ");
      txt += `\n*${pot.name}*\n`;
      txt += `📦 المكونات: ${mats}\n`;
      txt += `💫 التأثير: ${pot.effect}\n`;
      txt += `👉 اكتب: \`.كيمياء ${key}\`\n`;
    }
    txt += `\n💡 *نصيحة:* يمكنك الحصول على الأعشاب من \`.حديقة\` أو \`.زنزانة\`! 🌱`;

    return m.reply(txt);
  }

  const potion = POTIONS[potionName];
  if (!potion) {
    return m.reply(`هذه وصفة خطيرة! غير موجودة في الكتاب! 😂\nتحقق من القائمة باستخدام \`.كيمياء\`!`);
  }

  const missingMaterials = [];
  for (const [material, needed] of Object.entries(potion.materials)) {
    const have = user.inventory[material] || 0;
    if (have < needed) {
      missingMaterials.push(`• ${material}: ${have}/${needed}`);
    }
  }

  if (missingMaterials.length > 0) {
    return m.reply(`المكونات غير كافية لصنع *${potion.name}*! 😭\n\nالناقص:\n${missingMaterials.join("\n")}\n\nاجمع المزيد من الأعشاب أولاً! 🏃💨`);
  }

  await m.react("🧪");
  await m.reply(`فقاقيع... طقطقة! 🧪✨\nخلط المكونات لصنع *${potion.name}*... احترس من الانفجار! 💥`);
  await new Promise((r) => setTimeout(r, 3000));

  for (const [material, needed] of Object.entries(potion.materials)) {
    user.inventory[material] -= needed;
    if (user.inventory[material] <= 0) delete user.inventory[material];
  }

  user.inventory[potion.result] = (user.inventory[potion.result] || 0) + 1;

  await addExpWithLevelCheck(sock, m, db, user, potion.exp);
  db.save();

  await m.react("✅");
  return m.reply(
    `رن!! تم صنع الجرعة بنجاح! 🎉🧪\n\n` +
      `لقد صنعت:\n` +
      `📦 العنصر: *${potion.name}*\n` +
      `💫 التأثير: *${potion.effect}*\n` +
      `📈 خبرة الكيمياء: *+${potion.exp}*\n\n` +
      `لا تشربها كلها مرة واحدة وإلا ستتألم! 😂`
  );
}

export { pluginConfig as config, handler };