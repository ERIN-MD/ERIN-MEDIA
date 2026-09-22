// حديقة - أمر للزراعة وحصاد المحاصيل

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";

const pluginConfig = {
  name: "حديقة",
  alias: ["garden"],
  category: "rpg",
  description: "الزراعة وحصاد المحاصيل",
  usage: ".حديقة <زرع/حصاد/حالة>",
  example: ".حديقة زرع جزر",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 0,
  isEnabled: true,
};

const CROPS = {
  جزر: { name: "🥕 جزر", growTime: 300000, exp: 50, sellPrice: 30, seedPrice: 10 },
  طماطم: { name: "🍅 طماطم", growTime: 600000, exp: 80, sellPrice: 50, seedPrice: 20 },
  ذرة: { name: "🌽 ذرة", growTime: 900000, exp: 120, sellPrice: 80, seedPrice: 35 },
  بطاطس: { name: "🥔 بطاطس", growTime: 1200000, exp: 150, sellPrice: 100, seedPrice: 45 },
  فراولة: { name: "🍓 فراولة", growTime: 1800000, exp: 200, sellPrice: 150, seedPrice: 60 },
  بطيخ: { name: "🍉 بطيخ", growTime: 3600000, exp: 350, sellPrice: 300, seedPrice: 100 },
  قرع: { name: "🎃 قرع", growTime: 7200000, exp: 500, sellPrice: 500, seedPrice: 150 },
  عشبة: { name: "🌿 عشبة", growTime: 1500000, exp: 180, sellPrice: 120, seedPrice: 50 },
};

function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return minutes > 0 ? `${minutes}د ${seconds}ث` : `${seconds}ث`;
}

