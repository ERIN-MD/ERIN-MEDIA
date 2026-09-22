// نقابة - نظام النقابات/العشائر

import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
  name: "نقابة",
  alias: ["guild"],
  category: "rpg",
  description: "نظام النقابات/العشائر",
  usage: ".نقابة <إنشاء/انضمام/مغادرة/معلومات>",
  example: ".نقابة إنشاء فرسان_التنين",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 0,
  isEnabled: true,
};

function handler(m, { sock }) {
  const db = getDatabase();
  const user = db.getUser(m.sender);

  if (!user.rpg) user.rpg = {};

  const args = m.args || [];
  const action = args[0]?.toLowerCase();
  const guildName = args.slice(1).join(" ");

  const guilds = db.db?.data?.guilds || {};

  if (!action || !["إنشاء", "انضمام", "مغادرة", "معلومات", "قائمة", "أعضاء", "تبرع"].includes(action) && !["create", "join", "leave", "info", "list", "members", "deposit"].includes(action)) {
    let txt = `🏰 *نقابة RPG* 🏰\n\n`;
    txt += `أنشئ أو انضم إلى نقابة للحصول على *مزايا* مع أصدقائك!\n\n`;
    txt += `*قائمة الأوامر:*\n`;
    txt += `🗡️ \`${m.prefix}نقابة إنشاء <الاسم>\` (إنشاء نقابة)\n`;
    txt += `🛡️ \`${m.prefix}نقابة انضمام <الاسم>\` (الانضمام إلى نقابة)\n`;
    txt += `🏃 \`${m.prefix}نقابة مغادرة\` (مغادرة النقابة)\n`;
    txt += `📜 \`${m.prefix}نقابة معلومات\` (عرض إحصائيات النقابة)\n`;
    txt += `👥 \`${m.prefix}نقابة أعضاء\` (عرض الأعضاء)\n`;
    txt += `💰 \`${m.prefix}نقابة تبرع <المبلغ>\` (التبرع للخزينة)\n`;
    txt += `🏆 \`${m.prefix}نقابة قائمة\` (أفضل النقابات)\n\n`;

    if (user.rpg.guildId) {
      const myGuild = guilds[user.rpg.guildId];
      txt += `📌 الحالة: عضو في *${myGuild?.name || "غير معروفة"}*`;
    } else {
      txt += `📌 الحالة: *بدون نقابة (وحيد)*`;
    }
    return m.reply(txt);
  }

  if (action === "list" || action === "قائمة") {
    const guildList = Object.values(guilds);
    if (guildList.length === 0) {
      return m.reply(`لا توجد نقابات بعد! أنشئ واحدة باستخدام \`${m.prefix}نقابة إنشاء <الاسم>\``);
    }

    let txt = `🏆 *قائمة أفضل النقابات* 🏆\n\n`;
    for (const g of guildList.slice(0, 10)) {
      txt += `🏰 *${g.name}* (المستوى ${g.level || 1})\n`;
      txt += `👥 الأعضاء: ${g.members?.length || 0}/50\n`;
      txt += `💰 الخزينة: ${(g.treasury || 0).toLocaleString("ar-EG")} عملة\n`;
      txt += `──────────────\n`;
    }
    return m.reply(txt);
  }

  if (action === "create" || action === "إنشاء") {
    if (user.rpg.guildId) {
      return m.reply(`لديك نقابة بالفعل! اخرج أولاً إذا كنت تريد إنشاء نقابة جديدة!`);
    }

    if (!guildName || guildName.length < 3) {
      return m.reply(`اسم النقابة يجب أن يكون *3 أحرف* على الأقل!`);
    }

    if (guildName.length > 20) {
      return m.reply(`اسم النقابة طويل جداً، الحد الأقصى *20 حرفاً*!`);
    }

    const existingGuild = Object.values(guilds).find((g) => g.name.toLowerCase() === guildName.toLowerCase());
    if (existingGuild) {
      return m.reply(`اسم *${guildName}* مستخدم بالفعل! اختر اسماً آخر!`);
    }

    const createCost = 10000;
    if ((user.koin || 0) < createCost) {
      return m.reply(`ليس لديك ما يكفي من المال لتصبح قائداً! تحتاج *10000* عملة لرسوم تسجيل النقابة!`);
    }

    user.koin -= createCost;

    const guildId = `guild_${Date.now()}`;
    if (!db.db.data.guilds) db.db.data.guilds = {};

    db.db.data.guilds[guildId] = {
      id: guildId,
      name: guildName,
      leader: m.sender,
      members: [m.sender],
      treasury: 0,
      level: 1,
      exp: 0,
      createdAt: Date.now(),
    };

    user.rpg.guildId = guildId;
    db.save();

    let txt = `🎉 *تم إنشاء النقابة رسمياً!* 🎉\n\n`;
    txt += `تم تعليق لوحة *${guildName}* في المقر الجديد!\n\n`;
    txt += `👑 القائد: @${m.sender.split("@")[0]}\n`;
    txt += `💸 رسوم الإنشاء: *-${createCost.toLocaleString("ar-EG")}* عملة\n\n`;
    txt += `> _ادعُ أصدقاءك للانضمام باستخدام \`.نقابة انضمام ${guildName}\`!_`;

    return m.reply(txt, { mentions: [m.sender] });
  }

  if (action === "join" || action === "انضمام") {
    if (user.rpg.guildId) {
      return m.reply(`أنت بالفعل عضو في نقابة! لا يمكنك الانضمام إلى أخرى.`);
    }

    if (!guildName) {
      return m.reply(`اكتب اسم النقابة التي تريد الانضمام إليها!\nمثال: \`${m.prefix}نقابة انضمام فرسان_التنين\``);
    }

    const targetGuild = Object.values(guilds).find((g) => g.name.toLowerCase() === guildName.toLowerCase());
    if (!targetGuild) {
      return m.reply(`النقابة *${guildName}* غير موجودة! ربما أخطأت في الكتابة؟`);
    }

    if (targetGuild.members?.length >= 50) {
      return m.reply(`النقابة *${targetGuild.name}* ممتلئة (50/50)!`);
    }

    targetGuild.members = targetGuild.members || [];
    targetGuild.members.push(m.sender);
    user.rpg.guildId = targetGuild.id;
    db.save();

    return m.reply(`✅ مرحباً بك في النقابة! أنت الآن عضو رسمي في *${targetGuild.name}*! ⚔️`);
  }

  if (action === "leave" || action === "مغادرة") {
    if (!user.rpg.guildId) {
      return m.reply(`أنت لست في نقابة! 😂`);
    }

    const myGuild = guilds[user.rpg.guildId];
    if (!myGuild) {
      user.rpg.guildId = null;
      db.save();
      return m.reply(`يبدو أن نقابتك قد حُلّت. تم إعادة تعيين بياناتك.`);
    }

    if (myGuild.leader === m.sender && myGuild.members?.length > 1) {
      return m.reply(`أنت القائد! لا يمكنك مغادرة النقابة وترك الأعضاء. قم بنقل القيادة أو طرد جميع الأعضاء أولاً! 😡`);
    }

    myGuild.members = (myGuild.members || []).filter((m) => m !== m.sender);

    if (myGuild.members.length === 0) {
      delete guilds[user.rpg.guildId];
    }

    const guildName = myGuild.name;
    user.rpg.guildId = null;
    db.save();

    return m.reply(`🏃 غادرت نقابة *${guildName}* وعدت وحيداً!`);
  }

  if (action === "info" || action === "معلومات") {
    if (!user.rpg.guildId) {
      return m.reply(`ليس لديك نقابة! ابحث عن أصدقاء!`);
    }

    const myGuild = guilds[user.rpg.guildId];
    if (!myGuild) {
      return m.reply(`النقابة غير موجودة!`);
    }

    let txt = `🏰 *معلومات النقابة* 🏰\n\n`;
    txt += `👑 الاسم: *${myGuild.name}*\n`;
    txt += `👤 القائد: @${myGuild.leader?.split("@")[0]}\n`;
    txt += `📊 المستوى: *${myGuild.level || 1}*\n`;
    txt += `👥 الأعضاء: *${myGuild.members?.length || 0}/50*\n`;
    txt += `💰 الخزينة: *${(myGuild.treasury || 0).toLocaleString("ar-EG")}* عملة\n`;

    return m.reply(txt, { mentions: [myGuild.leader] });
  }

  if (action === "members" || action === "أعضاء") {
    if (!user.rpg.guildId) {
      return m.reply(`ليس لديك نقابة!`);
    }

    const myGuild = guilds[user.rpg.guildId];
    if (!myGuild) {
      return m.reply(`النقابة غير موجودة!`);
    }

    const memberList = (myGuild.members || [])
      .map((m, i) => {
        const isLeader = m === myGuild.leader ? " 👑" : " 🗡️";
        return `${i + 1}. @${m.split("@")[0]}${isLeader}`;
      })
      .join("\n");

    return m.reply(`👥 *أعضاء ${myGuild.name}*\n\n${memberList}`, { mentions: myGuild.members });
  }

  if (action === "deposit" || action === "تبرع") {
    if (!user.rpg.guildId) {
      return m.reply(`ليس لديك نقابة!`);
    }

    const myGuild = guilds[user.rpg.guildId];
    if (!myGuild) {
      return m.reply(`النقابة غير موجودة!`);
    }

    const amount = parseInt(args[1]) || 0;
    if (amount < 100) {
      return m.reply(`الحد الأدنى للتبرع *100* عملة!`);
    }

    if ((user.koin || 0) < amount) {
      return m.reply(`ليس لديك ما يكفي من المال لهذا التبرع!`);
    }

    user.koin -= amount;
    myGuild.treasury = (myGuild.treasury || 0) + amount;
    db.save();

    return m.reply(`✅ *تم التبرع للخزينة بنجاح!*\n\nتبرعت بمبلغ *${amount.toLocaleString("ar-EG")}* عملة لخزينة النقابة!\nإجمالي الخزينة: *${myGuild.treasury.toLocaleString("ar-EG")}* عملة 🏰💰`);
  }
}

export { pluginConfig as config, handler };