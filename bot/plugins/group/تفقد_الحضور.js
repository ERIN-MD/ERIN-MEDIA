import moment from "moment-timezone";
import config from "../../config.js";
const pluginConfig = {
  name: "تفقد_الحضور",
  alias: ["cekabsen"],
  category: "group",
  description: "عرض قائمة المشاركين المسجلين في الحضور",
  usage: ".تفقد_الحضور",
  example: ".تفقد_الحضور",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};
if (!global.absensi) global.absensi = {};
async function handler(m, { sock }) {
  const chatId = m.chat;
  if (!global.absensi[chatId]) {
    return m.reply(
      `❌ *لا يوجد حضور*\n\n` +
        `> لم تبدأ جلسة حضور بعد!\n\n` +
        `> يمكن للمشرف البدء بـ\n` +
        `> *.بدء_الحضور [وصف]*`,
    );
  }
  const absen = global.absensi[chatId];
  const now = moment().tz("Asia/Jakarta");
  const dateStr = now.format("D MMMM YYYY");
  const createdDate = moment(absen.createdAt).tz("Asia/Jakarta");
  const timeStr = createdDate.format("HH:mm");
  let list = "┃ _لا يوجد حضور بعد_";
  if (absen.peserta.length > 0) {
    list = absen.peserta
      .map((jid, i) => `┃ ${i + 1}. @${jid.split("@")[0]}`)
      .join("\n");
  }
  const saluranId = config.saluran?.id || "120363400911374213@newsletter";
  const saluranName = config.saluran?.name || config.bot?.name || "Maro-AI";
  await m.reply(
    `📋 *قائمة الحضور*\n\n` +
      `╭┈┈⬡「 📋 *معلومات* 」\n` +
      `┃ 📝 ${absen.keterangan}\n` +
      `┃ 📅 ${dateStr}\n` +
      `┃ ⏰ بدأت: ${timeStr}\n` +
      `┃ 👑 بواسطة: @${absen.createdBy.split("@")[0]}\n` +
      `├┈┈⬡「 👥 *الحاضرون (${absen.peserta.length})* 」\n` +
      `${list}\n` +
      `╰┈┈┈┈┈┈┈┈⬡\n\n` +
      `اكتب *${m.prefix}حضور* للتسجيل`,
    { mentions: [...absen.peserta, absen.createdBy] },
  );
}
export { pluginConfig as config, handler };