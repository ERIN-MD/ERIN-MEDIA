// سطو - أمر لسرقة أموال لاعب آخر (محفوف بالمخاطر)

import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";
import { sendRpgPreview } from "../../src/lib/maro-context.js";

const pluginConfig = {
  name: "سطو",
  alias: ["rob"],
  category: "rpg",
  description: "سرقة أموال لاعب آخر (محفوف بالمخاطر)",
  usage: ".سطو @مستخدم",
  example: ".سطو @مستخدم",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 600,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();

  const target = m.mentionedJid?.[0] || m.quoted?.sender;

  if (!target) {
    return m.reply(`من تريد سرقته؟ 🦹‍♂️🔪\nأشر إلى الضحية!\nمثال: \`.سطو @مستخدم\``);
  }

  if (target === m.sender) {
    return m.reply(`هل أنت مجنون؟ تسرق نفسك؟ 😂❌`);
  }

  const robber = db.getUser(m.sender);
  const victim = db.getUser(target);

  if (!victim) {
    return m.reply(`الهدف غير موجود في قاعدة البيانات! يبدو أنه هرب. 🏃💨`);
  }

  if ((victim.koin || 0) < 1000) {
    return m.reply(`الهدف فقير جداً! لديه أقل من 1000 عملة، ابحث عن شخص أغنى! 😤`);
  }

  if (!robber.rpg) robber.rpg = {};
  robber.rpg.health = robber.rpg.health || 100;

  if (robber.rpg.health < 30) {
    return m.reply(`أنت ضعيف جداً للسرقة! 🤒\nتحتاج على الأقل *30 نقطة صحة*، لديك *${robber.rpg.health}*. تعافى أولاً!`);
  }

  await sendRpgPreview(sock, m.chat, `*ششش...* يختبئ في الزقاق المظلم ينتظر الضحية... 🦹‍♂️🔪`, "🦹 سارق", "جاري التنفيذ!", { quoted: m });
  await new Promise((r) => setTimeout(r, 2500));

  const successRate = 0.4;
  const isSuccess = Math.random() < successRate;

  if (isSuccess) {
    const maxSteal = Math.floor((victim.koin || 0) * 0.3);
    const stolen = Math.floor(Math.random() * maxSteal) + 1000;

    victim.koin = (victim.koin || 0) - stolen;
    robber.koin = (robber.koin || 0) + stolen;

    const expGain = 300;
    await addExpWithLevelCheck(sock, m, db, robber, expGain);

    db.save();

    let txt = `رائع! نجحت السرقة! 🦹‍♂️💰\n\n`;
    txt += `أخافت @${target.split("@")[0]} حتى كاد يتبول!\n`;
    txt += `المبلغ المسروق: *+${stolen.toLocaleString("ar-EG")}* عملة\n`;
    txt += `خبرة السرقة الإضافية: *+${expGain}*\n\n`;
    txt += `*اهرب قبل أن يأتي الشرطي!!!* 🚓💨`;

    await m.reply(txt, { mentions: [target] });
  } else {
    const fine = Math.floor(Math.random() * 10000) + 5000;
    const actualFine = Math.min(fine, robber.koin || 0);
    const healthLoss = 25;

    robber.koin = Math.max(0, (robber.koin || 0) - actualFine);
    robber.rpg.health = Math.max(0, robber.rpg.health - healthLoss);

    db.save();

    let txt = `فشل! اكتشفك الناس!! 🚨🤬\n\n`;
    txt += `بدلاً من الحصول على المال، ضربك الجيران!\n`;
    txt += `💸 تمت مصادرة أموالك: *-${actualFine.toLocaleString("ar-EG")}* عملة\n`;
    txt += `🤕 نقص الصحة: *-${healthLoss} نقطة*\n\n`;
    txt += `*لا تعبث في هذا الحي مرة أخرى!* 🤣`;

    await m.reply(txt);
  }
}

export { pluginConfig as config, handler };