async function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};
  if (!user.inventory) user.inventory = {};
  if (!user.rpg.garden) user.rpg.garden = { plots: [], maxPlots: 3 };

  const args = m.args || [];
  const action = args[0]?.toLowerCase();
  const cropName = args[1]?.toLowerCase();

  if (!action || !["زرع", "حصاد", "حالة", "شراء"].includes(action) && !["plant", "harvest", "status", "buy"].includes(action)) {
    let txt = `مرحباً أيها المزارع! 👨‍🌾🌻\n`;
    txt += `مركز معلومات حديقتك الشخصية.\n\n`;
    
    txt += `*قائمة الحديقة:*\n`;
    txt += `• \`${m.prefix}حديقة حالة\` - التحقق من حالة الحديقة\n`;
    txt += `• \`${m.prefix}حديقة شراء <النبات> <الكمية>\` - شراء البذور\n`;
    txt += `• \`${m.prefix}حديقة زرع <النبات>\` - زرع البذور في أرض فارغة\n`;
    txt += `• \`${m.prefix}حديقة حصاد\` - حصاد كل ما نضج\n\n`;

    txt += `*قائمة البذور المتاحة:*\n`;
    for (const [key, crop] of Object.entries(CROPS)) {
      txt += `\n*${crop.name}*\n`;
      txt += `⏳ وقت النمو: ${formatTime(crop.growTime)}\n`;
      txt += `💰 سعر البيع: ${crop.sellPrice} | 🌱 سعر البذور: ${crop.seedPrice}\n`;
      txt += `👉 شراء: \`.حديقة شراء ${key}\`\n`;
    }
    return m.reply(txt);
  }

  if (action === "status" || action === "حالة") {
    const garden = user.rpg.garden;
    let txt = `فحص أرض الحديقة... 🚜🌱\n\n`;
    txt += `*السعة:* ${garden.plots.length} من ${garden.maxPlots} مستخدمة.\n\n`;

    if (garden.plots.length === 0) {
      txt += `حديقتك فارغة! 🏜️\nاشترِ بذوراً وازرع باستخدام \`.حديقة زرع <الاسم>\``;
    } else {
      txt += `*قائمة الأراضي:*\n`;
      for (let i = 0; i < garden.plots.length; i++) {
        const plot = garden.plots[i];
        const crop = CROPS[plot.crop];
        const elapsed = Date.now() - plot.plantedAt;
        const remaining = Math.max(0, crop.growTime - elapsed);
        const ready = remaining <= 0;

        txt += `\n📍 القطعة ${i + 1}: *${crop.name}*\n`;
        txt += `└ الحالة: ${ready ? "✨ جاهز للحصاد! ✨" : `ينمو ⏳ ${formatTime(remaining)}`}\n`;
      }
    }
    return m.reply(txt);
  }

  if (action === "buy" || action === "شراء") {
    if (!cropName) {
      return m.reply(`ما البذور التي تريد شراءها؟ 😂\nمثال: \`.حديقة شراء جزر 5\``);
    }

    const crop = CROPS[cropName];
    if (!crop) {
      return m.reply(`هذه البذور غير متوفرة في متجرنا! ❌\nتحقق من القائمة باستخدام \`.حديقة\``);
    }

    const qty = Math.max(1, parseInt(args[2]) || 1);
    const totalCost = crop.seedPrice * qty;

    if ((user.koin || 0) < totalCost) {
      return m.reply(`رصيدك غير كافٍ! 😭\nالإجمالي ${totalCost.toLocaleString("ar-EG")} عملة، لديك ${(user.koin || 0).toLocaleString("ar-EG")} عملة.`);
    }

    user.koin -= totalCost;
    const seedKey = `${cropName}بذرة`;
    user.inventory[seedKey] = (user.inventory[seedKey] || 0) + qty;
    db.save();

    return m.reply(`شكراً لشرائك من متجر المزارع! 🛒🌱\n\nاشتريت *${qty}x بذور ${crop.name}*\nالإجمالي: *${totalCost.toLocaleString("ar-EG")}* عملة\n\nلا تنسَ زراعتها باستخدام \`.حديقة زرع ${cropName}\`!`);
  }

  if (action === "plant" || action === "زرع") {
    if (!cropName) {
      return m.reply(`الأرض جاهزة، لكن ما البذور التي تريد زراعتها؟ 🌱\nمثال: \`.حديقة زرع جزر\``);
    }

    const crop = CROPS[cropName];
    if (!crop) {
      return m.reply(`هذا النبات غير موجود في دليل المزارع! ❌`);
    }

    if (user.rpg.garden.plots.length >= user.rpg.garden.maxPlots) {
      return m.reply(`الأرض ممتلئة! 🚜💨\nاحصد أولاً أو وسّع حديقتك!`);
    }

    const seedKey = `${cropName}بذرة`;
    if ((user.inventory[seedKey] || 0) < 1) {
      return m.reply(`ليس لديك بذور *${crop.name}*! 😭\nاشترِ من \`.حديقة شراء ${cropName}\``);
    }

    user.inventory[seedKey]--;
    if (user.inventory[seedKey] <= 0) delete user.inventory[seedKey];

    user.rpg.garden.plots.push({
      crop: cropName,
      plantedAt: Date.now(),
    });
    db.save();

    return m.reply(`تم زرع بذور *${crop.name}*! 🌱💦\nانتظر *${formatTime(crop.growTime)}* للحصاد!`);
  }

  if (action === "harvest" || action === "حصاد") {
    const garden = user.rpg.garden;
    const readyPlots = garden.plots.filter((p) => {
      const crop = CROPS[p.crop];
      return Date.now() - p.plantedAt >= crop.growTime;
    });

    if (readyPlots.length === 0) {
      return m.reply(`لا شيء نضج بعد! تحقق من الحالة باستخدام \`.حديقة حالة\``);
    }

    let totalExp = 0;
    let harvestedItems = [];

    for (const plot of readyPlots) {
      const crop = CROPS[plot.crop];
      const qty = Math.floor(Math.random() * 3) + 2;
      user.inventory[plot.crop] = (user.inventory[plot.crop] || 0) + qty;
      totalExp += crop.exp;
      harvestedItems.push(`• ${crop.name} ×${qty}`);
    }

    garden.plots = garden.plots.filter((p) => {
      const crop = CROPS[p.crop];
      return Date.now() - p.plantedAt < crop.growTime;
    });

    await addExpWithLevelCheck(sock, m, db, user, totalExp);
    db.save();

    await m.react("✅");
    return m.reply(
      `حصاد وفير! 🚜🌾✨\n\n` +
        `ثمار تعبك. هذا ما حصلت عليه:\n` +
        harvestedItems.join("\n") +
        `\n\n` +
        `📈 خبرة الزراعة الإضافية: *+${totalExp}*\n\n` +
        `ازرع مرة أخرى لتصبح أكثر ثراءً! 💸`
    );
  }
}

export { pluginConfig as config, handler };