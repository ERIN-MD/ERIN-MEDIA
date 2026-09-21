import config from "../../config.js";
const pluginConfig = {
  name: "بدء_الحضور",
  alias: ["mulaiabsen"],
  category: "group",
  description: "بدء جلسة حضور في المجموعة (للمشرفين فقط)",
  usage: ".بدء_الحضور [وصف]",
  example: ".بدء_الحضور اجتماع اسبوعي",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 10,
  energi: 0,
  isEnabled: true,
  isAdmin: true,
};

if (!global.absensi) global.absensi = {};

async function handler(m, { sock }) {
  const chatId = m.chat;

  if (global.absensi[chatId]) {
    return m.reply(
      `❌ *توجد جلسة حضور بالفعل*\n\n` +
        `> ما زالت هناك جلسة حضور في المجموعة!\n\n` +
        `> اكتب *.مسح_الحضور* للحذف\n` +
        `> أو *.تفقد_الحضور* للاطلاع على القائمة`,
    );
  }

  const keterangan = m.text?.trim() || "حضور يومي";

  global.absensi[chatId] = {
    keterangan: keterangan,
    createdBy: m.sender,
    createdAt: new Date().toISOString(),
    peserta: [],
  };

  const saluranId = config.saluran?.id || "120363400911374213@newsletter";
  const saluranName = config.saluran?.name || config.bot?.name || "Maro-AI";

  await m.reply(
    `📋 *تم بدء جلسة الحضور*\n\n` +
      `「 📋 *معلومات* 」\n` +
      `📝 ${keterangan}\n` +
      `👑 بواسطة: @${m.sender.split("@")[0]}\n` +
      `👥 الحضور: 0\n\n` +
      `للتسجيل في الحضور، اكتب *${m.prefix}حضور*\n` +
      `للاطلاع على القائمة، اكتب *${m.prefix}تفقد_الحضور*\n` +
      `لحذف الجلسة، اكتب *${m.prefix}مسح_الحضور*`,
    { mentions: [m.sender] },
  );
}

export { pluginConfig as config, handler };